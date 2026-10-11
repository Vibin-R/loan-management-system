import { APPLICATION_STAGES } from '../constants/applicationStage';
import { LOAN_RULES, LOAN_STATUS } from '../constants/loan';
import { toLoanResponse, toProfileResponse } from '../mappers/loan.mapper';
import { BorrowerProfileModel } from '../models/BorrowerProfile';
import { LoanModel } from '../models/Loan';
import { UserModel } from '../models/User';
import { AppError } from '../utils/AppError';
import { ageOn, istMidnight, toISTCalendarDate } from '../utils/dates';
import { detectFileType, extensionMatches } from '../utils/fileType';
import { calculateLoan } from '../utils/loanMath';
import { toPaise } from '../utils/money';
import type { ApplyInput, ProfileInput } from '../validators/borrower.schema';
import { evaluateEligibility } from './bre.service';
import { deleteFile, saveFile } from './storage.service';

export type NextStep = 'DETAILS' | 'UPLOAD' | 'CONFIGURE' | 'SUBMITTED';

const findActiveLoan = (userId: string) =>
  LoanModel.findOne({ borrowerId: userId, isActive: true }).lean();

async function assertNoActiveLoan(userId: string): Promise<void> {
  if (await LoanModel.exists({ borrowerId: userId, isActive: true })) {
    throw AppError.conflict(
      'ACTIVE_LOAN_EXISTS',
      'You already have a loan application in progress',
    );
  }
}

/** Everything the application form needs to open at the right step after a refresh. */
export async function getApplication(userId: string) {
  const [profile, activeLoan] = await Promise.all([
    BorrowerProfileModel.findOne({ userId }).lean(),
    findActiveLoan(userId),
  ]);

  let nextStep: NextStep = 'DETAILS';
  if (activeLoan) nextStep = 'SUBMITTED';
  else if (profile?.bre.passed && profile.salarySlip) nextStep = 'CONFIGURE';
  else if (profile?.bre.passed) nextStep = 'UPLOAD';

  return {
    profile: profile ? toProfileResponse(profile) : null,
    activeLoan: activeLoan ? toLoanResponse(activeLoan) : null,
    nextStep,
  };
}

/**
 * Step 2. Saves the details and runs the BRE. The profile is saved even when the BRE fails:
 * Sales can then follow up (stage BRE_FAILED) and the borrower's form stays filled in.
 * A failure still blocks the next steps, which all require `bre.passed`.
 */
export async function saveProfile(userId: string, input: ProfileInput) {
  await assertNoActiveLoan(userId);

  const failures = evaluateEligibility({
    dob: input.dob,
    monthlySalaryRupees: input.monthlySalary,
    pan: input.pan,
    employmentMode: input.employmentMode,
  });

  const profile = await BorrowerProfileModel.findOneAndUpdate(
    { userId },
    {
      $set: {
        fullName: input.fullName,
        pan: input.pan,
        dob: istMidnight(input.dob),
        monthlySalary: toPaise(input.monthlySalary),
        employmentMode: input.employmentMode,
        bre: { passed: failures.length === 0, failures, checkedAt: new Date() },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, lean: true },
  );
  if (!profile) throw new AppError(500, 'INTERNAL_ERROR', 'Could not save your details');

  await UserModel.updateOne(
    { _id: userId },
    {
      applicationStage:
        failures.length === 0 ? APPLICATION_STAGES.ELIGIBLE : APPLICATION_STAGES.BRE_FAILED,
    },
  );

  if (failures.length > 0) {
    throw AppError.unprocessable(
      'BRE_REJECTED',
      "You don't meet our eligibility criteria yet.",
      failures,
    );
  }
  return toProfileResponse(profile);
}

/** Step 3. Accepts a PDF/JPG/PNG checked by its actual content, and replaces any earlier upload. */
export async function uploadSalarySlip(userId: string, file: Express.Multer.File | undefined) {
  if (!file) throw AppError.badRequest('Choose a file to upload');

  const detected = detectFileType(file.buffer);
  if (!detected || !extensionMatches(file.originalname, detected.extension)) {
    throw new AppError(415, 'UNSUPPORTED_FILE_TYPE', 'Upload a PDF, JPG or PNG file.');
  }

  const profile = await BorrowerProfileModel.findOne({ userId }).lean();
  if (!profile?.bre.passed) {
    throw AppError.conflict('BRE_NOT_PASSED', 'Complete the eligibility check first');
  }
  await assertNoActiveLoan(userId);

  const salarySlip = {
    storageKey: await saveFile(userId, file.buffer, detected.extension),
    originalName: file.originalname,
    mimeType: detected.mimeType,
    size: file.size,
    uploadedAt: new Date(),
  };
  await BorrowerProfileModel.updateOne({ userId }, { $set: { salarySlip } });

  // The previous slip was never attached to a loan, so it can go.
  if (profile.salarySlip) await deleteFile(profile.salarySlip.storageKey);

  return {
    originalName: salarySlip.originalName,
    mimeType: salarySlip.mimeType,
    size: salarySlip.size,
    uploadedAt: salarySlip.uploadedAt,
  };
}

/**
 * Step 4. Recomputes interest on the server (client numbers are never trusted) and creates the
 * loan as APPLIED. The partial unique index rejects a second open loan, even on a double click.
 */
export async function applyForLoan(userId: string, input: ApplyInput) {
  const [user, profile] = await Promise.all([
    UserModel.findById(userId).select('email').lean(),
    BorrowerProfileModel.findOne({ userId }).lean(),
  ]);
  if (!user) throw AppError.unauthenticated();
  await assertNoActiveLoan(userId);
  if (!profile?.bre.passed) {
    throw AppError.conflict('BRE_NOT_PASSED', 'Complete the eligibility check first');
  }
  if (!profile.salarySlip) {
    throw AppError.conflict('SLIP_MISSING', 'Upload your salary slip first');
  }

  const quote = calculateLoan(toPaise(input.principal), input.tenureDays);
  const now = new Date();

  const loan = await LoanModel.create({
    borrowerId: userId,
    applicant: {
      fullName: profile.fullName,
      email: user.email,
      pan: profile.pan,
      dob: profile.dob,
      ageAtApplication: ageOn(toISTCalendarDate(profile.dob)),
      monthlySalary: profile.monthlySalary,
      employmentMode: profile.employmentMode,
      breCheckedAt: profile.bre.checkedAt,
    },
    principal: quote.principal,
    tenureDays: input.tenureDays,
    annualRate: LOAN_RULES.annualInterestRate,
    interest: quote.interest,
    totalRepayment: quote.totalRepayment,
    status: LOAN_STATUS.APPLIED,
    isActive: true,
    salarySlip: profile.salarySlip,
    history: [
      { from: null, to: LOAN_STATUS.APPLIED, by: userId, at: now, note: 'Application submitted' },
    ],
  });

  // The slip now belongs to this loan; a future application needs a fresh one.
  await Promise.all([
    BorrowerProfileModel.updateOne({ userId }, { $set: { salarySlip: null } }),
    UserModel.updateOne({ _id: userId }, { applicationStage: APPLICATION_STAGES.APPLIED }),
  ]);

  return toLoanResponse(loan.toObject());
}

export async function listMyLoans(userId: string) {
  const loans = await LoanModel.find({ borrowerId: userId }).sort({ createdAt: -1 }).lean();
  return loans.map(toLoanResponse);
}
