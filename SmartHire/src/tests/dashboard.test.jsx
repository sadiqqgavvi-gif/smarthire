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
      expect(screen.getByText(/1 mock sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/average mock score/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/combined average across all saved sessions/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/recent mock sessions/i)).not.toBeInTheDocument();
  });

  test("shows a practice performance view", async () => {
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

    expect(screen.getByRole("button", { name: /practice performance/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /practice performance/i }));

    await waitFor(() => {
      expect(screen.getByText(/practice summary/i)).toBeInTheDocument();
      expect(screen.getByText(/1 practice sessions/i)).toBeInTheDocument();
      expect(screen.getByText(/average practice score/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/practice and mock sessions recorded in the dashboard/i)).not.toBeInTheDocument();
  });
  test("lists saved sessions in the session history table", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/session history/i)).toBeInTheDocument();
    expect(screen.getByText("8.0/10")).toBeInTheDocument();
    expect(screen.getByText("6.0/10")).toBeInTheDocument();
    // Overall score uses the exact average (7/10), not a rounded value.
    expect(screen.getAllByText("70%").length).toBeGreaterThan(0);
  });

  test("invites new users to start their first session", async () => {
    authFetchMock.mockResolvedValue(
      mockJsonResponse({ stats: { overallScore: 0, totalSessions: 0, completedInterviews: 0 }, sessions: [] })
    );

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/start your first session/i)).toBeInTheDocument();
  });
});
