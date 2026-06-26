// ── Component Database ────────────────────────────────────────────────────────

const DB = {
  brains: {
    "Arduino Uno":          { logic_v: 5.0, min_vin: 7.0,  max_vin: 12.0, weight_kg: 0.025, gpio_5v: true  },
    "Arduino Nano":         { logic_v: 5.0, min_vin: 7.0,  max_vin: 12.0, weight_kg: 0.007, gpio_5v: true  },
    "Arduino Mega 2560":    { logic_v: 5.0, min_vin: 7.0,  max_vin: 12.0, weight_kg: 0.037, gpio_5v: true  },
    "ESP32":                { logic_v: 3.3, min_vin: 4.5,  max_vin: 5.5,  weight_kg: 0.010, gpio_5v: false },
    "ESP8266 NodeMCU":      { logic_v: 3.3, min_vin: 4.5,  max_vin: 5.5,  weight_kg: 0.009, gpio_5v: false },
    "Raspberry Pi Zero 2W": { logic_v: 3.3, min_vin: 5.0,  max_vin: 5.25, weight_kg: 0.019, gpio_5v: false },
    "Raspberry Pi 4B":      { logic_v: 3.3, min_vin: 5.0,  max_vin: 5.25, weight_kg: 0.046, gpio_5v: false },
    "STM32 Blue Pill":      { logic_v: 3.3, min_vin: 3.0,  max_vin: 3.6,  weight_kg: 0.008, gpio_5v: false },
    "Teensy 4.0":           { logic_v: 3.3, min_vin: 3.3,  max_vin: 5.5,  weight_kg: 0.009, gpio_5v: false },
    "Arduino Pro Mini 5V":  { logic_v: 5.0, min_vin: 5.0,  max_vin: 5.5,  weight_kg: 0.003, gpio_5v: true  },
    "Arduino Pro Mini 3.3V":{ logic_v: 3.3, min_vin: 3.3,  max_vin: 3.6,  weight_kg: 0.003, gpio_5v: false },
  },

  motors: {
    "SG90 Micro Servo":    { type: "servo",   op_v: 4.8,  max_v: 6.0,  stall_a: 0.50,  weight_kg: 0.009 },
    "MG996R Servo":        { type: "servo",   op_v: 4.8,  max_v: 7.2,  stall_a: 2.50,  weight_kg: 0.055 },
    "N20 Gear Motor":      { type: "dc",      op_v: 6.0,  max_v: 6.0,  stall_a: 1.20,  weight_kg: 0.015 },
    "TT Gear Motor":       { type: "dc",      op_v: 3.0,  max_v: 6.0,  stall_a: 1.50,  weight_kg: 0.030 },
    "775 DC Motor":        { type: "dc",      op_v: 12.0, max_v: 18.0, stall_a: 5.00,  weight_kg: 0.200 },
    "28BYJ-48 Stepper":    { type: "stepper", op_v: 5.0,  max_v: 5.0,  stall_a: 0.32,  weight_kg: 0.030 },
    "NEMA 17 Stepper":     { type: "stepper", op_v: 12.0, max_v: 24.0, stall_a: 1.70,  weight_kg: 0.280 },
    "Brushless 2204 BLDC": { type: "bldc",    op_v: 11.1, max_v: 14.8, stall_a: 12.0,  weight_kg: 0.025 },
    "Brushless 2212 BLDC": { type: "bldc",    op_v: 11.1, max_v: 22.2, stall_a: 20.0,  weight_kg: 0.052 },
  },

  motorDrivers: {
    "L298N":     { type: "h-bridge", max_v: 46.0, max_a_per_ch: 2.0,  channels: 2, logic_v: 5.0, weight_kg: 0.030 },
    "L293D":     { type: "h-bridge", max_v: 36.0, max_a_per_ch: 0.6,  channels: 4, logic_v: 5.0, weight_kg: 0.005 },
    "DRV8833":   { type: "h-bridge", max_v: 10.8, max_a_per_ch: 1.5,  channels: 2, logic_v: 3.3, weight_kg: 0.001 },
    "TB6612FNG": { type: "h-bridge", max_v: 15.0, max_a_per_ch: 1.2,  channels: 2, logic_v: 3.3, weight_kg: 0.002 },
    "DRV8825":   { type: "stepper",  max_v: 45.0, max_a_per_ch: 2.2,  channels: 1, logic_v: 3.3, weight_kg: 0.003 },
    "A4988":     { type: "stepper",  max_v: 35.0, max_a_per_ch: 1.0,  channels: 1, logic_v: 5.0, weight_kg: 0.002 },
    "BTS7960":   { type: "h-bridge", max_v: 27.0, max_a_per_ch: 43.0, channels: 1, logic_v: 5.0, weight_kg: 0.025 },
    "ESC 30A":   { type: "esc",      max_v: 14.8, max_a_per_ch: 30.0, channels: 1, logic_v: 5.0, weight_kg: 0.035 },
    "ESC 20A":   { type: "esc",      max_v: 14.8, max_a_per_ch: 20.0, channels: 1, logic_v: 5.0, weight_kg: 0.022 },
  },

  sensors: {
    "HC-SR04 Ultrasonic":    { op_v: 5.0, max_v: 5.5, logic_v: 5.0, weight_kg: 0.009 },
    "HC-SR501 PIR":          { op_v: 5.0, max_v: 12.0,logic_v: 3.3, weight_kg: 0.006 },
    "MPU-6050 IMU":          { op_v: 3.3, max_v: 5.0, logic_v: 3.3, weight_kg: 0.003 },
    "BMP280 Barometer":      { op_v: 3.3, max_v: 3.6, logic_v: 3.3, weight_kg: 0.001 },
    "NEO-6M GPS":            { op_v: 3.3, max_v: 5.0, logic_v: 3.3, weight_kg: 0.020 },
    "OV2640 Camera":         { op_v: 3.3, max_v: 3.6, logic_v: 3.3, weight_kg: 0.015 },
    "Line Sensor (TCRT5000)":{ op_v: 5.0, max_v: 5.5, logic_v: 5.0, weight_kg: 0.002 },
    "Encoder (Optical)":     { op_v: 5.0, max_v: 5.5, logic_v: 5.0, weight_kg: 0.003 },
    "TCS34725 Color Sensor": { op_v: 3.3, max_v: 5.0, logic_v: 3.3, weight_kg: 0.001 },
    "VL53L0X ToF Sensor":    { op_v: 3.3, max_v: 3.3, logic_v: 1.8, weight_kg: 0.001 },
  },

  comms: {
    "HC-05 Bluetooth": { op_v: 3.3, max_v: 5.0, logic_v: 3.3, weight_kg: 0.003 },
    "HC-06 Bluetooth": { op_v: 3.3, max_v: 5.0, logic_v: 3.3, weight_kg: 0.003 },
    "NRF24L01":        { op_v: 3.3, max_v: 3.6, logic_v: 3.3, weight_kg: 0.001 },
    "LoRa SX1278":     { op_v: 3.3, max_v: 3.6, logic_v: 3.3, weight_kg: 0.004 },
    "SIM800L GSM":     { op_v: 3.7, max_v: 4.2, logic_v: 3.3, weight_kg: 0.006 },
    "ESP-01 WiFi":     { op_v: 3.3, max_v: 3.6, logic_v: 3.3, weight_kg: 0.002 },
  },

  power: {
    "1S LiPo (3.7V)":   { voltage: 3.7,  capacity_mah: 1000,  max_a: 10,  weight_kg: 0.030 },
    "2S LiPo (7.4V)":   { voltage: 7.4,  capacity_mah: 2200,  max_a: 30,  weight_kg: 0.120 },
    "3S LiPo (11.1V)":  { voltage: 11.1, capacity_mah: 2200,  max_a: 30,  weight_kg: 0.130 },
    "4S LiPo (14.8V)":  { voltage: 14.8, capacity_mah: 3000,  max_a: 60,  weight_kg: 0.210 },
    "5V USB Power Bank": { voltage: 5.0,  capacity_mah: 10000, max_a: 2,   weight_kg: 0.150 },
    "7.2V NiMH Pack":   { voltage: 7.2,  capacity_mah: 3000,  max_a: 15,  weight_kg: 0.200 },
    "9V PP3 Battery":   { voltage: 9.0,  capacity_mah: 500,   max_a: 1.5, weight_kg: 0.046 },
    "12V Lead Acid":    { voltage: 12.0, capacity_mah: 7000,  max_a: 20,  weight_kg: 1.200 },
    "18650 Cell (3.7V)":{ voltage: 3.7,  capacity_mah: 3000,  max_a: 10,  weight_kg: 0.047 },
    "2x 18650 (7.4V)":  { voltage: 7.4,  capacity_mah: 6000,  max_a: 20,  weight_kg: 0.094 },
  },
};

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are BotCheck, an expert robotics hardware compatibility validation engine.

