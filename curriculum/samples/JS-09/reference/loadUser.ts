/**
 * Reference design, NOT shown by default to learners.
 * This file is a content sample rather than an integrated grader.
 */
export interface User {
  id: number;
  name: string;
}
export type FetchLike = (url: string) => Promise<Pick<Response, "ok" | "status" | "json">>;

export class HttpError extends Error {
  readonly name = "HttpError";
  constructor(public readonly status: number) {
    super("HTTP " + status);
  }
}

export class DataValidationError extends Error {
  readonly name = "DataValidationError";
  constructor(message = "Invalid user response") {
    super(message);
  }
}

function isUser(value: unknown): value is User {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.id === "number" && Number.isSafeInteger(obj.id) && obj.id > 0
    && typeof obj.name === "string" && obj.name.trim().length > 0;
}

export async function loadUser(id: number, fetcher: FetchLike = fetch): Promise<User> {
  if (!Number.isSafeInteger(id) || id <= 0) throw new RangeError("id must be a positive integer");
  const response = await fetcher("/api/users/" + id);
  if (!response.ok) throw new HttpError(response.status);
  const value: unknown = await response.json();
  if (!isUser(value)) throw new DataValidationError();
  return value;
}
