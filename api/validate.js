// ── AI-First Validate API ─────────────────────────────────────────────────────
// The AI does all analysis. DB is reference context only — not a deterministic engine.

const SYSTEM_PROMPT = `You are BotCheck, a helpful, pragmatic, and encouraging robotics hardware mentor.
Your job is to review the user's build and provide constructive, realistic advice. 

CRITICAL RULE: DO NOT BE OVERLY CRITICAL OR NITPICKY. 
Most standard hobbyist hardware works fine together. Unless there is a massive, blatant error (e.g., plugging 24V directly into a 3.3V pin), you MUST assume the components are compatible and the user is using them correctly (e.g., using the VIN pin).

COMMON SENSE HARDWARE RULES (DO NOT FLAG THESE AS ERRORS):
- Arduinos (Uno, Nano, Mega) can safely take 7V-12V on their VIN pin. A 7.4V or 11.1V LiPo is PERFECTLY FINE for an Arduino. Do not complain about it.
- Motor drivers like L298N, TB6612FNG, and BTS7960 are designed to handle 7.4V to 12V+. Do not complain about these voltages.
- Standard hobby motors (N20, JGA25, TT) run fine on 7.4V to 12V.
- If an ESP32 is used with a 7.4V or 11.1V battery, assume the user will use a standard buck converter (LM2596) or the dev board's onboard regulator. Suggest a buck converter as an IMPROVEMENT, but DO NOT mark it as a CRITICAL error.

STRICT ANTI-HALLUCINATION RULES:
- DO NOT make up electrical specifications (voltage limits, current draws).
- DO NOT invent theoretical problems, edge-case thermal issues, or fake undervoltage scenarios.
- Only mark something as CRITICAL if it is mathematically guaranteed to cause a fire or destroy hardware immediately.

Classify every finding into one of three severities:
- CRITICAL: Guaranteed hardware destruction.
- WARNING: Meaningful performance issue (e.g., driver cannot supply enough current for the chosen motors).
- IMPROVEMENT: The build is fine, but a specific part would make it better.

In addition to finding any *real* issues, provide PROACTIVE RECOMMENDATIONS for passive components (e.g., "Add 1000uF decoupling capacitor to motor power").

Scoring:
- Start at 100 (Most common preset builds should score 90-100).
- CRITICAL: -20 each
- WARNING: -10 each
- READY_TO_BUILD >= 80, NEEDS_REVIEW 50-79, NOT_RECOMMENDED < 50

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
