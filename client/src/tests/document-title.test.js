import { describe, expect, it } from "vitest";
import { DEFAULT_TITLE, getDocumentTitle } from "../utils/documentTitle";

describe("getDocumentTitle", () => {
  it("keeps the full product title on the home page", () => {
    expect(getDocumentTitle("/")).toBe(DEFAULT_TITLE);
  });

  it("names each page", () => {
    expect(getDocumentTitle("/login")).toBe("Log in · SmartHire");
    expect(getDocumentTitle("/dashboard")).toBe("Dashboard · SmartHire");
    expect(getDocumentTitle("/practice/technical/configure")).toBe("Set up Technical practice · SmartHire");
    expect(getDocumentTitle("/practice/behavioral")).toBe("Behavioral practice session · SmartHire");
    expect(getDocumentTitle("/mock-interview/situational")).toBe("Situational mock interview · SmartHire");
  });

  it("falls back to the not-found title for unknown paths", () => {
    expect(getDocumentTitle("/does/not/exist")).toBe("Page not found · SmartHire");
  });
});
