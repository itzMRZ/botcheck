// ── AI-First Validate API ─────────────────────────────────────────────────────
// The AI does all analysis. DB is reference context only — not a deterministic engine.

const SYSTEM_PROMPT = `You are BotCheck, a senior robotics hardware engineer reviewing a build.
You receive a specification including what the user is building and their components.

Your job: find real problems and give real advice — like a senior engineer reviewing a schematic.
In addition to finding issues, you MUST provide PROACTIVE RECOMMENDATIONS for passive components or missing infrastructure (e.g., "Add 10k pull-up resistors to the I2C lines", "Add a 1000uF decoupling capacitor across the motor power supply to prevent brownouts", "Use a 74HC4051 multiplexer to expand analog pins for the sensor array").

STRICT ANTI-HALLUCINATION RULES:
- DO NOT make up electrical specifications (voltage limits, current draws). If you do not know a component's exact specs, assume standard logical defaults (e.g., Arduino=5V, ESP32=3.3V) but DO NOT invent numbers. If unsure, advise the user to "check the datasheet" rather than lying.
- DO NOT invent problems. If the power supply matches the motor driver and brain, do not invent a fake undervoltage scenario unless the math explicitly proves it.
- Only mark something as CRITICAL if it is mathematically guaranteed to cause a fire, short circuit, or destroy hardware (e.g., feeding 12V directly into a 3.3V logic pin).

Classify every finding into one of three severities:
- CRITICAL: Will cause hardware damage, fire risk, or complete failure (e.g. supplying 11.1V to an ESP32 that maxes at 5.5V will destroy it instantly)
- WARNING: Works but causes poor performance, reduced lifespan, or intermittent failure (e.g. logic level mismatch, current near the limit)
- IMPROVEMENT: The build functions, but this specific change would meaningfully help it (e.g. using a better driver for efficiency)

Key checks to always perform:
1. VOLTAGE: Does supply voltage match what every component accepts?
2. CURRENT BUDGET: Sum all component peak currents. Does the power source handle it?
3. LOGIC LEVELS: Brain GPIO voltage vs peripheral logic voltage (5V vs 3.3V).
4. MOTOR DRIVER fit: Type (H-bridge/ESC/Stepper), Current headroom, Channel count.
5. USE CASE FIT: Are these components right for what the user is building? (e.g. A Line Follower Robot (LFR) needs an array of IR sensors like QTR-8A, not just a single sensor. Think about pin counts: a QTR-8A uses 8 analog pins, an Arduino Uno only has 6, so a multiplexer is recommended!).
6. MISSING COMPONENTS: Flag obvious missing things as warnings (e.g., missing motor drivers when DC motors are present).

Scoring:
- Start at 100
- CRITICAL: -30 each (capped at -60)
- WARNING: -12 each (capped at -36)
- READY_TO_BUILD >= 75, NEEDS_REVIEW 45-74, NOT_RECOMMENDED < 45

Return ONLY via render_botcheck_result tool call. No extra text.`;

