/**
 * guestStorage.js
 * localStorage 기반 데이터 CRUD 유틸리티.
 * 게스트 모드에서 Supabase를 대체합니다.
 */

const KEYS = {
  PROFILE: 'guest_profile',
  MEALS: 'guest_meal_logs',
  SUMMARIES: 'guest_daily_summaries',
  IS_GUEST: 'guest_mode_active',
};

const parseKstToDate = (eatingAtStr) => {
  if (!eatingAtStr) return new Date();
  if (eatingAtStr.includes('Z') || eatingAtStr.includes('+')) {
    return new Date(eatingAtStr);
  }
  const isoStr = eatingAtStr.replace(' ', 'T').slice(0, 19) + '+09:00';
  return new Date(isoStr);
};

// ─── Helper ───
function getJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Guest Session ───
export function startGuestSession() {
  localStorage.setItem(KEYS.IS_GUEST, 'true');
}

export function endGuestSession() {
  localStorage.removeItem(KEYS.IS_GUEST);
  localStorage.removeItem(KEYS.PROFILE);
  localStorage.removeItem(KEYS.MEALS);
  localStorage.removeItem(KEYS.SUMMARIES);
}

export function isGuestSession() {
  return localStorage.getItem(KEYS.IS_GUEST) === 'true';
}

// ─── Profile ───
export function getGuestProfile() {
  return getJSON(KEYS.PROFILE, null);
}

export function upsertGuestProfile(profile) {
  setJSON(KEYS.PROFILE, { ...getGuestProfile(), ...profile });
}

// ─── Meal Logs ───
let _idCounter = Date.now();
function nextId() {
  return `guest_${_idCounter++}`;
}

export function getGuestMealLogs(sinceHours = 72) {
  const all = getJSON(KEYS.MEALS, []);
  const since = new Date();
  since.setHours(since.getHours() - sinceHours);
  return all
    .filter(m => parseKstToDate(m.eating_at) >= since)
    .sort((a, b) => parseKstToDate(a.eating_at) - parseKstToDate(b.eating_at));
}

export function getAllGuestMealLogs() {
  return getJSON(KEYS.MEALS, []);
}

export function addGuestMealLog(log) {
  const all = getJSON(KEYS.MEALS, []);
  const newLog = { ...log, id: nextId() };
  all.push(newLog);
  setJSON(KEYS.MEALS, all);
  return newLog;
}

export function updateGuestMealLog(id, updates) {
  const all = getJSON(KEYS.MEALS, []);
  const idx = all.findIndex(m => m.id === id);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...updates };
    setJSON(KEYS.MEALS, all);
    return true;
  }
  return false;
}

export function deleteGuestMealLog(id) {
  const all = getJSON(KEYS.MEALS, []);
  setJSON(KEYS.MEALS, all.filter(m => m.id !== id));
}

// ─── Cycle Summaries ───
export function getGuestCycleSummaries() {
  return getJSON(KEYS.SUMMARIES, []);
}

export function upsertGuestCycleSummary(cycleStart, summary) {
  const all = getJSON(KEYS.SUMMARIES, []);
  const idx = all.findIndex(s => s.cycle_start === cycleStart);
  if (idx !== -1) {
    all[idx] = { ...all[idx], ...summary, cycle_start: cycleStart };
  } else {
    all.push({ ...summary, cycle_start: cycleStart });
  }
  setJSON(KEYS.SUMMARIES, all);
}

export function getGuestCycleSummariesForMonth(year, month) {
  const all = getJSON(KEYS.SUMMARIES, []);
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return all.filter(s => s.cycle_start.startsWith(prefix));
}

export function getGuestCycleSummariesForDate(dateStr) {
  const all = getJSON(KEYS.SUMMARIES, []);
  return all.filter(s => s.cycle_start.startsWith(dateStr));
}

// ─── Reset ───
export function resetGuestData() {
  localStorage.removeItem(KEYS.MEALS);
  localStorage.removeItem(KEYS.SUMMARIES);
}

export function getGuestMealLogsForDate(dateStr) {
  const all = getJSON(KEYS.MEALS, []);
  return all
    .filter(m => m.eating_at.startsWith(dateStr))
    .sort((a, b) => parseKstToDate(a.eating_at) - parseKstToDate(b.eating_at));
}

export function getGuestWeightData() {
  const all = getJSON(KEYS.MEALS, []);
  return all
    .filter(m => m.weight != null)
    .sort((a, b) => parseKstToDate(a.eating_at) - parseKstToDate(b.eating_at));
}
