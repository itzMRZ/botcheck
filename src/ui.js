import { icons } from './icons.js';
import { state, setSingle, toggleMulti } from './state.js';

const hardwareOptions = {
  brain: [
    { id: 'Arduino Uno', name: 'Arduino Uno', icon: icons.cpu },
    { id: 'Arduino Mega', name: 'Arduino Mega', icon: icons.cpu },
    { id: 'Arduino Nano', name: 'Arduino Nano', icon: icons.cpu },
    { id: 'Raspberry Pi 4', name: 'Raspberry Pi 4', icon: icons.cpu },
    { id: 'ESP32', name: 'ESP32', icon: icons.cpu },
    { id: 'Teensy 4.1', name: 'Teensy 4.1', icon: icons.cpu }
  ],
  power: [
    { id: '9V Battery', name: '9V Battery', icon: icons.battery },
    { id: '12V LiPo', name: '12V LiPo', icon: icons.battery },
    { id: '7.4V LiPo', name: '7.4V LiPo', icon: icons.battery },
    { id: 'USB Power Bank', name: 'USB Bank', icon: icons.battery },
    { id: '18650 Pack', name: '18650 Pack', icon: icons.battery }
  ],
  motors: [
    { id: '2x TT Gear Motors', name: 'TT Motors', icon: icons.motor },
    { id: 'NEMA 17 Steppers', name: 'NEMA 17', icon: icons.motor },
    { id: 'SG90 Servos', name: 'SG90 Servos', icon: icons.motor },
    { id: 'MG996R Servos', name: 'MG996R', icon: icons.motor },
    { id: 'L298N Driver', name: 'L298N Driver', icon: icons.cpu }
  ],
  sensors: [
    { id: 'TCRT5000', name: 'TCRT5000', icon: icons.search },
    { id: 'Pololu QTR-8A', name: 'QTR-8A Array', icon: icons.search },
    { id: 'HC-SR04', name: 'HC-SR04', icon: icons.search },
    { id: 'MPU6050', name: 'MPU6050', icon: icons.search },
    { id: 'Lidar RP', name: 'Lidar', icon: icons.search }
  ]
};

export function initPickers() {
  renderGrid('grid-brain', hardwareOptions.brain, 'brain', true);
  renderGrid('grid-power', hardwareOptions.power, 'power', true);
  renderGrid('grid-motors', hardwareOptions.motors, 'motors', false);
  renderGrid('grid-sensors', hardwareOptions.sensors, 'sensors', false);
}

function renderGrid(containerId, options, stateKey, isSingle) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  options.forEach(opt => {
    const card = document.createElement('div');
    card.className = 'comp-card';
    card.innerHTML = `
      ${opt.icon}
      <span>${opt.name}</span>
    `;
    
    // Set initial active state
    if (isSingle && state[stateKey] === opt.id) {
      card.classList.add('selected');
    } else if (!isSingle && state[stateKey].includes(opt.id)) {
      card.classList.add('selected');
    }
    
    card.addEventListener('click', () => {
      if (isSingle) {
        setSingle(stateKey, opt.id);
        Array.from(container.children).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      } else {
        toggleMulti(stateKey, opt.id);
        card.classList.toggle('selected');
      }
    });
    
    container.appendChild(card);
  });
  
  // Custom Option Card
  const customCard = document.createElement('div');
  customCard.className = 'comp-card custom-card';
  customCard.innerHTML = `
    <div class="custom-initial">
      ${icons.plus}
      <span>Custom...</span>
    </div>
    <div class="custom-input-wrapper" style="display: none;">
      <input type="text" placeholder="Type & Enter..." class="custom-input" />
    </div>
  `;
  
  customCard.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT') return; // Don't trigger if clicking inside input
    
    const initial = customCard.querySelector('.custom-initial');
    const inputWrapper = customCard.querySelector('.custom-input-wrapper');
    const input = customCard.querySelector('input');
    
    initial.style.display = 'none';
    inputWrapper.style.display = 'flex';
    input.focus();
  });
  
  const customInput = customCard.querySelector('input');
  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && customInput.value.trim() !== '') {
      const val = customInput.value.trim();
      
      // Add a new static card for this custom entry
      const newCard = document.createElement('div');
      newCard.className = 'comp-card selected';
      let iconToUse = icons.search;
      if (stateKey === 'brain') iconToUse = icons.cpu;
      if (stateKey === 'power') iconToUse = icons.battery;
      if (stateKey === 'motors') iconToUse = icons.motor;
      
      newCard.innerHTML = `
        ${iconToUse}
        <span>${val}</span>
      `;
      
      if (isSingle) {
        setSingle(stateKey, val);
        Array.from(container.children).forEach(c => c.classList.remove('selected'));
        newCard.classList.add('selected');
      } else {
        toggleMulti(stateKey, val);
      }
      
      newCard.addEventListener('click', () => {
        if (isSingle) {
          setSingle(stateKey, val);
          Array.from(container.children).forEach(c => c.classList.remove('selected'));
          newCard.classList.add('selected');
        } else {
          toggleMulti(stateKey, val);
          newCard.classList.toggle('selected');
        }
      });
      
      // Insert before the custom card
      container.insertBefore(newCard, customCard);
      
      // Reset custom card
      customInput.value = '';
      customCard.querySelector('.custom-initial').style.display = 'flex';
      customCard.querySelector('.custom-input-wrapper').style.display = 'none';
    } else if (e.key === 'Escape') {
      customCard.querySelector('.custom-initial').style.display = 'flex';
      customCard.querySelector('.custom-input-wrapper').style.display = 'none';
    }
  });

  // Handle clicking outside to reset custom card
  document.addEventListener('click', (e) => {
    if (!customCard.contains(e.target) && customInput.value.trim() === '') {
      customCard.querySelector('.custom-initial').style.display = 'flex';
      customCard.querySelector('.custom-input-wrapper').style.display = 'none';
    }
  });
  
  container.appendChild(customCard);
}

