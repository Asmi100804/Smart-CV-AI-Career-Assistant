import { Router } from "express";
import { MockTestController } from "../controllers/mockTest.controller.js";

export const createMockTestRouter = (controller: MockTestController) => {
  const router = Router();

  router.post("/generate", controller.generate);
  router.post("/submit", controller.submit);

  return router;
};
