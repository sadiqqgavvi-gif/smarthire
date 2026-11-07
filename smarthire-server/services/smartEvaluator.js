// SmartHire scoring engine.
//
// Scores an interview answer on five criteria (0-10 each) and combines them with
// category-specific weights:
//   relevance  - does the answer address the question (and the reference answer's key concepts)?
//   depth      - is there enough substance and reasoning?
//   structure  - is it organised? (STAR for behavioral, decision flow for situational)
//   clarity    - readable sentences, few filler words, little repetition
//   examples   - concrete examples, numbers, code or named tools
// It also reports filler words, missing concepts and missing STAR parts so the
// feedback is specific to the answer rather than generic.

const STOPWORDS = new Set(
  `a about above after again against all also am an and any are as at be because been before being
  below between both but by can could did do does doing down during each few for from further had has
  have having he her here hers herself him himself his how i if in into is it its itself just let me
  more most my myself no nor not now of off on once only or other our ours ourselves out over own same
  she should so some such than that the their theirs them themselves then there these they this those
  through to too under until up very was we were what when where which while who whom why will with
  would you your yours yourself yourselves us use used using one two get got make made like way thing
  things really well much many lot lots something anything everything also even still yet etc`.split(/\s+/)
);

// Words that appear in questions but say nothing about the topic.
const QUESTION_FILLER = new Set(
  `explain describe difference differences tell time give example examples mean means meaning work
  works working define definition list name compare comparison briefly following situation happened
  handle handled approach approached would could should outcome learn learned learnt actions take took
  prioritize first why how what when where which type types kind kinds main purpose role`.split(/\s+/)
);

// Generic words that are frequent in reference answers but are not concepts.
const GENERIC_TERMS = new Set(
  `inside outside within another different same other new called call calls look following below above
  simple simply available value values example code basic basically case cases actually able want need
  need needs going given gives take takes time times part parts good better best number result results
  instead possible certain specific general always never often usually first second last next note
  gets uses makes means says goes comes puts sets shows keeps lets tells works`.split(/\s+/)
);

