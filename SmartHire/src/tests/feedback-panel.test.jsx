import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import FeedbackPanel from "../components/app/FeedbackPanel";

const evaluation = {
  score: 7.5,
  strengths: "Clear definition.",
  weaknesses: "Some key concepts are missing.",
  improvement: "Mention lexical scope.",
  overall_feedback: "Strong answer.",
  criteria: [
    { key: "relevance", label: "Relevance", score: 8 },
    { key: "depth", label: "Depth", score: 7 },
    { key: "structure", label: "Structure", score: 6.5 },
    { key: "clarity", label: "Clarity", score: 9 },
    { key: "examples", label: "Examples", score: 5 },
  ],
  missingConcepts: ["lexical", "callback"],
  fillerWords: { count: 2, words: [{ word: "basically", count: 2 }] },
  referenceAnswer: "A closure keeps access to its outer scope.\n\n```js\nfunction outer() {}\n```",
};

describe("FeedbackPanel", () => {
  test("shows criteria, missing concepts, filler words and a model answer on demand", async () => {
    render(<FeedbackPanel evaluation={evaluation} category="technical" />);

    expect(screen.getByText("Relevance")).toBeInTheDocument();
    expect(screen.getByText("Examples")).toBeInTheDocument();
    expect(screen.getByText("lexical")).toBeInTheDocument();
    expect(screen.getByText(/“basically” ×2/)).toBeInTheDocument();
    expect(screen.queryByText(/keeps access to its outer scope/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /see a model answer/i }));

    expect(screen.getByText(/keeps access to its outer scope/i)).toBeInTheDocument();
    expect(screen.getByText("function outer() {}")).toBeInTheDocument();
  });

  test("shows the STAR guide for behavioral answers without a reference answer", async () => {
    render(
      <FeedbackPanel evaluation={{ ...evaluation, referenceAnswer: null }} category="behavioral" />
    );

    await userEvent.click(screen.getByRole("button", { name: /what a strong answer includes/i }));
    expect(screen.getByText(/set the scene/i)).toBeInTheDocument();
  });
});
