export const state = {
  brain: 'Arduino Uno',
  power: '9V Battery',
  driver: null,
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
