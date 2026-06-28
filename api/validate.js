// ── AI-First Validate API ─────────────────────────────────────────────────────
// The AI does all analysis. DB is reference context only — not a deterministic engine.

const SYSTEM_PROMPT = `You are BotCheck, a senior robotics hardware engineer reviewing a build.
You receive a specification including what the user is building and their components.

Your job: find real problems and give real advice — like a senior engineer reviewing a schematic.

Classify every finding into one of three severities:
- CRITICAL: Will cause hardware damage, fire risk, or complete failure (e.g. supplying 11.1V to an ESP32 that maxes at 5.5V will destroy it instantly)
- WARNING: Works but causes poor performance, reduced lifespan, or intermittent failure (e.g. logic level mismatch, current near the limit)
- IMPROVEMENT: The build functions, but this specific change would meaningfully help it (e.g. adding a decoupling capacitor, using a better driver for efficiency)

Key checks to always perform:
1. VOLTAGE: Does supply voltage match what every component accepts?
   - Brain: check supply vs VIN range. Many microcontrollers need 5V regulated, not raw LiPo.
   - Sensors/comms: each has an operating voltage — check the supply rail available to them.
   - Motors: check the voltage seen at motor terminals.
2. CURRENT BUDGET: Sum all component peak currents. Does the power source handle it?
   - Motor stall current is the worst case. Multiple motors compound this.
   - Flag if power source max current is close to or below total.
3. LOGIC LEVELS: Brain GPIO voltage vs peripheral logic voltage.
   - 5V Arduino driving 3.3V sensor inputs = can damage the sensor. Needs level shifter.
   - 3.3V brain driving 5V-only peripherals = signal won't register correctly.
4. MOTOR DRIVER fit:
   - Type: H-bridge for DC motors, ESC for BLDC, stepper driver (A4988/DRV8825) for steppers, PWM direct for servos.
   - Current per channel vs motor stall current. Must have headroom.
   - Channel count vs motor count.
   - Driver logic level vs brain GPIO level.
5. USE CASE FIT: Are these components right for what the user is building?
   - A drone needs ESCs + BLDC + flight controller — flag mismatches.
   - A line follower doesn't need a 30A ESC.
6. MISSING COMPONENTS: If the build obviously needs something not listed, flag it as a warning (e.g. no capacitor across motor power, no regulator between LiPo and 5V MCU).

Scoring:
- Start at 100
- CRITICAL: -30 each (capped at -60 total deduction from criticals)
- WARNING: -12 each (capped at -36)
- No improvements found beyond 3: -3 each extra
- READY_TO_BUILD >= 75, NEEDS_REVIEW 45-74, NOT_RECOMMENDED < 45

For components you don't recognize: use your training knowledge to infer their specs. Make a confident engineering judgment — don't say "unknown" unless the name is completely meaningless.

Be specific: use actual voltages, currents, and part numbers. Write like an engineer, not a chatbot.

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
      required: ["overall", "issues", "components"],
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
              category: { type: "string", description: "One of: Power, Logic Level, Current, Motor Driver, Sensor, Communication, Use Case, Missing Component, Other" },
              title:    { type: "string", description: "Max 8 words. Direct problem statement." },
              detail:   { type: "string", description: "1-2 sentences. Include actual numbers (voltages, currents). Explain WHY it is a problem." },
              fix:      { type: ["string", "null"], description: "Specific actionable fix with part name if applicable. Null if no fix needed." },
            },
          },
        },
        components: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "role", "status", "note"],
            properties: {
              name:   { type: "string", description: "Component name as provided by user." },
              role:   { type: "string", description: "Its role in the build (e.g. Microcontroller, Main Power, Motor Driver)." },
              status: { type: "string", enum: ["OK", "WARNING", "CRITICAL", "UNKNOWN"] },
              note:   { type: "string", description: "One sentence: operating voltage, key spec, or what to watch for." },
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
      motorDriver = "None",
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

    const userMsg = buildMessage({ brain, power, motorDriver, motors, sensors, comms, robotType, projectDesc });

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

function buildMessage({ brain, power, motorDriver, motors, sensors, comms, robotType, projectDesc }) {
  const lines = [];

  if (robotType || projectDesc) {
    lines.push("=== PROJECT CONTEXT ===");
    if (robotType)   lines.push(`Type: ${robotType}`);
    if (projectDesc) lines.push(`Description: ${projectDesc}`);
    lines.push("");
  }

  lines.push("=== BUILD SPECIFICATION ===");
  lines.push(`Brain / Controller: ${brain}`);
  lines.push(`Power Source: ${power}`);
  lines.push(`Motor Driver / ESC: ${motorDriver}`);

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
