import request from "supertest";
import { createApp } from "../../app";
import {
  setupIntegrationDatabase,
  teardownIntegrationDatabase,
} from "./testDb";

describe("Input validation integration", () => {
  const app = createApp();

  beforeAll(async () => {
    await setupIntegrationDatabase();
  });

  afterAll(async () => {
    await teardownIntegrationDatabase();
  });

  describe("Auth endpoints validation", () => {
    it("POST /auth/challenge should reject invalid publicKey", async () => {
      const response = await request(app)
        .post("/auth/challenge")
        .send({ publicKey: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "publicKey",
            message: "Stellar public key must be 56 characters"
          })
        ])
      );
    });

    it("POST /auth/verify should reject missing signature", async () => {
      const validPublicKey = "GCKFBEIYTKP5RDBQMTVVALONAOPBXICILMAFKKWOHHJJD42YSWDYD2QC";
      const response = await request(app)
        .post("/auth/verify")
        .send({ publicKey: validPublicKey });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Campaign endpoints validation", () => {
    it("GET /campaigns/:id should reject invalid ID", async () => {
      const response = await request(app)
        .get("/campaigns/invalid");

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });

    it("PATCH /campaigns/reorder should reject invalid order array", async () => {
      const response = await request(app)
        .patch("/campaigns/reorder")
        .send({ order: ["invalid", "ids"] });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Reward endpoints validation", () => {
    it("GET /user/:address/rewards should reject invalid address", async () => {
      const response = await request(app)
        .get("/user/invalid-address/rewards");

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(response.body.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "address",
            message: "Stellar address must be 56 characters"
          })
        ])
      );
    });

    it("POST /user/:address/rewards/claim should reject invalid claim data", async () => {
      const validAddress = "GCKFBEIYTKP5RDBQMTVVALONAOPBXICILMAFKKWOHHJJD42YSWDYD2QC";
      const response = await request(app)
        .post(`/user/${validAddress}/rewards/claim`)
        .send({ campaign_id: -1, amount: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Transaction endpoints validation", () => {
    it("GET /user/:address/transactions should reject invalid address", async () => {
      const response = await request(app)
        .get("/user/short/transactions");

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_ERROR");
    });
  });
});
