import type { FilterQuery } from 'mongoose';
import { APPLICATION_STAGES } from '../constants/applicationStage';
import { BorrowerProfileModel } from '../models/BorrowerProfile';
import { UserModel, type UserDoc } from '../models/User';
import { toRupees } from '../utils/money';
import { containsRegex, skipFor } from '../utils/pagination';
import type { LeadsQuery } from '../validators/operations.schema';

/** Stages that mean "registered but hasn't applied yet". */
const LEAD_STAGES = [
  APPLICATION_STAGES.REGISTERED,
  APPLICATION_STAGES.BRE_FAILED,
  APPLICATION_STAGES.ELIGIBLE,
];

/**
 * Sales leads: borrowers who signed up but haven't applied. One indexed query on
 * `applicationStage`, plus one batched lookup for the profiles shown on this page.
 */
export async function listLeads(query: LeadsQuery) {
  const filter: FilterQuery<UserDoc> = {
    applicationStage: query.stage ? query.stage : { $in: LEAD_STAGES },
  };
  if (query.search) {
    const pattern = containsRegex(query.search);
    filter.$or = [{ name: pattern }, { email: pattern }];
  }

  const [users, total] = await Promise.all([
    UserModel.find(filter)
      .select('name email applicationStage createdAt')
      .sort({ createdAt: -1 })
      .skip(skipFor(query))
      .limit(query.limit)
      .lean(),
    UserModel.countDocuments(filter),
  ]);

  const profiles = await BorrowerProfileModel.find({ userId: { $in: users.map((u) => u._id) } })
    .select('userId pan monthlySalary employmentMode bre')
    .lean();
  const profileByUser = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const items = users.map((user) => {
    const profile = profileByUser.get(user._id.toString());
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      stage: user.applicationStage,
      signedUpAt: user.createdAt,
      profile: profile
        ? {
            pan: profile.pan,
            monthlySalary: toRupees(profile.monthlySalary),
            employmentMode: profile.employmentMode,
            breFailures: profile.bre.failures.map((f) => f.message),
          }
        : null,
    };
  });

  return { items, total, page: query.page, limit: query.limit };
}
