import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../validation';
import { errorHandler } from '../errorHandler';

const app = express();
app.use(express.json());

// Test schemas
const TestBodySchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().int().positive("Age must be a positive integer")
});

const TestParamsSchema = z.object({
  id: z.string().transform(val => {
    const num = parseInt(val, 10);
    if (isNaN(num)) throw new Error("Invalid ID");
    return num;
  })
});

const TestQuerySchema = z.object({
  limit: z.string().optional().transform(val => parseInt(val || "10", 10)),
  search: z.string().optional()
});

// Test routes
app.post('/test-body', validateBody(TestBodySchema), (req, res) => {
  res.json({ success: true, data: req.body });
});

app.get('/test-params/:id', validateParams(TestParamsSchema), (req, res) => {
  res.json({ success: true, id: req.params.id });
});

app.get('/test-query', validateQuery(TestQuerySchema), (req, res) => {
  res.json({ success: true, query: req.query });
});

app.use(errorHandler);

describe('Validation Middleware', () => {
  describe('validateBody', () => {
    it('should accept valid body data', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({ name: 'John', age: 25 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ name: 'John', age: 25 });
    });

    it('should reject invalid body data', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({ name: '', age: -5 });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveLength(2);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/test-body')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateParams', () => {
    it('should accept valid params', async () => {
      const response = await request(app)
        .get('/test-params/123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.id).toBe(123);
    });

    it('should reject invalid params', async () => {
      const response = await request(app)
        .get('/test-params/invalid');

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('validateQuery', () => {
    it('should accept valid query params', async () => {
      const response = await request(app)
        .get('/test-query?limit=20&search=test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.query.limit).toBe(20);
      expect(response.body.query.search).toBe('test');
    });

    it('should use defaults for missing optional params', async () => {
      const response = await request(app)
        .get('/test-query');

      expect(response.status).toBe(200);
      expect(response.body.query.limit).toBe(10);
    });
  });
});
