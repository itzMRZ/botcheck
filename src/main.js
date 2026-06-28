import './style.css';
import { state } from './state.js';
import { initPickers, renderResults } from './ui.js';
import { validateHardware } from './api.js';

// Initialize component picker grids on load
initPickers();

document.getElementById('btn-analyze').addEventListener('click', async () => {
  if (!state.brain || !state.power || state.motors.length === 0) {
    alert('Please select at least one Logic Unit, Power Cell, and Actuator.');
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
    motorDriver: state.driver || 'None',
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
