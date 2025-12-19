import dayjs from "dayjs";

export function fmtRaisedOn(iso) {
  if (!iso) return "";
  return dayjs(iso).format("DD-MM-YY hh:mm A");
}

export function isOverdue(deadlineIso, now = Date.now()) {
  if (!deadlineIso) return false;
  const dl = dayjs(deadlineIso).valueOf();
  return now > dl;
}

export function remainingText(deadlineIso, now = Date.now()) {
  if (!deadlineIso) return "";
  const dl = dayjs(deadlineIso).valueOf();
  let ms = Math.max(0, dl - now);

  const totalSec = Math.floor(ms / 1000);
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  // datetime-local expects: YYYY-MM-DDTHH:mm
  const d = dayjs(iso);
  return d.format("YYYY-MM-DDTHH:mm");
}

export function fromDatetimeLocalValue(v) {
  // returns ISO string
  if (!v) return "";
  return dayjs(v).toISOString();
}
