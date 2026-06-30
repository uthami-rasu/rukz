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

export function formatDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
