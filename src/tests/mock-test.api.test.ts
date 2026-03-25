import express from "express";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MockTestService } from "../services/mockTest.service.js";
import { MockTestController } from "../controllers/mockTest.controller.js";
import { createMockTestRouter } from "../routes/mockTest.routes.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { TestModel } from "../models/Test.js";

const createTestApp = (service: MockTestService) => {
  const app = express();
  app.use(express.json());
  const controller = new MockTestController(service);
  app.use("/api/mock-test", createMockTestRouter(controller));
  app.use(errorHandler);
  return app;
};

describe("AI Mock Test API", () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  });

  afterEach(async () => {
    await TestModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it("returns 400 for invalid generate payload", async () => {
    const service = new MockTestService({ generate: jest.fn() as never });
    const app = createTestApp(service);

    const response = await request(app).post("/api/mock-test/generate").send({
      jobProfile: "",
      mcqCount: -1,
      shortAnswerCount: 1,
    });

    expect(response.status).toBe(400);
  });

  it("generates and stores test without returning answers", async () => {
    const service = new MockTestService({
      generate: jest.fn().mockResolvedValue({
        mcqs: [
          {
            question: "Hard frontend Q",
            options: ["A1", "B1", "C1", "D1"],
            correctAnswer: "B",
          },
        ],
        shortAnswers: [{ question: "Protocol?", correctAnswer: "http" }],
      }),
    });

    const app = createTestApp(service);
    const response = await request(app).post("/api/mock-test/generate").send({
      jobProfile: "Senior MERN Developer",
      mcqCount: 1,
      shortAnswerCount: 1,
    });

    expect(response.status).toBe(201);
    expect(response.body.questions).toHaveLength(2);
    expect(response.body.correctAnswers).toBeUndefined();

    const saved = await TestModel.findById(response.body.testId);
    expect(saved).not.toBeNull();
    expect(saved?.correctAnswers).toHaveLength(2);
  });

  it("returns 502 when Gemini service fails", async () => {
    const service = new MockTestService({
      generate: jest.fn().mockRejectedValue(new Error("Gemini down")),
    });

    const app = createTestApp(service);
    const response = await request(app).post("/api/mock-test/generate").send({
      jobProfile: "Data Engineer",
      mcqCount: 1,
      shortAnswerCount: 1,
    });

    expect(response.status).toBe(502);
    expect(response.body.error).toContain("Gemini request failed");
  });

  it("submits test and returns evaluation metrics", async () => {
    const service = new MockTestService({
      generate: jest.fn().mockResolvedValue({
        mcqs: [
          {
            question: "Hard backend Q",
            options: ["A", "B", "C", "D"],
            correctAnswer: "C",
          },
        ],
        shortAnswers: [{ question: "Cache tech", correctAnswer: "redis" }],
      }),
    });

    const app = createTestApp(service);
    const generated = await request(app).post("/api/mock-test/generate").send({
      jobProfile: "Backend Engineer",
      mcqCount: 1,
      shortAnswerCount: 1,
    });

    const questions = generated.body.questions;
    const response = await request(app).post("/api/mock-test/submit").send({
      testId: generated.body.testId,
      userAnswers: {
        [questions[0].id]: "C",
        [questions[1].id]: "Redis",
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.score).toBe(2);
    expect(response.body.accuracyPercentage).toBe(100);
    expect(response.body.breakdown).toHaveLength(2);
    expect(response.body.correctAnswers).toBeDefined();
  });

  it("returns 404 when submitting unknown test", async () => {
    const service = new MockTestService({ generate: jest.fn() as never });
    const app = createTestApp(service);

    const response = await request(app).post("/api/mock-test/submit").send({
      testId: "67c6d28c8f8f8f8f8f8f8f8f",
      userAnswers: {},
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 when submit payload invalid", async () => {
    const service = new MockTestService({ generate: jest.fn() as never });
    const app = createTestApp(service);

    const response = await request(app).post("/api/mock-test/submit").send({
      testId: 123,
      userAnswers: [],
    });

    expect(response.status).toBe(400);
  });
});
