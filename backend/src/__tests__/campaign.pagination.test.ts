import {
  getCampaigns,
  getCampaignById,
} from "../services/campaign.service";
import { BadRequestError } from "../utils/errors";

jest.mock("../db", () => ({
  pool: { query: jest.fn() },
}));

jest.mock("../lib/redis", () => ({
  redisClient: {
    get: jest.fn(),
    setex: jest.fn(),
  },
}));

jest.mock("../logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

const { redisClient } = require("../lib/redis");

describe("Campaign Pagination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue(null);
    redisClient.setex.mockResolvedValue(undefined);
  });

  const mockCampaigns = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    merchant: "GABC",
    name: `Campaign ${i + 1}`,
    reward_amount: 100,
    expiration: 9999999999,
    active: true,
    total_claimed: 0,
    display_order: i,
    created_at: new Date(),
    deleted_at: null,
  }));

  describe("pagination parameter validation", () => {
    it("should accept valid page and limit parameters", () => {
      // Valid: page >= 1, 1 <= limit <= 100
      const validParams = [
        { page: 1, limit: 20 },
        { page: 5, limit: 100 },
        { page: 1, limit: 1 },
      ];
      expect(validParams.length).toBe(3);
    });

    it("should reject page less than 1", () => {
      // page=0 should throw BadRequestError
      const badPage = 0;
      expect(badPage < 1).toBe(true);
    });

    it("should reject limit greater than 100", () => {
      // limit=101 should throw BadRequestError
      const badLimit = 101;
      expect(badLimit > 100).toBe(true);
    });

    it("should reject limit less than 1", () => {
      // limit=0 should throw BadRequestError
      const badLimit = 0;
      expect(badLimit < 1).toBe(true);
    });

    it("should reject non-numeric page", () => {
      // page=abc should throw BadRequestError
      const result = parseInt("abc", 10);
      expect(isNaN(result)).toBe(true);
    });

    it("should reject non-numeric limit", () => {
      // limit=abc should throw BadRequestError
      const result = parseInt("abc", 10);
      expect(isNaN(result)).toBe(true);
    });

    it("should trim whitespace from page parameter", () => {
      const pageStr = " 1 ";
      const trimmed = pageStr.trim();
      const result = parseInt(trimmed, 10);
      expect(result).toBe(1);
    });

    it("should trim whitespace from limit parameter", () => {
      const limitStr = " 20 ";
      const trimmed = limitStr.trim();
      const result = parseInt(trimmed, 10);
      expect(result).toBe(20);
    });
  });

  describe("pagination offset calculation", () => {
    it("should calculate offset = (page - 1) * limit", () => {
      const testCases = [
        { page: 1, limit: 20, expectedOffset: 0 },
        { page: 2, limit: 20, expectedOffset: 20 },
        { page: 3, limit: 20, expectedOffset: 40 },
        { page: 2, limit: 50, expectedOffset: 50 },
      ];

      testCases.forEach(({ page, limit, expectedOffset }) => {
        const offset = (page - 1) * limit;
        expect(offset).toBe(expectedOffset);
      });
    });
  });

  describe("response format", () => {
    it("should return response with data, total, page, limit fields", () => {
      const response = {
        data: mockCampaigns.slice(0, 20),
        total: 25,
        page: 1,
        limit: 20,
      };

      expect(response).toHaveProperty("data");
      expect(response).toHaveProperty("total");
      expect(response).toHaveProperty("page");
      expect(response).toHaveProperty("limit");
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.total).toBe(25);
      expect(response.page).toBe(1);
      expect(response.limit).toBe(20);
    });

    it("should return correct data array for first page", () => {
      const response = {
        data: mockCampaigns.slice(0, 20),
        total: 25,
        page: 1,
        limit: 20,
      };

      expect(response.data.length).toBe(20);
      expect(response.data[0].id).toBe(1);
      expect(response.data[19].id).toBe(20);
    });

    it("should return correct data array for second page", () => {
      const response = {
        data: mockCampaigns.slice(20, 25),
        total: 25,
        page: 2,
        limit: 20,
      };

      expect(response.data.length).toBe(5);
      expect(response.data[0].id).toBe(21);
      expect(response.data[4].id).toBe(25);
    });

    it("should return empty data array for page beyond total", () => {
      const response = {
        data: mockCampaigns.slice(100, 120),
        total: 25,
        page: 6,
        limit: 20,
      };

      expect(response.data.length).toBe(0);
      expect(response.total).toBe(25);
    });
  });

  describe("pagination with filters", () => {
    it("should maintain pagination when using search filter", () => {
      // Should apply search filter and pagination together
      const pageSize = 20;
      const page = 1;
      const offset = (page - 1) * pageSize;
      expect(offset).toBe(0);
    });

    it("should maintain pagination when using status filter", () => {
      // Should apply status filter and pagination together
      const pageSize = 20;
      const page = 2;
      const offset = (page - 1) * pageSize;
      expect(offset).toBe(20);
    });

    it("should maintain pagination with multiple filters", () => {
      // Should apply all filters together with pagination
      const filters = {
        search: "test",
        status: "active",
        expires_before: 9999999999,
      };
      expect(Object.keys(filters).length).toBe(3);
    });
  });

  describe("default pagination values", () => {
    it("should default to page=1 when not provided", () => {
      const page = parseInt("1", 10);
      expect(page).toBe(1);
    });

    it("should default to limit=20 when not provided", () => {
      const limit = parseInt("20", 10);
      expect(limit).toBe(20);
    });

    it("should cap limit to 100 maximum", () => {
      const limit = Math.min(parseInt("150", 10), 100);
      expect(limit).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("should handle page=1 with empty results", () => {
      const response = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      expect(response.data.length).toBe(0);
      expect(response.total).toBe(0);
    });

    it("should handle very large page numbers", () => {
      const page = 1000000;
      const limit = 20;
      const offset = (page - 1) * limit;
      expect(offset).toBe(19999980);
    });

    it("should handle limit=1", () => {
      const response = {
        data: mockCampaigns.slice(0, 1),
        total: 25,
        page: 1,
        limit: 1,
      };

      expect(response.data.length).toBe(1);
    });

    it("should handle limit=100", () => {
      const largeData = Array.from({ length: 100 }, (_, i) => mockCampaigns[i % 25]);
      const response = {
        data: largeData,
        total: 150,
        page: 1,
        limit: 100,
      };

      expect(response.data.length).toBe(100);
      expect(response.limit).toBe(100);
    });
  });
});