const FILLER_PATTERNS = [
  ["um", /\bu+m+\b/gi],
  ["uh", /\bu+h+\b/gi],
  ["like", /\b(?:it'?s|was|is|just|and|so)\s+like\b|\blike,\s/gi],
  ["basically", /\bbasically\b/gi],
  ["actually", /\bactually\b/gi],
  ["you know", /\byou know\b/gi],
  ["kind of", /\bkind of\b/gi],
  ["sort of", /\bsort of\b/gi],
  ["literally", /\bliterally\b/gi],
  ["i mean", /\bi mean\b/gi],
];

const REASONING_PATTERN =
  /\b(because|therefore|thus|hence|so that|which means|this means|this allows|as a result|however|whereas|instead|compared to|unlike|trade-?offs?|advantages?|disadvantages?|benefits?|downsides?|in contrast|on the other hand|since|due to)\b/gi;
const SIGNPOST_PATTERN =
  /\b(first(?:ly)?|second(?:ly)?|third(?:ly)?|then|next|after that|finally|lastly|also|additionally|in addition|moreover|in summary|to summarize|overall|in short)\b/gi;
const EXAMPLE_PATTERN =
  /\b(for example|for instance|such as|e\.g\.|consider|imagine|in my (?:project|experience|internship|job|team|last|previous|final)|at my|when i)\b/i;
const DEFINITION_PATTERN =
  /\b(is an?|are|refers to|means|is used to|is the|is when|allows|decides|defines|determines|describes|represents|lets you|helps|controls)\b/i;
const CODE_PATTERN = /```|`[^`]+`|=>|\bfunction\s*\(|[{};]\s*$|\w+\(\)|\bO\([^)]+\)/m;
const NUMBER_WORD_PATTERN =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|fifty|hundred|thousand|dozen)\s+(weeks?|days?|months?|hours?|people|members|users|customers|bugs|features|tasks|times|percent)\b/i;
const TOOL_PATTERN =
  /\b(react|angular|vue|node(?:\.js)?|express|python|java|javascript|typescript|sql|mysql|postgres|mongodb|docker|git|github|jira|figma|aws|azure|firebase|excel|trello|slack|api|rest)\b/i;
const METRIC_PATTERN = /\b\d+(?:\.\d+)?\s?(?:%|percent|x|ms|seconds?|minutes?|hours?|days?|weeks?|months?|users?|people|members?|requests?)?\b/i;

const STAR_PARTS = {
  situation: {
    label: "Situation",
    pattern:
      /\b(when i|while i|at my|in my (?:previous|last|final|current|first|second|third)|during (?:my|our|a|the)|we were|our team|i was working|i was (?:a|an|the)|in (?:a|one|my) project|last (?:year|semester|month)|internship)\b/i,
  },
  task: {
    label: "Task",
    pattern:
      /\b(my (?:role|responsibility|task|job|goal)|i (?:needed|had|was asked|was supposed|wanted|was expected)(?: \w+){0,3} to|i was responsible|was responsible for|the (?:goal|task|challenge|problem|deadline) was|we (?:needed|had)(?: \w+){0,3} to|our goal)\b/i,
  },
  action: {
    label: "Action",
    pattern:
      /\b((?:i|and|then)(?: \w+ly)? (?:decided|implemented|organi[sz]ed|arranged|spoke|talked|met|created|built|led|proposed|suggested|scheduled|set up|took|started|reached out|analy[sz]ed|listened|explained|asked|broke|divided|delegated|wrote|designed|fixed|resolved|focused|worked|called|coordinated|helped|made sure|ensured|followed|studied|practi[cs]ed|read|watched|completed|reviewed|tested|debugged|researched|contacted|prepared|presented|volunteered|stayed|learned|learnt|trained|refactored|automated))\b/i,
  },
  result: {
    label: "Result",
    pattern:
      /\b(as a result|the result|resulted|outcome|in the end|eventually|ultimately|we (?:delivered|finished|completed|launched|met|won|shipped|achieved)|improved|reduced|increased|saved|on time|learned|learnt|lesson|feedback was)\b/i,
  },
};

const SITUATIONAL_PARTS = {
  firstStep: {
    label: "first step",
    pattern: /\b(first(?:ly)?,? i would|i would (?:first|start|begin)|my first step|initially|to start)\b/i,
  },
  communication: {
    label: "communication with others",
    pattern: /\b(communicat\w*|inform|discuss|talk to|speak (?:to|with)|explain|manager|stakeholders?|client|customer|team ?lead|teammates?|escalat\w*)\b/i,
  },
  analysis: {
    label: "analysis and prioritisation",
    pattern: /\b(prioriti[sz]\w*|assess|evaluat\w*|analy[sz]\w*|understand|impact|risks?|trade-?offs?|options?|root cause|urgent|important)\b/i,
  },
  resolution: {
    label: "plan and follow-through",
    pattern: /\b(plan|deadline|deliver\w*|solution|follow up|follow-up|ensure|make sure|monitor|document|prevent|next time|in the future)\b/i,
  },
};

const WEIGHTS = {
  technical: { relevance: 0.35, depth: 0.25, structure: 0.1, clarity: 0.15, examples: 0.15 },
  behavioral: { relevance: 0.2, depth: 0.1, structure: 0.35, clarity: 0.15, examples: 0.2 },
  situational: { relevance: 0.25, depth: 0.2, structure: 0.3, clarity: 0.15, examples: 0.1 },
  general: { relevance: 0.3, depth: 0.25, structure: 0.15, clarity: 0.15, examples: 0.15 },
};

const CRITERIA_LABELS = {
  relevance: "Relevance",
  depth: "Depth",
  structure: "Structure",
  clarity: "Clarity",
  examples: "Examples",
};

// Common interview synonyms so "disagreed" counts for "conflict", etc.
const SYNONYMS = {
  conflict: ["disagree", "disagreement", "argument", "dispute", "clash", "tension"],
  deadline: ["due", "timeline", "schedule", "time pressure"],
  team: ["teammate", "colleague", "group", "member", "coworker"],
  mistake: ["error", "wrong", "fail", "bug"],
  failure: ["fail", "mistake", "setback"],
  leadership: ["lead", "led", "leader", "manage"],
  customer: ["client", "user"],
  manager: ["boss", "supervisor", "lead"],
  pressure: ["stress", "urgent", "tight"],
  feedback: ["criticism", "review", "comment"],
  technology: ["framework", "language", "library", "tool", "stack", "react", "angular", "node", "python", "java", "javascript", "sql", "cloud", "api"],
  quickly: ["week", "days", "fast", "quick", "short time", "deadline"],
  difficult: ["hard", "challenging", "tough", "problem"],
  project: ["assignment", "app", "application", "system", "website"],
};

// Removes near-duplicates such as "variable" / "variables" / "scoped" / "scope".
const uniqueWords = (list) => {
  const seen = [];
  return list.filter((word) => {
    const root = word.slice(0, 5);
    if (seen.some((other) => other === root)) return false;
    seen.push(root);
    return true;
  });
};

const clamp = (value, min = 0, max = 10) => Math.max(min, Math.min(max, value));
const round1 = (value) => Math.round(value * 10) / 10;

const stem = (word) => {
  if (word.length <= 4) return word;
  return word
    .replace(/ies$/, "y")
    .replace(/(?:sses|shes|ches|xes)$/, (m) => m.slice(0, -2))
    .replace(/(?<=[a-z]{3})(?:ing|ed|ly|s)$/, "");
};

export const tokenize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[^a-z0-9+#\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

const keyTerms = (text, { dropQuestionFiller = false } = {}) => {
  const terms = new Set();
  for (const word of tokenize(text)) {
    if (word.length < 3 || STOPWORDS.has(word) || /^\d+$/.test(word)) continue;
    if (dropQuestionFiller && QUESTION_FILLER.has(word)) continue;
    terms.add(stem(word));
  }
  return terms;
};

// The most frequent meaningful terms of the reference answer.
const referenceKeywords = (reference = "", questionTerms = new Set(), limit = 10) => {
  const counts = new Map();
  for (const word of tokenize(reference)) {
    if (word.length < 4 || STOPWORDS.has(word) || QUESTION_FILLER.has(word) || GENERIC_TERMS.has(word) || /^\d+$/.test(word)) continue;
    const key = stem(word);
    const entry = counts.get(key) || { count: 0, word };
    entry.count += 1;
    counts.set(key, entry);
  }
  return [...counts.entries()]
    .filter(([key]) => !questionTerms.has(key))
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([key, entry]) => ({ key, word: entry.word }));
};

export const detectFillerWords = (answer = "") => {
  const found = [];
  let count = 0;
  for (const [label, pattern] of FILLER_PATTERNS) {
    const matches = String(answer).match(pattern);
    if (matches?.length) {
      found.push({ word: label, count: matches.length });
      count += matches.length;
    }
  }
  return { count, words: found.sort((a, b) => b.count - a.count) };
};

const splitSentences = (text) =>
  String(text)
    .replace(/```[\s\S]*?```/g, " code ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 2);

const lengthScore = (words) => {
  if (words < 8) return 1;
  if (words < 20) return 3 + ((words - 8) / 12) * 2; // 3 - 5
  if (words < 45) return 5 + ((words - 20) / 25) * 2.5; // 5 - 7.5
  if (words < 90) return 7.5 + ((words - 45) / 45) * 2; // 7.5 - 9.5
  if (words <= 260) return 9.5;
  return 8.5; // very long answers tend to ramble
};

const scoreParts = (answer, parts) => {
  const present = [];
  const missing = [];
  for (const [key, part] of Object.entries(parts)) {
    if (part.pattern.test(answer)) present.push(key);
    else missing.push(part.label);
  }
  return { present, missing, ratio: present.length / Object.keys(parts).length };
};

export const analyzeAnswer = ({ question = "", answer = "", category = "general", referenceAnswer = "", expectedKeywords = [] }) => {
  const normalizedCategory = WEIGHTS[category] ? category : "general";
  const text = String(answer || "").trim();
  const lower = text.toLowerCase();
  const words = tokenize(text);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const sentences = splitSentences(text);

  // Story structure (also used to judge relevance of behavioral / situational answers)
  const starParts = normalizedCategory === "behavioral" ? scoreParts(lower, STAR_PARTS) : null;
  const situationalParts =
    normalizedCategory === "situational" ? scoreParts(lower, SITUATIONAL_PARTS) : null;
  const storyRatio = starParts?.ratio ?? situationalParts?.ratio ?? 0;

  // Relevance -------------------------------------------------------------
  const questionTerms = keyTerms(question, { dropQuestionFiller: true });
  const answerTerms = keyTerms(text);
  const answerList = [...answerTerms];
  const hasTerm = (term) =>
    answerTerms.has(term) ||
    answerList.some((w) => term.length >= 4 && w.length >= 4 && (w.startsWith(term) || term.startsWith(w))) ||
    (SYNONYMS[term] || []).some((syn) => lower.includes(syn));
  const questionHits = [...questionTerms].filter(hasTerm);
  const questionCoverage = questionTerms.size ? questionHits.length / questionTerms.size : 0.5;

  const refKeywords = referenceAnswer ? referenceKeywords(referenceAnswer, questionTerms) : [];
  const datasetKeywords = (Array.isArray(expectedKeywords) ? expectedKeywords : [])
    .map((k) => String(k).toLowerCase().trim())
    .filter(Boolean)
    .map((k) => ({ key: stem(k), word: k }));
  const conceptPool = [...refKeywords, ...datasetKeywords].filter(
    (item, index, list) => list.findIndex((other) => other.key === item.key) === index
  );
  const coveredConcepts = conceptPool.filter((c) => hasTerm(c.key) || lower.includes(c.word));
  const missingConcepts = conceptPool.filter((c) => !coveredConcepts.includes(c)).map((c) => c.word);
  const conceptCoverage = conceptPool.length ? coveredConcepts.length / conceptPool.length : null;

  // Square roots make partial coverage count: naming most ideas matters more than every word.
  let relevance =
    conceptCoverage === null
      ? clamp(3 + Math.sqrt(questionCoverage) * 7)
      : clamp(2 + (0.45 * Math.sqrt(questionCoverage) + 0.55 * Math.min(1, Math.sqrt(conceptCoverage) * 1.2)) * 8);
  if (wordCount >= 8 && questionHits.length === 0 && coveredConcepts.length === 0) {
    // Behavioral answers often tell a relevant story without repeating the question's words,
    // so only treat them as off-topic when they are not a real story either.
    relevance = storyRatio >= 0.5 ? Math.max(Math.min(relevance, 6), 3 + storyRatio * 4) : Math.min(relevance, 2);
  }

  // Depth -----------------------------------------------------------------
  const reasoningCount = (lower.match(REASONING_PATTERN) || []).length;
  const uniqueRatio = words.length ? new Set(words).size / words.length : 0;
  let depth = lengthScore(wordCount) + Math.min(reasoningCount * 0.6, 2);
  if (normalizedCategory === "technical" && CODE_PATTERN.test(text)) depth += 1;
  if (uniqueRatio < 0.35 && wordCount > 20) depth -= 2;
  depth = clamp(depth, 1);

  // Structure -------------------------------------------------------------
  let structure;
  const signposts = (lower.match(SIGNPOST_PATTERN) || []).length;

  if (normalizedCategory === "behavioral") {
    structure = clamp(1 + starParts.ratio * 8 + Math.min(signposts * 0.5, 1));
  } else if (normalizedCategory === "situational") {
    structure = clamp(1 + situationalParts.ratio * 8 + Math.min(signposts * 0.5, 1));
  } else {
    structure = 2;
    if (sentences.length >= 2) structure += 3;
    if (sentences.length >= 4) structure += 1;
    if (DEFINITION_PATTERN.test(sentences[0] || "")) structure += 2;
    structure += Math.min(signposts * 0.75, 2);
    structure = clamp(structure);
  }

  // Clarity ---------------------------------------------------------------
  const filler = detectFillerWords(text);
  const avgSentenceLength = sentences.length ? wordCount / sentences.length : wordCount;
  let clarity = 10;
  if (avgSentenceLength > 32) clarity -= 1.5;
  if (avgSentenceLength > 45) clarity -= 2;
  if (wordCount) clarity -= Math.min((filler.count / wordCount) * 100 * 0.8, 4);
  if (uniqueRatio < 0.45 && wordCount > 20) clarity -= 1.5;
  if (wordCount > 30 && !/[.!?]/.test(text)) clarity -= 1;
  if (wordCount < 15) clarity = Math.min(clarity, 5);
  clarity = clamp(clarity, 1);

  // Examples / specificity ------------------------------------------------
  const hasExample = EXAMPLE_PATTERN.test(text);
  let examples = 2;
  if (hasExample) examples += 5;
  if (METRIC_PATTERN.test(text) || NUMBER_WORD_PATTERN.test(text)) examples += 2;
  if (normalizedCategory !== "technical" && TOOL_PATTERN.test(text)) examples += 1.5;
  if (normalizedCategory === "technical" && CODE_PATTERN.test(text)) examples += 2;
  if (normalizedCategory === "behavioral" && starParts?.present.includes("result") && METRIC_PATTERN.test(text)) examples += 1;
  examples = clamp(examples);

  const criteria = { relevance, depth, structure, clarity, examples };
  const weights = WEIGHTS[normalizedCategory];
  let score = Object.entries(weights).reduce((sum, [key, weight]) => sum + criteria[key] * weight, 0);

  // An answer that misses the topic cannot be rescued by length or polish.
  const fillerRatio = wordCount ? filler.count / wordCount : 0;
  if (relevance <= 2) score = Math.min(score, 2);
  if (wordCount < 8) score = Math.min(score, 2);
  else if (wordCount < 15) score = Math.min(score, 4);
  if (fillerRatio > 0.2) score = Math.min(score, 4);

  return {
    score: round1(clamp(score, 1)),
    criteria: Object.entries(criteria).map(([key, value]) => ({
      key,
      label: CRITERIA_LABELS[key],
      score: round1(value),
    })),
    wordCount,
    fillerWords: filler,
    missingConcepts: uniqueWords(missingConcepts).slice(0, 5),
    coveredConcepts: uniqueWords(coveredConcepts.map((c) => c.word)).slice(0, 6),
    missingStarParts: starParts?.missing || [],
    missingSituationalParts: situationalParts?.missing || [],
    hasExample,
    hasSpecifics: METRIC_PATTERN.test(text) || NUMBER_WORD_PATTERN.test(text) || TOOL_PATTERN.test(text),
    offTopic: relevance <= 2 && wordCount >= 15,
    category: normalizedCategory,
  };
};

const STRENGTH_TEXT = {
  relevance: (a) =>
    a.coveredConcepts.length
      ? `You addressed the question directly and covered key ideas such as ${a.coveredConcepts.slice(0, 3).join(", ")}.`
      : "You addressed the question directly.",
  depth: () => "Good depth: you explained the reasoning, not just the answer.",
  structure: (a) =>
    a.category === "behavioral"
      ? "Clear STAR structure that walks through the situation, your actions and the result."
      : a.category === "situational"
        ? "Well-organised approach with a clear sequence of steps."
        : "Well-structured answer that is easy to follow.",
  clarity: () => "Clear, concise wording with few filler words.",
  examples: () => "Concrete examples and specifics make the answer convincing.",
};

const WEAKNESS_TEXT = {
  relevance: (a) =>
    a.offTopic
      ? "The answer does not address the question that was asked."
      : a.missingConcepts.length
        ? `Some key concepts are missing, for example: ${a.missingConcepts.slice(0, 4).join(", ")}.`
        : "The answer only partly covers what was asked.",
  depth: (a) =>
    a.wordCount < 30
      ? "The answer is too brief to show real understanding."
      : "It states what but not enough why: add reasoning or trade-offs.",
  structure: (a) =>
    a.category === "behavioral"
      ? `The STAR structure is incomplete${a.missingStarParts.length ? `: missing ${a.missingStarParts.join(", ")}` : ""}.`
      : a.category === "situational"
        ? `The approach is missing ${a.missingSituationalParts.join(", ") || "a clear sequence of steps"}.`
        : "The answer would be easier to follow with a clear definition first, then details.",
  clarity: (a) =>
    a.fillerWords.count
      ? `Filler words weaken the delivery (${a.fillerWords.words.map((f) => `"${f.word}" ×${f.count}`).join(", ")}).`
      : "Some sentences are long or repetitive, which makes the answer harder to follow.",
  examples: (a) =>
    a.category === "behavioral"
      ? a.hasSpecifics
        ? "Make the result measurable: how much time you saved, what improved or what feedback you received."
        : "Add specifics: names of tools, numbers or a measurable result."
      : a.category === "situational"
        ? "Mention a similar situation you have faced, or a concrete detail, to make the plan believable."
        : a.hasExample
          ? "The example could be more concrete, with code, numbers or a named tool."
          : "There is no concrete example to back up the explanation.",
};

const IMPROVEMENT_TEXT = {
  relevance: (a) =>
    a.missingConcepts.length
      ? `Open with a one-line direct answer, then cover ${a.missingConcepts.slice(0, 3).join(", ")}.`
      : "Open with a one-line direct answer to the exact question before adding detail.",
  depth: (a) =>
    a.category === "technical"
      ? "Explain why it works, when you would use it and one trade-off or limitation."
      : "Explain your reasoning: why you chose that action and what alternatives you considered.",
  structure: (a) =>
    a.category === "behavioral"
      ? "Use STAR: Situation (context), Task (your goal), Action (what you did), Result (outcome with a number if possible)."
      : a.category === "situational"
        ? "Answer in steps: what you would do first, who you would talk to, how you would decide, and how you would follow up."
        : "Structure it as: definition → how it works → example → when to use it.",
  clarity: () => "Pause instead of using filler words, and keep sentences short and focused.",
  examples: (a) =>
    a.category === "technical"
      ? "Add a short code snippet or a real-world use case."
      : "Add one specific example from a project, internship or class, with a result.",
};

const overallText = (score, a) => {
  if (a.wordCount < 8) return "The answer is too short to evaluate. Write at least a few complete sentences.";
  if (score >= 8.5) return "Excellent answer: relevant, well-structured and convincing. This would impress most interviewers.";
  if (score >= 7) return "Strong answer. A few refinements would make it stand out even more.";
  if (score >= 5.5) return "Decent answer that covers the basics, but it needs more depth and specifics to be competitive.";
  if (score >= 3.5) return "The answer is on the right track but misses important points. Review the feedback and try again.";
  return "This answer does not address the question well yet. Focus on answering exactly what was asked.";
};

// Rule-based evaluation used when no AI model is configured (and as extra
// context for the AI path).
export const smartEvaluate = (question, answer, category = "general", context = {}) => {
  const analysis = analyzeAnswer({
    question,
    answer,
    category: String(category || "general").toLowerCase(),
    referenceAnswer: context.referenceAnswer || "",
    expectedKeywords: context.expectedKeywords || [],
  });

  if (!String(answer || "").trim()) {
    return {
      ...analysis,
      score: 1,
      strengths: "You attempted the question.",
      weaknesses: "No answer was provided.",
      improvement: "Write a complete answer that directly addresses the question.",
      overall_feedback: "No answer to evaluate.",
    };
  }

  const ranked = [...analysis.criteria].sort((a, b) => b.score - a.score);
  const strong = analysis.offTopic ? [] : ranked.filter((c) => c.score >= 7).slice(0, 2);
  let weak = [...ranked].reverse().filter((c) => c.score < 7);
  // Always surface the most important problems first.
  const priority = (c) =>
    (analysis.offTopic && c.key === "relevance") || (analysis.fillerWords.count >= 3 && c.key === "clarity") ? 0 : 1;
  weak = weak.sort((a, b) => priority(a) - priority(b) || a.score - b.score).slice(0, 2);

  const strengths = analysis.offTopic
    ? "The answer is readable, but it is about something else."
    : analysis.wordCount < 15
      ? analysis.criteria.find((c) => c.key === "relevance").score >= 5
        ? "You are on the right topic. Now expand it into a full answer."
        : "You made a start. Now answer the question in full, with a specific example."
      : strong.length
    ? strong.map((c) => STRENGTH_TEXT[c.key](analysis)).join(" ")
    : "You made an attempt to answer; build on it with the tips below.";
  const weaknesses = weak.length
    ? weak.map((c) => WEAKNESS_TEXT[c.key](analysis)).join(" ")
    : "Only minor polish needed.";
  const improvement = weak.length
    ? IMPROVEMENT_TEXT[weak[0].key](analysis)
    : "Keep this structure and practise delivering it confidently within two minutes.";

  return {
    ...analysis,
    strengths,
    weaknesses,
    improvement,
    overall_feedback: overallText(analysis.score, analysis),
  };
};
