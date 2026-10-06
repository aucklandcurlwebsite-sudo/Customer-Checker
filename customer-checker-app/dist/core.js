export const STATUSES = ['Paid', 'Deposit', 'Unpaid', 'Quote'];
export const COLORS = ['#96C1C5', '#FFF0DE', '#694A47', '#B8AAA6'];
export function booking(value) {
  const m = String(value).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s*\+\s*(\d{2}):(\d{2})$/);
  if (!m) throw new Error('Use dd/mm/yyyy + HH:mm, for example 06/10/2026 + 14:30.');
  const [, d, mo, y, h, mi] = m.map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (y < 1900 || y > 9999 || t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d || h > 23 || mi > 59) throw new Error('Enter a valid date and 24-hour time.');
  const pad = x => String(x).padStart(2, '0');
  return {display: `${pad(d)}/${pad(mo)}/${y} + ${pad(h)}:${pad(mi)}`, sort: t.getTime()};
}
export function amountCents(value) {
  if (value === '' || value === null || value === undefined) return null;
  const s = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw new Error('Enter a non-negative amount with up to two decimal places.');
  const [whole, fraction = ''] = s.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents > 99999999999) throw new Error('The amount is too large.');
  return cents;
}
export function validate(input) {
  const name = String(input.name ?? '').trim();
  if (!name || name.length > 150) throw new Error('Enter a customer name of 1–150 characters.');
  if (!STATUSES.includes(input.status)) throw new Error('Select Paid, Deposit, Unpaid, or Quote.');
  const b = booking(input.booking);
  return {name, booking: b.display, bookingSort: b.sort, cents: amountCents(input.amount), status: input.status};
}
export function totals(rows) {
  const result = Object.fromEntries(STATUSES.map(s => [s, {cents: 0, count: 0, missing: 0}]));
  for (const row of rows) {
    if (!STATUSES.includes(row.status)) throw new Error('A saved row has an invalid payment status.');
    const v = result[row.status]; v.count++;
    if (row.cents === null) v.missing++;
    else if (!Number.isSafeInteger(row.cents) || row.cents < 0) throw new Error('A saved row has an invalid amount.');
    else v.cents += row.cents;
  }
  return result;
}
export const money = cents => '$' + (cents / 100).toLocaleString('en-NZ', {minimumFractionDigits: 2, maximumFractionDigits: 2});
export const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
