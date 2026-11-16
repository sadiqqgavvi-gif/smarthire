import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import Contact from "../components/Contact";
import FAQ from "../components/FAQ";

describe("Contact form", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("shows a validation message instead of calling the API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<Contact />);

    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/please enter your name/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("sends the message and shows an inline success notice", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: "Message sent successfully!" }),
    });
    render(<Contact />);

    await userEvent.type(screen.getByPlaceholderText(/your name/i), "Ali Khan");
    await userEvent.type(screen.getByPlaceholderText(/you@example.com/i), "ali@example.com");
    await userEvent.type(screen.getByPlaceholderText(/how can we help/i), "Please add Python questions.");
    await userEvent.click(screen.getByRole("button", { name: /send message/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(/your message has been sent/i);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/contact");
    expect(JSON.parse(options.body)).toEqual({
      name: "Ali Khan",
      email: "ali@example.com",
      message: "Please add Python questions.",
    });
    expect(screen.getByPlaceholderText(/your name/i)).toHaveValue("");
  });
});

describe("FAQ", () => {
  test("opens one answer at a time", async () => {
    render(<FAQ />);

    const first = screen.getByRole("button", { name: /is smarthire free/i });
    const second = screen.getByRole("button", { name: /need a google account/i });
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(second);

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/create an account with any email/i)).toBeVisible();
  });
});
