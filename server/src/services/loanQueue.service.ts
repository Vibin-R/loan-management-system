import type { FilterQuery } from 'mongoose';
import type { LoanStatus } from '../constants/loan';
import { toLoanResponse, type LoanResponse } from '../mappers/loan.mapper';
import { LoanModel, type LoanDoc } from '../models/Loan';
import { containsRegex, skipFor, type ListQuery, type Page } from '../utils/pagination';

/**
 * A module's work queue: loans in one status, newest first, searchable by name, email or PAN.
 * Uses the `{ status, createdAt }` index and never loads more than one page.
 */
export async function listLoansByStatus(
  status: LoanStatus,
  query: ListQuery,
): Promise<Page<LoanResponse>> {
  const filter: FilterQuery<LoanDoc> = { status };
  if (query.search) {
    const pattern = containsRegex(query.search);
    filter.$or = [
      { 'applicant.fullName': pattern },
      { 'applicant.email': pattern },
      { 'applicant.pan': pattern },
    ];
  }

  const [loans, total] = await Promise.all([
    LoanModel.find(filter).sort({ createdAt: -1 }).skip(skipFor(query)).limit(query.limit).lean(),
    LoanModel.countDocuments(filter),
  ]);

  return { items: loans.map(toLoanResponse), total, page: query.page, limit: query.limit };
}
