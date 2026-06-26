const DB = {
  brains: {
    "Arduino Uno": { logic_v: 5.0, min_vin: 7.0, max_vin: 12.0, weight_kg: 0.025 },
    "ESP32": { logic_v: 3.3, min_vin: 4.5, max_vin: 5.5, weight_kg: 0.010 },
  },
  actuators: {
    "SG90 Micro Servo": { op_v: 5.0, max_v: 6.0, current_a: 0.500, weight_kg: 0.009 },
    "N20 Gear Motor": { op_v: 6.0, max_v: 6.0, current_a: 1.200, weight_kg: 0.015 },
  },
  power: {
    "3S LiPo (11.1V)": { voltage: 11.1, weight_kg: 0.130 },
    "1S LiPo (3.7V)": { voltage: 3.7, weight_kg: 0.030 },
    "5V Power Bank": { voltage: 5.0, weight_kg: 0.150 },
  },
};

const SYSTEM_PROMPT = `You are BotCheck, a robotics hardware validation engine.
Use only the supplied component data and pre-computed error flags.
Do not invent hardware specs, current ratings, battery capacities, or components beyond the requested fix part.
Return your result only by calling the render_botcheck_result tool.
Keep wording terse, numeric, and suitable for UI cards.`;

const resultTool = {
  type: "function",
  function: {
    name: "render_botcheck_result",
    description: "Render structured robotics hardware validation feedback.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["power", "fix", "compatibility", "weight"],
      properties: {
        power: {
          type: "object",
          additionalProperties: false,
          required: ["status", "headline", "reason"],
          properties: {
            status: { type: "string", enum: ["SAFE", "WARNING", "CRITICAL"] },
            headline: { type: "string", description: "Max 10 words." },
            reason: { type: "string", description: "Exactly 2 sentences." },
          },
        },
        fix: {
          type: "object",
          additionalProperties: false,
          required: ["needed", "part", "spec", "why"],
          properties: {
            needed: { type: "boolean" },
            part: { type: ["string", "null"] },
            spec: { type: ["string", "null"] },
            why: { type: ["string", "null"] },
          },
        },
        compatibility: {
          type: "object",
          additionalProperties: false,
          required: ["logic_match", "logic_note", "current_ok", "current_note"],
          properties: {
            logic_match: { type: "string", enum: ["OK", "MISMATCH"] },
            logic_note: { type: "string" },
            current_ok: { type: "boolean" },
            current_note: { type: "string" },
          },
        },
        weight: {
          type: "object",
          additionalProperties: false,
          required: ["rating", "note"],
          properties: {
            rating: { type: "string", enum: ["ULTRALIGHT", "LIGHT", "BALANCED", "HEAVY"] },
            note: { type: "string" },
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
      error: "Missing OPENAI_API_KEY",
      code: "MISSING_OPENAI_API_KEY",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const selection = getSelection(body);
    const checks = runChecks(selection.brain, selection.actuator, selection.power);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserMessage(selection, checks) },
        ],
        tools: [resultTool],
        tool_choice: { type: "function", function: { name: "render_botcheck_result" } },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI request failed",
        code: "OPENAI_REQUEST_FAILED",
      });
    }

    const result = parseToolResult(data);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Invalid BotCheck request",
      code: "BOTCHECK_VALIDATION_FAILED",
    });
  }
}

function getSelection(body) {
  const brainName = body?.brainName;
  const actuatorName = body?.actuatorName;
  const powerName = body?.powerName;
  const brain = DB.brains[brainName];
  const actuator = DB.actuators[actuatorName];
  const power = DB.power[powerName];

  if (!brain || !actuator || !power) {
    throw new Error("Unknown component selection");
  }

  return { brainName, actuatorName, powerName, brain, actuator, power };
}

function runChecks(brain, actuator, power) {
  const errors = [];
  const weight = +(brain.weight_kg + actuator.weight_kg + power.weight_kg).toFixed(3);

  if (power.voltage > actuator.max_v) {
    errors.push({
      code: "CRITICAL_OVERVOLTAGE",
      detail: `${power.voltage}V supply exceeds actuator max of ${actuator.max_v}V`,
    });
  }

  if (power.voltage < brain.min_vin) {
    errors.push({
      code: "UNDERVOLTAGE_BROWNOUT",
      detail: `${power.voltage}V supply is below brain minimum of ${brain.min_vin}V`,
    });
  }

  return { weight, errors, status: errors.length === 0 ? "PASS" : "FAIL" };
}

function buildUserMessage(selection, checks) {
  const errors = checks.errors.length
    ? checks.errors.map((error) => `${error.code}: ${error.detail}`).join("; ")
    : "NONE";

  return `Brain: ${selection.brainName} - logic ${selection.brain.logic_v}V, VIN range ${selection.brain.min_vin}-${selection.brain.max_vin}V, ${selection.brain.weight_kg}kg
Actuator: ${selection.actuatorName} - operating ${selection.actuator.op_v}V, max ${selection.actuator.max_v}V, ${selection.actuator.current_a}A, ${selection.actuator.weight_kg}kg
Power: ${selection.powerName} - ${selection.power.voltage}V, ${selection.power.weight_kg}kg
Total weight: ${checks.weight}kg
Pre-computed status: ${checks.status}
Pre-computed errors: ${errors}
If no source current rating is supplied, set current_ok to false and say the current rating is not listed.`;
}

function parseToolResult(data) {
  const message = data.choices?.[0]?.message;
  const toolCall = message?.tool_calls?.find((call) => call.function?.name === "render_botcheck_result");
  const raw = toolCall?.function?.arguments || message?.content;

  if (!raw) {
    throw new Error("No structured BotCheck result returned");
  }

  return JSON.parse(raw);
}
