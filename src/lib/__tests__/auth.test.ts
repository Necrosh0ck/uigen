// @vitest-environment node
import { test, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ set: mockCookieSet })),
}));

import { createSession } from "@/lib/auth";

beforeEach(() => {
  mockCookieSet.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("createSession sets a cookie named auth-token", async () => {
  await createSession("user-123", "test@example.com");
  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [name] = mockCookieSet.mock.calls[0];
  expect(name).toBe("auth-token");
});

test("createSession cookie value is a signed JWT containing userId and email", async () => {
  await createSession("user-123", "test@example.com");
  const [, token] = mockCookieSet.mock.calls[0];
  const parts = (token as string).split(".");
  expect(parts).toHaveLength(3);
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
  expect(payload.userId).toBe("user-123");
  expect(payload.email).toBe("test@example.com");
});

test("createSession cookie expires in approximately 7 days", async () => {
  const before = Date.now();
  await createSession("user-123", "test@example.com");
  const after = Date.now();
  const [, , options] = mockCookieSet.mock.calls[0];
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  expect((options.expires as Date).getTime()).toBeGreaterThanOrEqual(before + sevenDays - 1000);
  expect((options.expires as Date).getTime()).toBeLessThanOrEqual(after + sevenDays + 1000);
});

test("createSession cookie is httpOnly", async () => {
  await createSession("user-123", "test@example.com");
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
});

test("createSession cookie has sameSite lax", async () => {
  await createSession("user-123", "test@example.com");
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.sameSite).toBe("lax");
});

test("createSession cookie has path /", async () => {
  await createSession("user-123", "test@example.com");
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.path).toBe("/");
});

test("createSession cookie is not secure outside production", async () => {
  await createSession("user-123", "test@example.com");
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession cookie is secure in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  await createSession("user-123", "test@example.com");
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.secure).toBe(true);
});
