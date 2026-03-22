import type { Request, Response, NextFunction } from 'express';

import { evaluateTest, generateTest } from '../services/test.service';
import type { EvaluateTestRequest, GenerateTestRequest } from '../types/test';

export const generateTestController = async (
  req: Request<unknown, unknown, GenerateTestRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await generateTest(req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const evaluateTestController = async (
  req: Request<unknown, unknown, EvaluateTestRequest>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await evaluateTest(req.body);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
