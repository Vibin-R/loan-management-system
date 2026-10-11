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

/** ₹1,05,917.81 (Indian digit grouping). */
export const formatINR = (rupees: number): string => inrFormatter.format(rupees);

/** ₹1,00,000 with no paise, for round amounts like limits and slider values. */
export const formatINRWhole = (rupees: number): string => inrWholeFormatter.format(rupees);
