import type { Request, Response } from 'express';
import { getAuthUser } from '../middleware/authenticate';
import * as borrowerService from '../services/borrower.service';
import type { ApplyInput, ProfileInput } from '../validators/borrower.schema';

export async function getApplication(req: Request, res: Response) {
  res.json({ data: await borrowerService.getApplication(getAuthUser(req).id) });
}

export async function saveProfile(req: Request, res: Response) {
  const profile = await borrowerService.saveProfile(
    getAuthUser(req).id,
    res.locals.body as ProfileInput,
  );
  res.json({ data: { profile } });
}

export async function uploadSalarySlip(req: Request, res: Response) {
  const salarySlip = await borrowerService.uploadSalarySlip(getAuthUser(req).id, req.file);
  res.status(201).json({ data: { salarySlip } });
}

export async function applyForLoan(req: Request, res: Response) {
  const loan = await borrowerService.applyForLoan(
    getAuthUser(req).id,
    res.locals.body as ApplyInput,
  );
  res.status(201).json({ data: { loan } });
}

export async function listMyLoans(req: Request, res: Response) {
  res.json({ data: { items: await borrowerService.listMyLoans(getAuthUser(req).id) } });
}
