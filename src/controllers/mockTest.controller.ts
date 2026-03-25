import type { Request, Response, NextFunction } from "express";
import type { MockTestService } from "../services/mockTest.service.js";
import { validateGeneratePayload, validateSubmitPayload } from "../middleware/validateMockTest.js";

export class MockTestController {
  constructor(private readonly service: MockTestService) {}

  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = validateGeneratePayload(req.body);
      const result = await this.service.generateTest(
        payload.jobProfile,
        payload.mcqCount,
        payload.shortAnswerCount
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = validateSubmitPayload(req.body);
      const result = await this.service.submitTest(payload.testId, payload.userAnswers);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
