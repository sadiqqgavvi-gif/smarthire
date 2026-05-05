import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import MockInterview from "../pages/MockInterview";
import { authFetch } from "../utils/authFetch";

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
  const recognitionInstances = [];

  beforeEach(() => {
    recognitionInstances.length = 0;

    class MockSpeechRecognition {
      constructor() {
        this.start = vi.fn();
        this.stop = vi.fn();
        recognitionInstances.push(this);
      }
    }

    fetchMock.mockImplementation(async (url) => {
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
    vi.stubGlobal("SpeechRecognition", MockSpeechRecognition);
    vi.stubGlobal("speechSynthesis", {
      cancel: vi.fn(),
      speak: vi.fn(),
    });
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
      expect(screen.getByText(/final question evaluated/i)).toBeInTheDocument();
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

  test("lets the user manually save or retry after the final evaluation", async () => {
    render(
      <MemoryRouter initialEntries={["/mock-interview/technical?count=1&difficulty=easy"]}>
        <Routes>
          <Route path="/mock-interview/:type" element={<MockInterview />} />
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/what is a javascript closure\?/i)).toBeInTheDocument();
    });

    await userEvent.type(
      screen.getByPlaceholderText(/speak naturally/i),
      "A closure keeps access to values from its outer lexical scope."
    );
    await userEvent.click(screen.getByRole("button", { name: /submit answer/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /save to dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry mock interview/i })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^back$/i }).length).toBeGreaterThan(0);
    });

    expect(authFetch).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /save to dashboard/i }));

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/mock interview saved to your dashboard/i)).toBeInTheDocument();
    });

    const [, saveOptions] = authFetch.mock.calls[0];
    expect(JSON.parse(saveOptions.body)).toMatchObject({
      mode: "mock",
      category: "technical",
      difficulty: "easy",
      questionCount: 1,
      attemptedCount: 1,
      averageScore: 8,
    });
  });

  test("uses voice transcript as an editable answer", async () => {
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

    const speakButton = screen.getByRole("button", { name: /speak/i });
    await waitFor(() => expect(speakButton).toBeEnabled());
    await userEvent.click(speakButton);

    act(() => {
      recognitionInstances[0].onresult({
        resultIndex: 0,
        results: [
          Object.assign([{ transcript: "Closures keep access to outer variables." }], {
            isFinal: true,
          }),
        ],
      });
    });

    expect(screen.getByPlaceholderText(/speak naturally/i)).toHaveValue(
      "Closures keep access to outer variables."
    );
  });
});
