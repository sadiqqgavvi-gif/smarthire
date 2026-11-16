import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import ThemeProvider from "../theme/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";

describe("Theme toggle", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  test("switches between light and dark mode and remembers the choice", async () => {
    window.localStorage.setItem("smarthire-theme", "light");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await userEvent.click(screen.getByRole("button", { name: /switch to dark mode/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("smarthire-theme")).toBe("dark");

    await userEvent.click(screen.getByRole("button", { name: /switch to light mode/i }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("smarthire-theme")).toBe("light");
  });
});