Each component is tagged [DB] (exact specs provided) or [CUSTOM] (infer from training knowledge; state "unknown" only if truly unrecognizable).

Validate all 7 domains and call render_botcheck_result:

1. POWER — Is supply voltage safe for every component?
   • supply → brain VIN range
   • supply (or regulated driver output) → each motor operating voltage
   • supply → each sensor/comm operating range
   • CRITICAL = confirmed damage risk; WARNING = marginal or needs regulator

2. MOTOR DRIVER — Does the driver fit this build?
   • driver input voltage vs. supply
   • driver current per channel vs. each motor stall current
   • driver channel count vs. motor count (one channel per bidirectional motor)
   • driver logic level vs. brain GPIO level
   • If no driver: servos are PWM-driven directly; DC motors connected direct = flag if supply > motor max_v

3. COMPATIBILITY — System-level coherence
   • Brain GPIO logic level vs. ALL peripheral logic levels
   • Flag NEEDS_LEVEL_SHIFTER if 5V GPIO drives 3.3V peripherals or vice versa
   • Sum estimated peak current of all components vs. power max_a
   • Note if a 5V BEC/regulator is needed for servo rail from LiPo

4. SENSORS — Sensor-specific checks
   • Each sensor op_v vs. available rail (3.3V or 5V from brain/regulator)
   • Each sensor logic_v vs. brain GPIO
   • Note any protocol notes (I2C pull-ups, ADC range, etc.)

