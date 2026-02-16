export const smartEvaluate = (question, answer, category = "general") => {
  if (!answer || answer.trim().length === 0) {
    return {
      score: 1,
      strengths: "Attempted the question.",
      weaknesses: "No meaningful answer provided.",
      improvement: "Provide a complete explanation.",
      overall_feedback: "Answer is incomplete."
    };
  }

  const cleanAnswer = answer.toLowerCase();
  const wordCount = cleanAnswer.split(/\s+/).length;

  let clarityScore = 0;
  let depthScore = 0;
  let relevanceScore = 0;
  let structureScore = 0;
  let exampleScore = 0;

  /* =========================
     1️⃣ CLARITY (20%)
  ========================= */
  if (wordCount > 30) clarityScore += 5;
  if (wordCount > 70) clarityScore += 5;
  if (cleanAnswer.includes(".")) clarityScore += 5;
  if (!cleanAnswer.includes("umm") && !cleanAnswer.includes("maybe")) clarityScore += 5;

  /* =========================
     2️⃣ DEPTH (25%)
  ========================= */
  if (wordCount > 80) depthScore += 10;
  if (wordCount > 120) depthScore += 10;
  if (cleanAnswer.includes("because")) depthScore += 5;

  /* =========================
     3️⃣ RELEVANCE (25%)
  ========================= */
  const questionKeywords = question
    .toLowerCase()
    .split(" ")
    .filter(word => word.length > 4);

  let matchCount = 0;
  questionKeywords.forEach(word => {
    if (cleanAnswer.includes(word)) matchCount++;
  });

  relevanceScore = Math.min(matchCount * 3, 25);

  /* =========================
     4️⃣ STRUCTURE (15%)
  ========================= */
  if (cleanAnswer.includes("first")) structureScore += 5;
  if (cleanAnswer.includes("second")) structureScore += 5;
  if (cleanAnswer.includes("finally") || cleanAnswer.includes("in conclusion"))
    structureScore += 5;

  /* =========================
     5️⃣ EXAMPLES (15%)
  ========================= */
  if (
    cleanAnswer.includes("for example") ||
    cleanAnswer.includes("for instance") ||
    cleanAnswer.includes("in my experience")
  ) {
    exampleScore = 15;
  }

  /* =========================
     TOTAL SCORE
  ========================= */
  const total =
    clarityScore * 0.2 +
    depthScore * 0.25 +
    relevanceScore * 0.25 +
    structureScore * 0.15 +
    exampleScore * 0.15;

  const finalScore = Math.min(Math.round(total / 10), 10);

  /* =========================
     FEEDBACK GENERATION
  ========================= */
  let strengths = [];
  let weaknesses = [];

  if (clarityScore > 10) strengths.push("Clear explanation");
  else weaknesses.push("Improve clarity");

  if (depthScore > 15) strengths.push("Good depth of explanation");
  else weaknesses.push("Add more technical depth");

  if (relevanceScore > 15) strengths.push("Answer is relevant to the question");
  else weaknesses.push("Stay more aligned with the question");

  if (exampleScore === 15) strengths.push("Used real-world example");
  else weaknesses.push("Include examples to strengthen answer");

  const overall =
    finalScore >= 8
      ? "Excellent response with strong structure and depth."
      : finalScore >= 6
      ? "Good response but can be improved with more detail."
      : "Answer needs improvement in clarity and structure.";

  return {
    score: finalScore,
    strengths: strengths.join(", "),
    weaknesses: weaknesses.join(", "),
    improvement:
      "Structure answers clearly, include examples, and explain reasoning in depth.",
    overall_feedback: overall
  };
};