export function renderResults(data) {
  document.getElementById('state-loading').style.display = 'none';
  document.getElementById('state-results').style.display = 'flex';
  
  // Score mapping (0-100) -> stroke-dasharray (0, 100 to 100, 100)
  const score = data.overall.score || 0;
  const scoreRing = document.getElementById('score-ring');
  const scoreVal = document.getElementById('score-val');
  
  scoreVal.textContent = score;
  // Animate circle fill
  setTimeout(() => {
    scoreRing.setAttribute('stroke-dasharray', `${score}, 100`);
  }, 100);
  
  if (score < 50) {
    scoreRing.style.stroke = 'var(--danger-color)';
    scoreVal.style.color = 'var(--danger-color)';
  } else if (score < 80) {
    scoreRing.style.stroke = 'var(--warning-color)';
    scoreVal.style.color = 'var(--warning-color)';
  } else {
    scoreRing.style.stroke = 'var(--success-color)';
    scoreVal.style.color = 'var(--success-color)';
  }
  
  document.getElementById('verdict-title').textContent = data.overall.verdict.replace(/_/g, ' ');
  document.getElementById('verdict-desc').textContent = data.overall.summary;
  
  // Issues
  const issuesContainer = document.getElementById('issues-container');
  if (issuesContainer) {
    issuesContainer.innerHTML = '';
    
    if (data.issues && data.issues.length > 0) {
      data.issues.forEach(issue => {
        const sev = issue.severity.toLowerCase(); // critical, warning, improvement
        let cardClass = 'success';
        let iconHtml = icons.check;
        
        if (sev === 'critical') { cardClass = 'critical'; iconHtml = icons.alert; }
        else if (sev === 'warning') { cardClass = 'warning'; iconHtml = icons.alert; }
        else if (sev === 'improvement') { cardClass = 'success'; iconHtml = icons.tool; }
        
        let html = `
          <div class="issue-card ${cardClass}">
            <div class="issue-icon">${iconHtml}</div>
            <div class="issue-content">
              <div class="issue-title">[${issue.category.toUpperCase()}] ${issue.title}</div>
              <div class="issue-desc">${issue.detail}</div>
              ${issue.fix ? `<div class="issue-fix">${icons.tool} ${issue.fix}</div>` : ''}
            </div>
          </div>
        `;
        issuesContainer.innerHTML += html;
      });
    } else {
      issuesContainer.innerHTML = `
        <div class="issue-card success">
          <div class="issue-icon">${icons.check}</div>
          <div class="issue-content">
            <div class="issue-title">All clear!</div>
            <div class="issue-desc">No anomalies detected in your configuration.</div>
          </div>
        </div>
      `;
    }
  }

  // Recommendations
  const recSection = document.getElementById('recommendations-section');
  const recContainer = document.getElementById('recommendations-container');
  if (recSection && recContainer) {
    recContainer.innerHTML = '';
    if (data.recommendations && data.recommendations.length > 0) {
      recSection.style.display = 'block';
      data.recommendations.forEach(rec => {
        recContainer.innerHTML += `
          <div class="issue-card" style="border-color: var(--text-secondary); margin-bottom: 12px;">
            <div class="issue-icon" style="color: var(--warning-color);">${icons.lightbulb}</div>
            <div class="issue-content">
              <div class="issue-title">${rec.title}</div>
              <div class="issue-desc">${rec.description}</div>
              <div class="issue-fix" style="background: rgba(255,255,255,0.05); border: none;">
                <strong>Part:</strong> &nbsp;${rec.component}
              </div>
            </div>
          </div>
        `;
      });
    } else {
      recSection.style.display = 'none';
    }
  }
  
  // Components Table
  const tbody = document.getElementById('components-tbody');
  if (tbody) {
    tbody.innerHTML = '';
    if (data.components) {
      data.components.forEach(comp => {
        const st = (comp.status || 'UNKNOWN').toLowerCase();
        let badgeClass = 'ok';
        if (st === 'warning') badgeClass = 'warning';
        if (st === 'critical' || st === 'error') badgeClass = 'critical';
        
        tbody.innerHTML += `
          <tr>
            <td>
              <strong>${comp.name}</strong>
              <div style="color:var(--text-secondary);font-size:11px;margin-top:2px;">${comp.note || ''}</div>
            </td>
            <td>${comp.role}</td>
            <td><span class="badge ${badgeClass}">${st}</span></td>
          </tr>
        `;
      });
    }
  }
}