const resultTool = {
  type: "function",
  function: {
    name: "render_botcheck_result",
    description: "Structured AI robotics hardware validation result.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["overall", "issues", "recommendations", "components"],
      properties: {
        overall: {
          type: "object",
          additionalProperties: false,
          required: ["score", "verdict", "summary"],
          properties: {
            score:   { type: "integer", description: "0-100 overall build health score." },
            verdict: { type: "string", enum: ["READY_TO_BUILD", "NEEDS_REVIEW", "NOT_RECOMMENDED"] },
            summary: { type: "string", description: "2-3 sentence plain-English assessment of the build." },
          },
        },
        issues: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["severity", "category", "title", "detail", "fix"],
            properties: {
              severity: { type: "string", enum: ["CRITICAL", "WARNING", "IMPROVEMENT"] },
              category: { type: "string", description: "e.g. Power, Logic Level, Current, Motor Driver, Sensor, Communication" },
              title:    { type: "string", description: "Max 8 words. Direct problem statement." },
              detail:   { type: "string", description: "1-2 sentences. Include actual numbers. Explain WHY it is a problem." },
              fix:      { type: ["string", "null"], description: "Actionable fix with part name if applicable." },
            },
          },
        },
        recommendations: {
          type: "array",
          description: "Proactive recommendations for passive components (capacitors, resistors, multiplexers, logic shifters) required for this specific build to be stable.",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description", "component"],
            properties: {
              title: { type: "string", description: "Short title (e.g. 'Add Decoupling Capacitor')" },
              description: { type: "string", description: "Why it's needed (e.g. 'Absorbs voltage spikes from the TT motors.')" },
              component: { type: "string", description: "Specific part (e.g. '1000uF 16V Electrolytic Capacitor')" }
            }
          }
        },
        components: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "role", "status", "note"],
            properties: {
              name:   { type: "string" },
              role:   { type: "string" },
              status: { type: "string", enum: ["OK", "WARNING", "CRITICAL", "UNKNOWN"] },
              note:   { type: "string" },
            },
          },
        },
      },
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured on the server.",
      code: "MISSING_KEY",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      brain,
      power,
      drivers = [],
      motors  = [],
      sensors = [],
      comms   = [],
      robotType   = "",
      projectDesc = "",
    } = body;

    if (!brain || !power || motors.length === 0) {
      return res.status(400).json({
        error: "brain, power, and at least one motor are required.",
        code: "MISSING_FIELDS",
      });
    }

    const userMsg = buildMessage({ brain, power, drivers, motors, sensors, comms, robotType, projectDesc });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:       process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.15,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMsg },
        ],
        tools:       [resultTool],
        tool_choice: { type: "function", function: { name: "render_botcheck_result" } },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message ?? "OpenAI API request failed.",
        code:  "OPENAI_ERROR",
      });
    }

    return res.status(200).json(parseResult(data));

  } catch (err) {
    return res.status(500).json({
      error: err.message ?? "Internal server error.",
      code:  "SERVER_ERROR",
    });
  }
}

function buildMessage({ brain, power, drivers, motors, sensors, comms, robotType, projectDesc }) {
  const lines = [];

  if (robotType || projectDesc) {
    lines.push("=== PROJECT CONTEXT ===");
    if (robotType)   lines.push(`Type: ${robotType}`);
    if (projectDesc) lines.push(`Description/Target Speed: ${projectDesc}`);
    lines.push("");
  }

  lines.push("=== BUILD SPECIFICATION ===");
  lines.push(`Brain / Controller: ${brain}`);
  lines.push(`Power Source: ${power}`);

  lines.push(`\nMotor Controllers / Drivers (${drivers.length || "none"}):`);
  if (drivers.length === 0) lines.push("  None");
  else drivers.forEach((d, i) => lines.push(`  ${i + 1}. ${d}`));

  lines.push(`\nMotors (${motors.length}):`);
  motors.forEach((m, i) => lines.push(`  ${i + 1}. ${m}`));

  lines.push(`\nSensors (${sensors.length || "none"}):`);
  if (sensors.length === 0) lines.push("  None");
  else sensors.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));

  lines.push(`\nCommunication (${comms.length || "none"}):`);
  if (comms.length === 0) lines.push("  None");
  else comms.forEach((c, i) => lines.push(`  ${i + 1}. ${c}`));

  lines.push("\n=== YOUR TASK ===");
  lines.push("Analyse this build as a senior hardware engineer. Check voltages, currents, logic levels, driver fit, use-case appropriateness, and missing components. Give specific, numbered findings with actual values.");

  return lines.join("\n");
}

function parseResult(data) {
  const msg  = data.choices?.[0]?.message;
  const call = msg?.tool_calls?.find(c => c.function?.name === "render_botcheck_result");
  const raw  = call?.function?.arguments ?? msg?.content;
  if (!raw) throw new Error("AI returned no structured result. Please retry.");
  return JSON.parse(raw);
}
