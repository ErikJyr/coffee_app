export type HttpError = Error & { statusCode: number; code: string }

/** Attach a stable API code without exposing database or credential details. */
export function httpError(statusCode: number, code: string, message: string): HttpError {
  return Object.assign(new Error(message), { name: code, statusCode, code })
}
