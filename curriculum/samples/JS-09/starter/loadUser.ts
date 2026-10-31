/**
 * PR-07 starter. A deliberately flawed implementation.
 * Contract: fix HTTP errors and validate JSON shape at runtime.
 * Do not execute student code in the Electron main process.
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

export async function loadUser(id: number, fetcher: FetchLike = fetch): Promise<User> {
  const response = await fetcher("/api/users/" + id);
  // TODO: 1) handle non-2xx 2) validate the untrusted JSON body.
  return (await response.json()) as User;
}