5. WEIGHT — Estimate total
   • Sum known weights; estimate [CUSTOM] components from typical values
   • ULTRALIGHT <100g | LIGHT 100–300g | BALANCED 300–800g | HEAVY 800g–2kg | VERY_HEAVY >2kg

6. FIX — If issues exist, single most impactful part swap (be specific: name + key spec)

7. SUMMARY — score 0–100, verdict, highlights
   • Deductions: overvoltage risk −30, undervoltage −20, logic mismatch −15 each, current overload −25, channel shortage −10, missing driver for high-current motors −15
   • READY_TO_BUILD ≥80 | NEEDS_REVIEW 50–79 | NOT_RECOMMENDED <50
   • highlights: 3–5 items mixing positives and issues

Return ONLY via render_botcheck_result. Terse, numeric, no filler.`;

// ── AI Tool Schema ────────────────────────────────────────────────────────────

const resultTool = {
  type: "function",
  function: {
    name: "render_botcheck_result",
    description: "Structured robotics hardware validation result covering all 7 check domains.",
    strict: true,
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["power", "motorDriver", "compatibility", "sensors", "weight", "fix", "summary"],
      properties: {
        power: {
          type: "object",
          additionalProperties: false,
          required: ["status", "headline", "reason"],
          properties: {
            status:   { type: "string", enum: ["SAFE", "WARNING", "CRITICAL"] },
            headline: { type: "string", description: "Max 10 words." },
            reason:   { type: "string", description: "2–3 sentences covering all power chain issues." },
          },
        },
        motorDriver: {
          type: "object",
          additionalProperties: false,
          required: ["present", "compatible", "channel_note", "note"],
          properties: {
            present:      { type: "boolean" },
            compatible:   { type: ["boolean", "null"] },
            channel_note: { type: ["string", "null"], description: "Channel / current capacity note, or null." },
            note:         { type: "string" },
          },
        },
        compatibility: {
          type: "object",
          additionalProperties: false,
          required: ["logic_match", "logic_note", "current_ok", "current_note"],
          properties: {
            logic_match:  { type: "string", enum: ["OK", "MISMATCH", "NEEDS_LEVEL_SHIFTER"] },
            logic_note:   { type: "string" },
            current_ok:   { type: "boolean" },
            current_note: { type: "string" },
          },
        },
        sensors: {
          type: "object",
          additionalProperties: false,
          required: ["all_ok", "issues", "note"],
          properties: {
            all_ok: { type: "boolean" },
            issues: { type: "array", items: { type: "string" }, description: "One issue string per sensor problem." },
            note:   { type: "string" },
          },
        },
        weight: {
          type: "object",
          additionalProperties: false,
          required: ["rating", "estimated_kg", "note"],
          properties: {
            rating:       { type: "string", enum: ["ULTRALIGHT", "LIGHT", "BALANCED", "HEAVY", "VERY_HEAVY"] },
            estimated_kg: { type: "number" },
            note:         { type: "string" },
          },
        },
        fix: {
          type: "object",
          additionalProperties: false,
          required: ["needed", "part", "spec", "why"],
          properties: {
            needed: { type: "boolean" },
            part:   { type: ["string", "null"] },
            spec:   { type: ["string", "null"] },
            why:    { type: ["string", "null"] },
          },
        },
        summary: {
          type: "object",
          additionalProperties: false,
          required: ["score", "verdict", "highlights"],
          properties: {
            score:      { type: "integer", description: "0–100 overall build health." },
            verdict:    { type: "string", enum: ["READY_TO_BUILD", "NEEDS_REVIEW", "NOT_RECOMMENDED"] },
            highlights: {
              type: "array",
              items: { type: "string" },
              description: "3–5 key findings; mix of positives and issues.",
            },
          },
        },
      },
    },
  },
};

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY", code: "MISSING_OPENAI_API_KEY" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const {
      brain: brainName,
      power: powerName,
      motorDriver: mdName,
      motors  = [],
      sensors = [],
      comms   = [],
    } = body;

    if (!brainName || !powerName || motors.length === 0) {
      return res.status(400).json({
        error: "brain, power, and at least one motor are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    // DB lookups (null = custom component)
    const brain      = DB.brains[brainName]      ?? null;
    const power      = DB.power[powerName]        ?? null;
    const md         = (mdName && mdName !== "None") ? (DB.motorDrivers[mdName] ?? null) : null;
    const motorSpecs  = motors.map(n  => DB.motors[n]   ?? null);
    const sensorSpecs = sensors.map(n => DB.sensors[n]  ?? null);
    const commsSpecs  = comms.map(n   => DB.comms[n]    ?? null);

    // Sum known component weights
    let knownWeight = 0;
    for (const s of [brain, power, md, ...motorSpecs, ...sensorSpecs, ...commsSpecs]) {
      if (s?.weight_kg) knownWeight += s.weight_kg;
    }

    // Pre-compute deterministic flags
    const flags = [];
    if (brain && power) {
      if (power.voltage > brain.max_vin)
        flags.push(`BRAIN_OVERVOLTAGE: ${power.voltage}V supply > brain max VIN ${brain.max_vin}V`);
      if (power.voltage < brain.min_vin)
        flags.push(`BRAIN_UNDERVOLTAGE: ${power.voltage}V supply < brain min VIN ${brain.min_vin}V`);
    }
    if (md && power && power.voltage > md.max_v)
      flags.push(`DRIVER_OVERVOLTAGE: ${power.voltage}V supply > driver max ${md.max_v}V`);
    if (md && md.channels < motors.length)
      flags.push(`DRIVER_CHANNEL_SHORTAGE: ${md.channels}ch driver for ${motors.length} motors`);
    motorSpecs.forEach((m, i) => {
      if (!m || md) return; // if driver present, AI assesses the regulated output
      if (power && power.voltage > m.max_v)
        flags.push(`MOTOR_DIRECT_OVERVOLTAGE: ${motors[i]} max ${m.max_v}V, supply ${power.voltage}V (no driver)`);
    });

    const userMsg = buildMessage(
      { brainName, powerName, mdName, motors, sensors, comms },
      { brain, power, md, motorSpecs, sensorSpecs, commsSpecs },
      { knownWeight: +knownWeight.toFixed(3), flags },
    );

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user",   content: userMsg },
        ],
        tools: [resultTool],
        tool_choice: { type: "function", function: { name: "render_botcheck_result" } },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message ?? "OpenAI request failed",
        code: "OPENAI_REQUEST_FAILED",
      });
    }

    return res.status(200).json(parseToolResult(data));
  } catch (err) {
    return res.status(400).json({
      error: err.message ?? "Invalid request",
      code: "BOTCHECK_FAILED",
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders one component's spec line. Marks unknown as [CUSTOM].
 */
function specLine(obj, fields) {
  if (!obj) return "[CUSTOM — infer from training knowledge]";
  const parts = fields
    .map(([key, unit]) => obj[key] !== undefined ? `${key}:${obj[key]}${unit}` : null)
    .filter(Boolean);
  return `[DB] ${parts.join(" | ")}`;
}

function buildMessage(names, specs, pre) {
  const { brainName, powerName, mdName, motors, sensors, comms } = names;
  const { brain, power, md, motorSpecs, sensorSpecs, commsSpecs } = specs;
  const lines = ["=== ROBOTICS BUILD SPECIFICATION ===\n"];

  lines.push(`BRAIN: ${brainName}`);
  lines.push(`  ${specLine(brain, [["logic_v","V"],["min_vin","V min"],["max_vin","V max"],["gpio_5v","gpio"],["weight_kg","kg"]])}`);

  lines.push(`\nPOWER: ${powerName}`);
  lines.push(`  ${specLine(power, [["voltage","V"],["max_a","A max"],["capacity_mah","mAh"],["weight_kg","kg"]])}`);

  const driverName = (mdName && mdName !== "None") ? mdName : null;
  lines.push(`\nMOTOR DRIVER: ${driverName ?? "None"}`);
  if (driverName) {
    lines.push(`  ${specLine(md, [["type",""],["max_v","V"],["max_a_per_ch","A/ch"],["channels","ch"],["logic_v","V logic"],["weight_kg","kg"]])}`);
  }

  lines.push(`\nMOTORS (${motors.length}):`);
  motors.forEach((name, i) => {
    lines.push(`  ${i + 1}. ${name}`);
    lines.push(`     ${specLine(motorSpecs[i], [["type",""],["op_v","V op"],["max_v","V max"],["stall_a","A stall"],["weight_kg","kg"]])}`);
  });

  lines.push(`\nSENSORS (${sensors.length || "none"}):`);
  if (sensors.length === 0) {
    lines.push("  None");
  } else {
    sensors.forEach((name, i) => {
      lines.push(`  ${i + 1}. ${name}`);
      lines.push(`     ${specLine(sensorSpecs[i], [["op_v","V op"],["logic_v","V logic"],["weight_kg","kg"]])}`);
    });
  }

  lines.push(`\nCOMMUNICATION (${comms.length || "none"}):`);
  if (comms.length === 0) {
    lines.push("  None");
  } else {
    comms.forEach((name, i) => {
      lines.push(`  ${i + 1}. ${name}`);
      lines.push(`     ${specLine(commsSpecs[i], [["op_v","V op"],["logic_v","V logic"],["weight_kg","kg"]])}`);
    });
  }

  lines.push(`\n=== PRE-COMPUTED FLAGS ===`);
  lines.push(`Known weight sum: ${pre.knownWeight} kg`);
  if (pre.flags.length > 0) {
    lines.push(`Deterministic issues (${pre.flags.length}):`);
    pre.flags.forEach(f => lines.push(`  ⚠ ${f}`));
  } else {
    lines.push("No deterministic conflicts (verify any [CUSTOM] components independently).");
  }

  return lines.join("\n");
}

function parseToolResult(data) {
  const msg  = data.choices?.[0]?.message;
  const call = msg?.tool_calls?.find(c => c.function?.name === "render_botcheck_result");
  const raw  = call?.function?.arguments ?? msg?.content;
  if (!raw) throw new Error("AI returned no structured BotCheck result");
  return JSON.parse(raw);
}
