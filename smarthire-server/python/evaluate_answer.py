#!/usr/bin/env python3
import json
import re
import sys
import urllib.error
import urllib.request


INVALID_API_KEYS = {"", "your_key_here", "YOUR_KEY_HERE"}


def safe_text(value, fallback=""):
    if not isinstance(value, str):
        return fallback
    value = value.strip()
    return value if value else fallback


def clamp_score(value, minimum=1, maximum=10):
    try:
        score = int(round(float(value)))
    except Exception:
        return None
    return max(minimum, min(maximum, score))


def normalize_response(raw):
    score = clamp_score(raw.get("score"))
    return {
        "score": score if score is not None else 5,
        "strengths": safe_text(
            raw.get("strengths"), "Answer attempts to address the prompt."
        ),
        "weaknesses": safe_text(
            raw.get("weaknesses"), "Add more specifics linked to the question."
        ),
        "improvement": safe_text(
            raw.get("improvement") or raw.get("improvements"),
            "Use clear structure and include one concrete example.",
        ),
        "overall_feedback": safe_text(
            raw.get("overall_feedback") or raw.get("overallFeedback") or raw.get("feedback"),
            "Decent attempt. Improve relevance and depth for a stronger answer.",
        ),
    }


def tokenize(text):
    return [w for w in re.split(r"[^a-zA-Z0-9]+", text.lower()) if len(w) > 3]


def is_consonant_heavy(word):
    return len(word) >= 4 and re.match(r"^[a-z]+$", word) and not re.search(r"[aeiou]", word)


def heuristic_eval(question, answer, expected_keywords):
    answer_lower = answer.lower()
    answer_words = [w for w in re.split(r"\s+", answer.strip()) if w]
    word_count = len(answer_words)

    words = tokenize(answer)
    question_terms = [w for w in tokenize(question) if len(w) > 4][:20]
    question_hits = sum(1 for term in question_terms if term in answer_lower)

    keyword_hits = 0
    if isinstance(expected_keywords, list):
        for kw in expected_keywords:
            kw_text = safe_text(kw).lower()
            if kw_text and kw_text in answer_lower:
                keyword_hits += 1

    structure_hits = 0
    for marker in ["first", "second", "third", "finally", "because", "therefore"]:
        if marker in answer_lower:
            structure_hits += 1

    consonant_heavy_words = sum(1 for word in words if is_consonant_heavy(word))
    heavy_ratio = (consonant_heavy_words / len(words)) if words else 0

    base = 1
    depth_points = min(3, word_count // 40)
    relevance_points = min(3, question_hits) + min(3, keyword_hits)
    structure_points = 1 if structure_hits >= 2 else 0

    score = clamp_score(base + depth_points + relevance_points + structure_points)
    score = score if score is not None else 5

    off_topic = question_hits == 0 and keyword_hits == 0

    if word_count < 4:
        score = min(score, 2)
    if off_topic:
        score = min(score, 3)
    if off_topic and word_count <= 30 and heavy_ratio >= 0.55:
        score = min(score, 2)

    strengths = []
    weaknesses = []

    if keyword_hits > 0:
        strengths.append("Covered expected ideas from the question context.")
    elif question_hits > 0:
        strengths.append("Answer is partially aligned with the prompt.")
    else:
        weaknesses.append("Answer misses important parts of the exact question.")

    if word_count >= 60:
        strengths.append("Provides reasonable detail.")
    else:
        weaknesses.append("Needs more depth and concrete detail.")

    if structure_hits >= 2:
        strengths.append("Shows basic answer structure.")
    else:
        weaknesses.append("Organize answer with clearer flow.")

    if off_topic:
        weaknesses.append("Response is not directly relevant to the asked question.")

    if not strengths:
        strengths = ["The answer attempts the question."]
    if not weaknesses:
        weaknesses = ["Could improve precision and examples."]

    overall = (
        "Strong answer for this question."
        if score >= 8
        else "Good start, but more precision and depth are needed."
        if score >= 6
        else "Needs clearer relevance and stronger supporting detail."
    )

    return {
        "score": score,
        "strengths": " ".join(strengths),
        "weaknesses": " ".join(weaknesses),
        "improvement": "Use a direct structure: key point, evidence/example, outcome.",
        "overall_feedback": overall,
        "source": "python-heuristic",
    }


def build_prompt(mode, category, question, answer, expected_keywords, sample_answer):
    expected_line = ", ".join(expected_keywords[:12]) if expected_keywords else "Not provided"
    sample_line = sample_answer or "Not provided"

    return f"""You are a strict interview evaluator.

Mode: {mode}
Category: {category}

Question:
"{question}"

Candidate answer:
"{answer}"

Question-specific context from dataset (if available):
- Expected keywords: {expected_line}
- Sample answer guidance: {sample_line}

Evaluate only against the exact asked question and context.
Hard constraints:
- If the answer is nonsensical, unreadable, or mostly off-topic, score must be between 1 and 3.
- Do not reward length if relevance is weak.

Return strict JSON only:
{{
  "score": number (1-10 integer),
  "strengths": "short paragraph",
  "weaknesses": "short paragraph",
  "improvement": "specific action plan for next answer",
  "overall_feedback": "concise overall judgment"
}}"""


def call_openai(api_key, model, prompt):
    body = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You evaluate interview answers fairly and return only valid JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
    }

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    content = raw.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
    if not content:
        raise ValueError("OpenAI returned empty content.")

    return json.loads(content)


def main():
    try:
        payload = json.loads(sys.stdin.read() or "{}")
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        return 1

    question = safe_text(payload.get("question"))
    answer = safe_text(payload.get("answer"))
    category = safe_text(payload.get("category"), "general").lower()
    mode = safe_text(payload.get("mode"), "practice").lower()
    expected_keywords = payload.get("expectedKeywords") or []
    sample_answer = safe_text(payload.get("sampleAnswer"))
    use_ai = payload.get("useAi") is True
    api_key = safe_text(payload.get("openaiApiKey"))
    model = safe_text(payload.get("model"), "gpt-4o-mini")

    if not answer:
        result = {
            "score": 1,
            "strengths": "Attempted the question.",
            "weaknesses": "No meaningful answer provided.",
            "improvement": "Provide a complete and specific answer.",
            "overall_feedback": "Answer is incomplete.",
            "source": "python-heuristic",
        }
        print(json.dumps(result))
        return 0

    if use_ai and api_key not in INVALID_API_KEYS:
        prompt = build_prompt(
            mode=mode,
            category=category,
            question=question,
            answer=answer,
            expected_keywords=expected_keywords if isinstance(expected_keywords, list) else [],
            sample_answer=sample_answer,
        )

        try:
            ai_raw = call_openai(api_key=api_key, model=model, prompt=prompt)
            result = normalize_response(ai_raw)
            result["source"] = "python-openai"
            result["model"] = model
            print(json.dumps(result))
            return 0
        except (urllib.error.URLError, urllib.error.HTTPError, ValueError, json.JSONDecodeError):
            pass

    result = heuristic_eval(
        question=question,
        answer=answer,
        expected_keywords=expected_keywords if isinstance(expected_keywords, list) else [],
    )
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
