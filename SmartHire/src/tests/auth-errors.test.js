import { describe, expect, test } from "vitest";
import { getAuthErrorMessage } from "../utils/authErrors";

describe("getAuthErrorMessage", () => {
  test("explains a database outage instead of a generic error", () => {
    const err = {
      response: {
        status: 503,
        data: { error: { code: "DATABASE_UNAVAILABLE", message: "Service temporarily unavailable" } },
      },
    };
    expect(getAuthErrorMessage(err)).toMatch(/can't reach the database/i);
  });

  test("uses the API message for normal validation errors", () => {
    const err = {
      response: {
        status: 400,
        data: { error: { code: "INVALID_CREDENTIALS", message: "Incorrect email or password" } },
      },
    };
    expect(getAuthErrorMessage(err)).toBe("Incorrect email or password");
  });

  test("explains network failures", () => {
    expect(getAuthErrorMessage({ code: "ERR_NETWORK", message: "Network Error" })).toMatch(
      /cannot reach the smarthire server/i
    );
  });
});
