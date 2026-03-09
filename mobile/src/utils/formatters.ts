export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function maskPhoneBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhoneBR(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function maskCurrencyInputBRL(value: string): string {
  const digits = onlyDigits(value);
  const cents = Number(digits || '0');
  return formatCurrencyBRL(cents / 100);
}

export function parseCurrencyInputBRL(value: string): number {
  const digits = onlyDigits(value);
  const cents = Number(digits || '0');
  return cents / 100;
}

export function maskDateBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

export function parseDateBRToISO(value: string): string | null {
  const masked = maskDateBR(value);
  const match = masked.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (year < 1900 || year > 2100) return null;

  const test = new Date(year, month - 1, day);
  const valid =
    test.getFullYear() === year &&
    test.getMonth() === month - 1 &&
    test.getDate() === day;
  if (!valid) return null;

  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function formatISODateToBR(value?: string | null): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function formatDateToBR(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().padStart(4, '0');
  return `${day}-${month}-${year}`;
}

