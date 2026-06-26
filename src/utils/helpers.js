export function daysLeft() {
  const now = new Date();
  return Math.ceil((new Date(now.getFullYear(), 11, 31).getTime() - now.getTime()) / 86400000);
}

export function pct(done, total) {
  return total ? Math.round((done / total) * 100) : 0;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
