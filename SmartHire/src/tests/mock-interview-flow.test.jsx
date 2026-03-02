import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import MockInterview from "../pages/MockInterview";

vi.mock("../utils/authFetch", () => ({
  authFetch: vi.fn().mockResolvedValue({ ok: true }),
  logoutUser: vi.fn(),
}));

const mockJsonResponse = (payload, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
});

describe("MockInterview flow", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockImplementation(async (url, options) => {
      const asString = String(url);

      if (asString.includes("/api/practice/technical")) {
        return mockJsonResponse({
          questions: [{ _id: "q1", question: "What is a JavaScript closure?" }],
        });
      }

      if (asString.includes("/api/mock/evaluate")) {
        return mockJsonResponse({
          success: true,
          evaluation: {
            score: 8,
            strengths: "Clear explanation",
            weaknesses: "Could add one practical example",
            improvement: "Add one concise real-world example.",
            overall_feedback: "Good answer with minor room for more depth.",
          },
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

  test("loads question, submits answer, and shows AI feedback", async () => {
    render(
      <MemoryRouter initialEntries={["/mock-interview/technical?count=1&difficulty=easy"]}>
        <Routes>
          <Route path="/mock-interview/:type" element={<MockInterview />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText(/what is a javascript closure\?/i)
      ).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText(/speak naturally/i),
      "A closure is when a function keeps access to outer scope variables."
    );
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai feedback/i)).toBeInTheDocument();
      expect(screen.getByText(/score:/i)).toBeInTheDocument();
      expect(screen.getByText(/clear explanation/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [, evaluateCallOptions] = fetchMock.mock.calls[1];
    const requestBody = JSON.parse(evaluateCallOptions.body);

    expect(requestBody).toMatchObject({
      question: "What is a JavaScript closure?",
      category: "technical",
    });
    expect(requestBody.answer).toMatch(/closure/i);
  });
});
