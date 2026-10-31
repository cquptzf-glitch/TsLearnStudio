import { describe, expect, it } from "vitest";
import {
  loadUser,
  HttpError,
  DataValidationError,
  type FetchLike
} from "../starter/loadUser";

/**
 * PR-07 public test sample.
 * The provided starter is intentionally flawed: C02 and C03 should fail until repaired.
 * This is a source sample; the desktop runner and dependency install do not exist yet.
 */
const reply = (status: number, body: unknown): FetchLike => {
  return async () => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
};

describe("PR-07 public acceptance", () => {
  it("C01: valid JSON returns User", async () => {
    await expect(loadUser(7, reply(200, { id: 7, name: "Ada" }))).resolves.toEqual({
      id: 7,
      name: "Ada"
    });
  });

  it("C02: 404 response throws HttpError with status", async () => {
    try {
      await loadUser(7, reply(404, { error: "not found" }));
      throw new Error("Expected HttpError; loadUser returned a value");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(404);
    }
  });

  it("C03: 500 response throws HttpError with status", async () => {
    try {
      await loadUser(7, reply(500, { error: "server" }));
      throw new Error("Expected HttpError; loadUser returned a value");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).status).toBe(500);
    }
  });

});
