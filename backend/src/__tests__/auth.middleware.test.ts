import { Request, Response, NextFunction } from "express";
import { requireAuth, AuthRequest } from "../auth";

function mockRes() {
  const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

describe("requireAuth middleware", () => {
  const next: NextFunction = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it("returns 401 when Authorization header is missing", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    requireAuth(req, res, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header does not start with Bearer", () => {
    const req = { headers: { authorization: "Basic abc" } } as Request;
    const res = mockRes();
    requireAuth(req, res, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a malformed token", () => {
    const req = { headers: { authorization: "Bearer not.a.valid.token" } } as Request;
    const res = mockRes();
    requireAuth(req, res, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for a token with invalid signature", () => {
    // Craft a token with a tampered signature
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHQUJDIn0.invalidsig";
    const req = { headers: { authorization: `Bearer ${fakeToken}` } } as Request;
    const res = mockRes();
    requireAuth(req, res, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for an expired token", () => {
    const b64url = (s: string) => Buffer.from(s).toString("base64url");
    const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = b64url(JSON.stringify({ sub: "GABC", exp: 1 })); // exp in 1970
    const expiredToken = `${header}.${payload}.fakesig`;
    const req = { headers: { authorization: `Bearer ${expiredToken}` } } as Request;
    const res = mockRes();
    requireAuth(req, res, next);
    expect((res.status as jest.Mock).mock.calls[0][0]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
