import express from "express";
import { createMockTestRouter } from "./routes/mockTest.routes.js";
import { MockTestController } from "./controllers/mockTest.controller.js";
import { MockTestService } from "./services/mockTest.service.js";
import { GeminiMockTestService } from "./services/geminiMockTest.service.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  const service = new MockTestService(new GeminiMockTestService());
  const controller = new MockTestController(service);

  app.use("/api/mock-test", createMockTestRouter(controller));
  app.use(errorHandler);

  return app;
};
