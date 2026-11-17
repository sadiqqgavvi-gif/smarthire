import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, test, vi } from "vitest";
import axios from "axios";
import Auth from "../pages/Auth";
import { authFetch } from "../utils/authFetch";
import { getRedirectAfterLogin } from "../utils/navigation";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("../utils/authFetch", () => ({ authFetch: vi.fn(), logoutUser: vi.fn() }));

describe("getRedirectAfterLogin", () => {
  test("returns the protected page the visitor was trying to open", () => {
    expect(
      getRedirectAfterLogin({ from: { pathname: "/practice/situational/configure", search: "?x=1" } })
    ).toBe("/practice/situational/configure?x=1");
  });

  test("falls back to home when there is no target or it is an auth page", () => {
    expect(getRedirectAfterLogin(undefined)).toBe("/");
    expect(getRedirectAfterLogin({ from: { pathname: "/login" } })).toBe("/");
  });
});

describe("Logging in from a protected page", () => {
  afterEach(() => vi.clearAllMocks());

  test("continues to that page instead of the home page", async () => {
    authFetch.mockResolvedValue({ ok: true });
    axios.post.mockResolvedValue({ data: { message: "Login successful" } });

    render(
      <MemoryRouter
        initialEntries={[{ pathname: "/login", state: { from: { pathname: "/practice/technical/configure" } } }]}
      >
        <Routes>
          <Route path="/login" element={<Auth type="login" />} />
          <Route path="/practice/technical/configure" element={<div>Configure technical</div>} />
          <Route path="/" element={<div>Home screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText(/^email$/i), "ali@example.com");
    await userEvent.type(screen.getByPlaceholderText(/^password$/i), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /^log in$/i }));

    await waitFor(() => expect(screen.getByText("Configure technical")).toBeInTheDocument());
  });
});
