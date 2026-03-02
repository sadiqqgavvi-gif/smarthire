import Question from "../models/questionModel.js";
import { sendError, sendSuccess } from "../utils/apiResponse.js";

const buildUniqueQuestionPipeline = (filter, size, excludedQuestions = []) => {
  const pipeline = [
    { $match: filter },
    {
      $addFields: {
        __normalizedQuestion: {
          $toLower: { $trim: { input: "$question" } },
        },
      },
    },
  ];

  if (excludedQuestions.length) {
    pipeline.push({
      $match: {
        __normalizedQuestion: { $nin: excludedQuestions },
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$__normalizedQuestion",
        doc: { $first: "$$ROOT" },
      },
    },
    { $replaceRoot: { newRoot: "$doc" } },
    { $project: { __normalizedQuestion: 0 } },
    { $sample: { size } }
  );

  return pipeline;
};

export const getQuestions = async (req, res) => {
  try {
    console.log("Query Params:", req.query);

    const category = req.query.category?.toLowerCase();
    const difficulty = req.query.difficulty?.toLowerCase();
    const role = req.query.role?.toLowerCase();
    const parsedCount = Number.parseInt(req.query.count, 10);
    const count = Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 5;

    if (!category) {
      return sendError(res, {
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Category is required",
      });
    }

    const baseFilter = { category };
    if (role) {
      baseFilter.role = role;
    }

    const filter = { ...baseFilter };

    // Behavioral questions ignore difficulty.
    if (category !== "behavioral" && difficulty && difficulty !== "any") {
      filter.difficulty = difficulty;
    }

    // Random questions with duplicate text removed.
    let questions = await Question.aggregate(buildUniqueQuestionPipeline(filter, count));

    // Fallback/top-up for sparse difficulty buckets (for example, situational + easy).
    if (questions.length < count && filter.difficulty) {
      const remaining = count - questions.length;
      const seen = questions.map((q) => q.question.trim().toLowerCase());
      const extraQuestions = await Question.aggregate(
        buildUniqueQuestionPipeline(baseFilter, remaining, seen)
      );
      questions = [...questions, ...extraQuestions];
    }

    console.log(`Returned ${questions.length} questions`);

    return sendSuccess(res, {
      total: questions.length,
      questions,
    });
  } catch (error) {
    console.error("getQuestions error:", error);

    return sendError(res, {
      status: 500,
      code: "QUESTIONS_FETCH_ERROR",
      message: "Server error while fetching questions",
    });
  }
};
