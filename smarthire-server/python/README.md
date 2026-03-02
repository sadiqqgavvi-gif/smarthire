# Python Evaluator

This project now supports an optional Python-based interview evaluator.

## Enable It

Set these environment variables in `smarthire-server/.env`:

```env
USE_PYTHON_EVALUATOR=true
PYTHON_BIN=python
PYTHON_EVALUATOR_TIMEOUT_MS=12000
```

Optional AI settings (already used by Node evaluator):

```env
USE_AI=true
OPENAI_API_KEY=your_real_key
OPENAI_EVALUATION_MODEL=gpt-4o-mini
```

## Behavior

- If `USE_PYTHON_EVALUATOR=true`, Node calls `python/evaluate_answer.py`.
- If Python evaluation fails, server falls back to Node evaluator logic automatically.
- If AI is disabled or key is invalid, Python evaluator uses heuristic scoring.
- Guardrails cap inflated scores for very short, gibberish, or off-topic answers.
