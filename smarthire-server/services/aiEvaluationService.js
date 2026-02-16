import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const evaluateAnswer = async (question, answer) => {
  try {
    const prompt = `
You are an interview evaluator.

Question:
${question}

Candidate Answer:
${answer}

Give:
1. Score out of 10
2. Strengths
3. Improvements
4. Final feedback
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Evaluation Error:", error);
    throw error;
  }
};
