/**
 * Colours for charts. SVG presentation attributes can't read CSS variables, so the
 * values mirror the tokens in globals.css.
 */
export const CHART_COLORS = {
  blue: '#3b6cf6',
  orange: '#f59e0b',
  green: '#15803d',
  red: '#b91c1c',
  grey: '#9ca3af',
  grid: '#eef0f3',
  axis: '#9ca3af',
} as const;

export const AXIS_PROPS = {
  axisLine: false,
  tickLine: false,
  tick: { fill: CHART_COLORS.axis, fontSize: 12 },
} as const;
