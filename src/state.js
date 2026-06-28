export const state = {
  brain: 'Arduino Uno',
  power: '9V Battery',
  drivers: [],
  motors: ['2x TT Gear Motors'],
  sensors: []
};

export function setSingle(key, val) {
  state[key] = val;
}

export function toggleMulti(key, val) {
  const idx = state[key].indexOf(val);
  if (idx > -1) {
    state[key].splice(idx, 1);
  } else {
    state[key].push(val);
  }
}

export function applyPreset(preset) {
  if (preset.brain) state.brain = preset.brain;
  if (preset.power) state.power = preset.power;
  if (preset.drivers) state.drivers = [...preset.drivers];
  if (preset.motors) state.motors = [...preset.motors];
  if (preset.sensors) state.sensors = [...preset.sensors];
}
