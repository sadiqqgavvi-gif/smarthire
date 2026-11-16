import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import ProtectedRoute from "../routes/ProtectedRoute";
import { authFetch } from "../utils/authFetch";

vi.mock("../utils/authFetch", () => ({
  authFetch: vi.fn(),
  logoutUser: vi.fn(),
}));

describe("ProtectedRoute", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("redirects unauthorized users to /login", async () => {
    authFetch.mockResolvedValueOnce({ ok: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Login page")).toBeInTheDocument();
    });
  });

  test("renders protected content for authorized users", async () => {
    authFetch.mockResolvedValueOnce({ ok: true });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    });
  });
});
