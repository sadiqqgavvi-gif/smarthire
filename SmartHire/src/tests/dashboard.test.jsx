import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import Dashboard from "../pages/Dashboard";

vi.mock("recharts", () => ({
  BarChart: ({ children }) => <div data-testid="barchart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive">{children}</div>,
}));

vi.mock("../utils/authFetch", () => ({
  authFetch: vi.fn(),
  logoutUser: vi.fn(),
}));

const mockJsonResponse = (payload, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => payload,
});

describe("Dashboard", () => {
  const authFetchMock = vi.fn();
  const logoutUserMock = vi.fn();

  beforeEach(async () => {
    const authModule = await import("../utils/authFetch");
    authModule.authFetch.mockImplementation(authFetchMock);
    authModule.logoutUser.mockImplementation(logoutUserMock);

    authFetchMock.mockResolvedValue(
      mockJsonResponse({
        stats: {
          overallScore: 8,
          totalSessions: 4,
          completedInterviews: 2,
        },
        sessions: [
          {
            _id: "1",
            mode: "mock",
            category: "technical",
            difficulty: "easy",
            questionCount: 3,
            attemptedCount: 3,
            averageScore: 8,
          },
          {
            _id: "2",
            mode: "practice",
            category: "behavioral",
            difficulty: "medium",
            questionCount: 2,
            attemptedCount: 2,
            averageScore: 6,
          },
        ],
      })
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test("shows a mock interview performance view", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /dashboard/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /mock interview performance/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /mock interview performance/i }));

    await waitFor(() => {
      expect(screen.getByText(/mock interview summary/i)).toBeInTheDocument();
      expect(screen.getByText(/technical/i)).toBeInTheDocument();
      expect(screen.getByText(/average mock score/i)).toBeInTheDocument();
    });
  });
});
