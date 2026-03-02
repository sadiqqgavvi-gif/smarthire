import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import axios from "axios";
import Auth from "../pages/Auth";
import { authFetch } from "../utils/authFetch";

vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("../utils/authFetch", () => ({
  authFetch: vi.fn(),
  logoutUser: vi.fn(),
}));

describe("Auth page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("submits login and navigates to home when session verification succeeds", async () => {
    authFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });

    axios.post.mockResolvedValue({
      data: { message: "Login successful" },
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Auth type="login" />} />
          <Route path="/" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText(/email/i), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText(/password/i), "abc12345");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Home screen")).toBeInTheDocument();
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [calledUrl, payload] = axios.post.mock.calls[0];
    expect(String(calledUrl)).toContain("/api/auth/login");
    expect(payload).toEqual({
      email: "user@example.com",
      password: "abc12345",
    });
    expect(authFetch).toHaveBeenCalledTimes(2);
  });
});
