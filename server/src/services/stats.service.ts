import { LOAN_STATUS, type LoanStatus } from '../constants/loan';
import { LoanModel } from '../models/Loan';
import { PaymentModel } from '../models/Payment';
import { formatCalendarDate, istMidnight, toISTCalendarDate, todayIST } from '../utils/dates';
import { toRupees } from '../utils/money';

/** How many days the trend charts cover, ending today (IST). */
export const TREND_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

interface StatusTotals {
  _id: LoanStatus;
  count: number;
  amountPaid: number;
  totalRepayment: number;
  principal: number;
}

const dayKey = (instant: Date) => formatCalendarDate(toISTCalendarDate(instant));

/**
 * Numbers for the staff overview: loans per status, money out/in, and a daily trend.
 * Status totals are one $group over the status index; the trend reads only the last
 * TREND_DAYS of loans and payments, so the cost stays flat as history grows.
 */
export async function getOverviewStats() {
  const start = new Date(istMidnight(todayIST()).getTime() - (TREND_DAYS - 1) * DAY_MS);

  const [byStatus, recentLoans, recentPayments] = await Promise.all([
    LoanModel.aggregate<StatusTotals>([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          principal: { $sum: '$principal' },
          amountPaid: { $sum: '$amountPaid' },
          totalRepayment: { $sum: '$totalRepayment' },
        },
      },
    ]),
    LoanModel.find({ $or: [{ createdAt: { $gte: start } }, { disbursedAt: { $gte: start } }] })
      .select('createdAt disbursedAt')
      .lean(),
    PaymentModel.find({ paidOn: { $gte: start } })
      .select('amount paidOn')
      .lean(),
  ]);

  const statusCounts = Object.fromEntries(Object.values(LOAN_STATUS).map((s) => [s, 0])) as Record<
    LoanStatus,
    number
  >;
  let disbursed = 0;
  let collected = 0;
  let outstanding = 0;
  for (const row of byStatus) {
    statusCounts[row._id] = row.count;
    if (row._id === LOAN_STATUS.DISBURSED || row._id === LOAN_STATUS.CLOSED) {
      disbursed += row.principal;
      collected += row.amountPaid;
    }
    if (row._id === LOAN_STATUS.DISBURSED) outstanding += row.totalRepayment - row.amountPaid;
  }

  const days = Array.from({ length: TREND_DAYS }, (_, i) => ({
    date: dayKey(new Date(start.getTime() + i * DAY_MS)),
    applications: 0,
    disbursals: 0,
    collectedPaise: 0,
  }));
  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const loan of recentLoans) {
    const created = byDate.get(dayKey(loan.createdAt));
    if (created) created.applications += 1;
    const out = loan.disbursedAt ? byDate.get(dayKey(loan.disbursedAt)) : undefined;
    if (out) out.disbursals += 1;
  }
  for (const payment of recentPayments) {
    const day = byDate.get(dayKey(payment.paidOn));
    if (day) day.collectedPaise += payment.amount;
  }

  return {
    statusCounts,
    amounts: {
      disbursed: toRupees(disbursed),
      collected: toRupees(collected),
      outstanding: toRupees(outstanding),
    },
    daily: days.map(({ collectedPaise, ...d }) => ({ ...d, collected: toRupees(collectedPaise) })),
  };
}
