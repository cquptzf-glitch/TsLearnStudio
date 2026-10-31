import { describe, expect, it } from "vitest";
import { loadUser, DataValidationError, type FetchLike } from "../starter/loadUser";

/** Required/optional verification case examples. The local files are not security-secret. */
const reply = (status: number, body: unknown): FetchLike => async () =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("PR-07 additional verification", () => {
  it("C04: network rejection must not become a User", async () => {
    const networkError = new TypeError("offline");
    const fetcher: FetchLike = async () => { throw networkError; };
    await expect(loadUser(7, fetcher)).rejects.toBe(networkError);
  });

  it("C05: invalid JSON is a parsing failure", async () => {
    const fetcher: FetchLike = async () => new Response("not valid JSON", { status: 200 });
    await expect(loadUser(7, fetcher)).rejects.toThrow(SyntaxError);
  });

  it("C06: structurally invalid JSON throws DataValidationError", async () => {
    await expect(loadUser(7, reply(200, { id: "7", name: null })))
      .rejects.toBeInstanceOf(DataValidationError);
  });

  it("C07 optional: invalid id does not trigger a network request", async () => {
    let called = false;
    const fetcher: FetchLike = async () => {
      called = true;
      return new Response("{}", { status: 200 });
    };
    await expect(loadUser(0, fetcher)).rejects.toThrow(RangeError);
    expect(called).toBe(false);
  });
});
