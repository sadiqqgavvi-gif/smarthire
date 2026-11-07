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
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

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

  test("shows the google sign-in option on the login screen", async () => {
    authFetch.mockResolvedValue({ ok: false });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Auth type="login" />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /continue with google/i })
      ).toBeInTheDocument();
    });
  });
});

describe("Signup page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderSignup = () =>
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<Auth type="signup" />} />
          <Route path="/" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    );

  test("offers Google sign-up alongside the email form", async () => {
    authFetch.mockResolvedValue({ ok: false });
    renderSignup();

    expect(
      await screen.findByRole("button", { name: /continue with google/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  test("blocks submission when passwords do not match", async () => {
    authFetch.mockResolvedValue({ ok: false });
    renderSignup();

    await userEvent.type(screen.getByPlaceholderText(/^email$/i), "new@example.com");
    await userEvent.type(screen.getByPlaceholderText(/at least 6 characters/i), "abc12345");
    await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), "different1");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/passwords do not match/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test("creates the account with name, email and password", async () => {
    authFetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true });
    axios.post.mockResolvedValue({ data: { message: "Registration successful" } });
    renderSignup();

    await userEvent.type(screen.getByPlaceholderText(/your name/i), "Ali Khan");
    await userEvent.type(screen.getByPlaceholderText(/^email$/i), "new@example.com");
    await userEvent.type(screen.getByPlaceholderText(/at least 6 characters/i), "abc12345");
    await userEvent.type(screen.getByPlaceholderText(/re-enter your password/i), "abc12345");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Home screen")).toBeInTheDocument();
    });
    const [calledUrl, payload] = axios.post.mock.calls[0];
    expect(String(calledUrl)).toContain("/api/auth/register");
    expect(payload).toEqual({ name: "Ali Khan", email: "new@example.com", password: "abc12345" });
  });
});

describe("Get started page tabs", () => {
  test("switches between the sign up and log in tabs", async () => {
    authFetch.mockResolvedValue({ ok: false });

    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<Auth type="signup" />} />
          <Route path="/login" element={<Auth type="login" />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("tab", { name: /sign up/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /log in/i }));

    expect(await screen.findByRole("button", { name: /^log in$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /log in/i })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByPlaceholderText(/re-enter your password/i)).not.toBeInTheDocument();
  });
});
