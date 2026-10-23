// O Brasil não adota horário de verão desde 2019: Cambará do Sul fica em UTC-03:00 o ano todo.
const OFFSET = '-03:00';

export const slotStart = (day, time) => new Date(`${day}T${time}:00${OFFSET}`);

export function localToday(now = new Date()) {
  return new Date(now.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 10);
}

export const isValidDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) &&
  new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

export function ageOn(birthDate, onDay) {
  const [by, bm, bd] = birthDate.split('-').map(Number);
  const [y, m, d] = onDay.split('-').map(Number);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age--;
  return age;
}

export const addMinutes = (date, min) => new Date(date.getTime() + min * 60000);
