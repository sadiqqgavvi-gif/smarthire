import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const DEFAULT_TIMEOUT_MS = 12000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const parseTimeout = () => {
  const raw = Number(process.env.PYTHON_EVALUATOR_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TIMEOUT_MS;
  return raw;
};

const getPythonExecutable = () => process.env.PYTHON_BIN || "python";

const getEvaluatorScriptPath = () =>
  path.resolve(PROJECT_ROOT, "python", "evaluate_answer.py");

export const isPythonEvaluatorEnabled = () =>
  process.env.USE_PYTHON_EVALUATOR === "true";

export const getPythonEvaluatorInfo = () => {
  const scriptPath = getEvaluatorScriptPath();
  return {
    enabled: isPythonEvaluatorEnabled(),
    pythonBin: getPythonExecutable(),
    timeoutMs: parseTimeout(),
    scriptPath,
    scriptExists: fs.existsSync(scriptPath),
  };
};

const collectProcessOutput = (proc, payload, timeoutMs) =>
  new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let finished = false;

    const finalize = (fn) => (value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      fn(value);
    };

    const safeResolve = finalize(resolve);
    const safeReject = finalize(reject);

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
      safeReject(new Error(`Python evaluator timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    proc.on("error", (err) => {
      safeReject(err);
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        safeReject(
          new Error(
            `Python evaluator exited with code ${code}. ${stderr.trim() || "No stderr output."}`
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        safeResolve(parsed);
      } catch {
        safeReject(
          new Error(
            `Python evaluator returned invalid JSON. stdout: ${stdout.trim() || "<empty>"}`
          )
        );
      }
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });

export const evaluateWithPython = async (payload) => {
  if (!isPythonEvaluatorEnabled()) return null;

  const scriptPath = getEvaluatorScriptPath();
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python evaluator script not found at ${scriptPath}`);
  }

  const pythonBin = getPythonExecutable();
  const timeoutMs = parseTimeout();

  const proc = spawn(pythonBin, [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  return collectProcessOutput(proc, payload, timeoutMs);
};
