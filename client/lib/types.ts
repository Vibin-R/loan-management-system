/** Shapes shared with the API. See docs/DESIGN.md §6. */

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface FieldError {
  field: string;
  message: string;
}

export type EmploymentMode = 'SALARIED' | 'SELF_EMPLOYED' | 'UNEMPLOYED';

export type LoanStatus = 'APPLIED' | 'SANCTIONED' | 'REJECTED' | 'DISBURSED' | 'CLOSED';

export interface BreFailure {
  rule: 'AGE' | 'SALARY' | 'PAN' | 'EMPLOYMENT';
  message: string;
}

export interface SalarySlipInfo {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface BorrowerProfile {
  fullName: string;
  pan: string;
  dob: string; // YYYY-MM-DD
  monthlySalary: number;
  employmentMode: EmploymentMode;
  bre: { passed: boolean; failures: BreFailure[] };
  salarySlip: SalarySlipInfo | null;
}

export interface LoanHistoryEntry {
  from: LoanStatus | null;
  to: LoanStatus;
  at: string;
  note: string;
}

/** Amounts are in rupees. */
export interface Loan {
  id: string;
  status: LoanStatus;
  principal: number;
  tenureDays: number;
  annualRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  outstanding: number;
  applicant: {
    fullName: string;
    email: string;
    pan: string;
    dob: string;
    ageAtApplication: number;
    monthlySalary: number;
    employmentMode: EmploymentMode;
  };
  salarySlip: SalarySlipInfo;
  rejectionReason: string | null;
  history: LoanHistoryEntry[];
  createdAt: string;
  sanctionedAt: string | null;
  disbursedAt: string | null;
  closedAt: string | null;
}

export type ApplicationStep = 'DETAILS' | 'UPLOAD' | 'CONFIGURE' | 'SUBMITTED';

export interface ApplicationState {
  profile: BorrowerProfile | null;
  activeLoan: Loan | null;
  nextStep: ApplicationStep;
}

export interface Payment {
  id: string;
  utr: string;
  amount: number;
  paidOn: string; // YYYY-MM-DD
  recordedAt: string;
}

export type LeadStage = 'REGISTERED' | 'BRE_FAILED' | 'ELIGIBLE';

export interface Lead {
  id: string;
  name: string;
  email: string;
  stage: LeadStage;
  signedUpAt: string;
  profile: {
    fullName: string;
    pan: string;
    /** YYYY-MM-DD */
    dob: string;
    ageAtCheck: number;
    monthlySalary: number;
    employmentMode: EmploymentMode;
    checkedAt: string;
    /** Eligibility rules this borrower failed (empty when eligible). */
    breFailures: BreFailure['rule'][];
  } | null;
}

export interface ListParams {
  page: number;
  limit?: number;
  search?: string;
}

/** GET /stats/overview: numbers behind the staff overview charts. Money in rupees. */
export interface OverviewStats {
  statusCounts: Record<LoanStatus, number>;
  amounts: { disbursed: number; collected: number; outstanding: number };
  /** One entry per IST day, oldest first, ending today. Dates are YYYY-MM-DD. */
  daily: { date: string; applications: number; disbursals: number; collected: number }[];
}
