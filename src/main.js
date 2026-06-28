import './style.css';
import { state, applyPreset } from './state.js';
import { initPickers, renderResults } from './ui.js';
import { validateHardware } from './api.js';

const presets = {
  "Line Follower Robot": { brain: "Arduino Nano", power: "7.4V LiPo", drivers: ["TB6612FNG"], motors: ["N20 Micro Gear"], sensors: ["Pololu QTR-8A"] },
  "Differential Drive": { brain: "Arduino Uno", power: "12V LiPo", drivers: ["L298N Driver"], motors: ["JGA25 DC Motor"], sensors: ["HC-SR04"] },
  "Soccerbot": { brain: "ESP32", power: "11.1V 3S LiPo", drivers: ["BTS7960"], motors: ["JGA25 DC Motor"], sensors: ["MPU6050"] },
  "Maze Solver": { brain: "Teensy 4.1", power: "7.4V LiPo", drivers: ["TB6612FNG"], motors: ["N20 Micro Gear"], sensors: ["HC-SR04", "MPU6050"] },
  "Drone": { brain: "ESP32", power: "11.1V 3S LiPo", drivers: ["30A ESC"], motors: ["2204 BLDC"], sensors: ["MPU6050"] },
  "Arm": { brain: "Arduino Mega", power: "7.4V LiPo", drivers: [], motors: ["MG996R Servos"], sensors: [] },
  "Bipedal": { brain: "Arduino Mega", power: "7.4V LiPo", drivers: [], motors: ["MG996R Servos"], sensors: ["MPU6050"] },
  "Combat Bot": { brain: "ESP32", power: "18650 Pack", drivers: ["BTS7960"], motors: ["JGA25 DC Motor"], sensors: [] }
};

document.addEventListener('DOMContentLoaded', () => {
  // Apply initial preset
  applyPreset(presets["Line Follower Robot"]);
  initPickers();

  const projTypeSelect = document.getElementById('proj-type');
  projTypeSelect.addEventListener('change', (e) => {
    const p = presets[e.target.value];
    if (p) {
      applyPreset(p);
      initPickers();
    }
  });
});

document.getElementById('btn-analyze').addEventListener('click', async () => {
  if (!state.brain || !state.power || state.motors.length === 0) {
    alert("Please select a logic unit, power cell, and at least one actuator.");
    return;
  }
  
  document.getElementById('state-empty').style.display = 'none';
  document.getElementById('state-results').style.display = 'none';
  
  // Activate loading state
  document.getElementById('state-loading').style.display = 'flex';
  
  const btn = document.getElementById('btn-analyze');
  btn.disabled = true;
  btn.innerHTML = `
    <svg class="icon animate-spin" viewBox="0 0 24 24"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
    Analyzing...
  `;
  
  const payload = {
    robotType: document.getElementById('proj-type').value,
    projectDesc: document.getElementById('target-speed').value || 'No specific requirements',
    brain: state.brain,
    power: state.power,
    drivers: state.drivers,
    motors: state.motors,
    sensors: state.sensors,
    comms: []
  };

  try {
    const data = await validateHardware(payload);
    renderResults(data);
  } catch (err) {
    alert('Analysis failed: ' + err.message);
    document.getElementById('state-loading').style.display = 'none';
    document.getElementById('state-empty').style.display = 'flex';
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Analyze Configuration';
  }
});
