import fs from "fs";
import path from "path";

const BASE_PATH = path.join(process.cwd(), "topics", "en");

export const getRandomMockQuestions = (category, count = 5) => {
  const categoryPath = path.join(BASE_PATH, category);

  if (!fs.existsSync(categoryPath)) {
    throw new Error("Invalid category");
  }

  const files = fs.readdirSync(categoryPath);

  let allQuestions = [];

  files.forEach((file) => {
    const filePath = path.join(categoryPath, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Assuming each question is separated by newline or numbered
    const questions = content
      .split("\n")
      .filter((line) => line.trim().length > 10);

    allQuestions.push(...questions);
  });

  if (allQuestions.length < count) {
    throw new Error("Not enough questions in dataset");
  }

  // Shuffle
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());

  return shuffled.slice(0, count);
};
