import { afterEach, describe, expect, it } from "vitest";
import { stashPendingSession, takePendingSession } from "../utils/pendingSession";

describe("pending session results", () => {
  afterEach(() => window.sessionStorage.clear());

  it("returns the stashed results once", () => {
    const payload = { mode: "practice", category: "technical", averageScore: 7.5 };
    stashPendingSession(payload);

    expect(takePendingSession()).toEqual(payload);
    expect(takePendingSession()).toBeNull();
  });

  it("ignores results older than a day", () => {
    window.sessionStorage.setItem(
      "smarthire-pending-session",
      JSON.stringify({ payload: { mode: "mock" }, stashedAt: Date.now() - 25 * 60 * 60 * 1000 })
    );

    expect(takePendingSession()).toBeNull();
  });

  it("survives corrupted storage", () => {
    window.sessionStorage.setItem("smarthire-pending-session", "{not json");
    expect(takePendingSession()).toBeNull();
  });
});
