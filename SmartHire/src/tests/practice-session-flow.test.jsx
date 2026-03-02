import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import PracticeSession from "../pages/PracticeSession";
import { authFetch } from "../utils/authFetch";

vi.mock("../utils/authFetch", () => ({
  authFetch: vi.fn(),
  logoutUser: vi.fn(),
}));

const mockJsonResponse = (payload, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
});

describe("PracticeSession flow", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    authFetch.mockResolvedValue({ ok: true });

    fetchMock.mockImplementation(async (url) => {
      const asString = String(url);

      if (asString.includes("/api/questions?")) {
        return mockJsonResponse({
          success: true,
          total: 1,
          questions: [
            {
              _id: "q1",
              question: "Explain event loop in JavaScript.",
            },
          ],
        });
      }

      if (asString.includes("/api/ai/evaluate")) {
        return mockJsonResponse({
          success: true,
          score: 8,
          strengths: "Clear explanation",
          weaknesses: "Could mention microtask queue explicitly",
          improvement: "Add one concise real-world scenario.",
          overall_feedback: "Good answer with solid structure.",
          feedback: "Good answer with solid structure.",
        });
      }

      return mockJsonResponse({}, false, 404);
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("loads question, evaluates answer, and saves practice session", async () => {
    render(
      <MemoryRouter initialEntries={["/practice/technical?count=1&difficulty=easy"]}>
        <Routes>
          <Route path="/practice/:type" element={<PracticeSession />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/explain event loop in javascript/i)).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText(/write your answer here/i),
      "The event loop processes macrotasks and microtasks; promises run in microtasks."
    );
    await userEvent.click(screen.getByRole("button", { name: /evaluate answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/overall feedback:/i)).toBeInTheDocument();
      expect(screen.getByText(/good answer with solid structure/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", {
      name: /finish & save session/i,
    });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/session saved to dashboard/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(authFetch).toHaveBeenCalledTimes(1);

    const [saveUrl, saveOptions] = authFetch.mock.calls[0];
    expect(String(saveUrl)).toContain("/api/practice/sessions");

    const payload = JSON.parse(saveOptions.body);
    expect(payload).toMatchObject({
      mode: "practice",
      category: "technical",
      difficulty: "easy",
      questionCount: 1,
      attemptedCount: 1,
      averageScore: 8,
    });
  });
});
