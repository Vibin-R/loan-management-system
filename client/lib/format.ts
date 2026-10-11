const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});

/** ₹1,05,917.81 (Indian digit grouping). */
export const formatINR = (rupees: number): string => inrFormatter.format(rupees);

/** ₹1,00,000 with no paise, for round amounts like limits and slider values. */
export const formatINRWhole = (rupees: number): string => inrWholeFormatter.format(rupees);

/** 11 Oct 2026 */
export const formatDate = (value: string | Date): string => dateFormatter.format(new Date(value));

/** 11 Oct, 3:45 pm */
export const formatDateTime = (value: string | Date): string =>
  dateTimeFormatter.format(new Date(value));

/** 1.2 MB / 340 KB */
export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
