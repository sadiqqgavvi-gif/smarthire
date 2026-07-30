from pathlib import Path
import html
import zipfile


OUT = Path(r"e:\Code\ReactFYP\SmartHire_FYP_Interview_Guide.docx")


def esc(text):
    return html.escape(str(text), quote=True)


body = []


def p(text="", style=None, align=None, bold=False, italic=False, size=None, color=None, page_break_before=False):
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{style}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    if page_break_before:
        ppr.append('<w:pageBreakBefore/>')
    rpr = []
    if bold:
        rpr.append("<w:b/>")
    if italic:
        rpr.append("<w:i/>")
    if size:
        rpr.append(f'<w:sz w:val="{size * 2}"/>')
    if color:
        rpr.append(f'<w:color w:val="{color}"/>')
    text = esc(text).replace("\n", '</w:t><w:br/><w:t xml:space="preserve">')
    body.append(
        f'<w:p><w:pPr>{"".join(ppr)}</w:pPr><w:r><w:rPr>{"".join(rpr)}</w:rPr>'
        f'<w:t xml:space="preserve">{text}</w:t></w:r></w:p>'
    )


def heading(text, level=1):
    p(text, style=f"Heading{level}")


def bullet(text):
    body.append(
        f'<w:p><w:pPr><w:pStyle w:val="BulletList"/><w:numPr><w:ilvl w:val="0"/>'
        f'<w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
    )


def numbered(text):
    body.append(
        f'<w:p><w:pPr><w:pStyle w:val="NumberList"/><w:numPr><w:ilvl w:val="0"/>'
        f'<w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
    )


def code(text):
    p(text, style="Code")


def callout(title, text):
    body.append(
        f'<w:p><w:pPr><w:pStyle w:val="Callout"/></w:pPr>'
        f'<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">{esc(title)}: </w:t></w:r>'
        f'<w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
    )


def table(headers, rows, widths):
    grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in widths)
    body.append(
        '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="9360" w:type="dxa"/>'
        '<w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/>'
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="B8C2CC"/>'
        '<w:left w:val="single" w:sz="4" w:color="B8C2CC"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="B8C2CC"/>'
        '<w:right w:val="single" w:sz="4" w:color="B8C2CC"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="D7DEE6"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="D7DEE6"/></w:tblBorders>'
        '</w:tblPr><w:tblGrid>' + grid + '</w:tblGrid>'
    )
    for i, row in enumerate([headers] + rows):
        body.append("<w:tr>")
        for j, cell in enumerate(row):
            shade = '<w:shd w:fill="E8EEF5"/>' if i == 0 else ""
            bold = "<w:b/>" if i == 0 else ""
            body.append(
                f'<w:tc><w:tcPr><w:tcW w:w="{widths[j]}" w:type="dxa"/>{shade}'
                '<w:tcMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/>'
                '<w:start w:w="140" w:type="dxa"/><w:end w:w="140" w:type="dxa"/></w:tcMar>'
                f'</w:tcPr><w:p><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/>'
                f'</w:pPr><w:r><w:rPr>{bold}<w:sz w:val="20"/></w:rPr>'
                f'<w:t xml:space="preserve">{esc(cell)}</w:t></w:r></w:p></w:tc>'
            )
        body.append("</w:tr>")
    body.append("</w:tbl>")
    p("")


def cover():
    p("SmartHire", style="Title", align="center")
    p("FYP Interview and Viva Preparation Guide", style="Subtitle", align="center")
    p("A practical guide to explain the project, defend design choices, and answer common examiner questions.", align="center", italic=True)
    p("")
    table(
        ["Item", "Details"],
        [
            ["Project type", "Full-stack AI-powered interview preparation platform"],
            ["Frontend", "React 19, Vite, Tailwind CSS, React Router, Recharts, lucide-react"],
            ["Backend", "Node.js, Express 5, MongoDB, Mongoose"],
            ["Evaluation", "OpenAI optional, Python optional, Node smart evaluator fallback, guardrails"],
            ["Testing", "Node test runner, Vitest, Testing Library"],
            ["Deployment", "Docker Compose with frontend, backend, and MongoDB services"],
        ],
        [2300, 7060],
    )
    callout(
        "Best one-line explanation",
        "SmartHire helps students and job seekers practice technical, behavioral, and situational interview questions, receive structured answer feedback, and track improvement through dashboard analytics.",
    )


def add_content():
    cover()

    heading("1. Project Overview", 1)
    p("SmartHire is a full-stack interview preparation system. It gives users a structured way to practice interview questions, submit answers, receive feedback, save session results, and monitor performance over time.")
    p("The project is relevant for FYP interviews because it combines web engineering, database design, authentication, API design, AI integration, fallback logic, testing, and deployment.")
    heading("Core Problem", 2)
    p("Many students prepare for interviews by reading static question lists. That does not show whether their answers are relevant, structured, detailed, or improving over time. SmartHire solves this by turning preparation into an interactive feedback loop.")
    heading("Main Users", 2)
    bullet("Students and fresh graduates preparing for job interviews.")
    bullet("Job seekers who need practice for technical, behavioral, and situational questions.")
    bullet("Users who want measurable progress instead of only reading sample answers.")

    heading("2. What You Should Say In A Viva", 1)
    callout(
        "Short pitch",
        "My FYP is SmartHire, an AI-powered interview preparation assistant. It lets users choose interview categories, attempt practice or mock sessions, evaluate answers, save results, and view analytics. The system is built with React, Express, MongoDB, and an optional OpenAI/Python evaluation path with local fallback guardrails.",
    )
    heading("30-Second Explanation", 2)
    p("SmartHire is designed for students who know concepts but struggle to express them in interview form. The frontend provides a clean practice and mock interview flow. The backend manages authentication, questions, evaluations, and saved sessions. MongoDB stores users, question records, and practice history. Evaluation can use OpenAI if configured, Python as an optional evaluator, or a local smart evaluator when no API key is available.")
    heading("2-Minute Explanation", 2)
    p("The user registers or logs in, selects a category such as technical, behavioral, or situational, chooses practice or mock mode, and answers questions. The frontend sends the answer to the backend. The backend enriches the evaluation using question context such as expected keywords and sample answer guidance. If the Python evaluator is enabled, Node spawns the Python script and passes JSON through stdin. Python can call OpenAI when a valid API key is configured; otherwise it uses heuristic scoring. If Python is disabled or fails, the Node service either calls OpenAI directly or falls back to its own smart evaluator. Guardrails are applied at the end to cap scores for too-short, gibberish, or off-topic answers. Saved sessions are shown in the dashboard with category and mode-based analytics.")

    heading("3. Technology Stack", 1)
    table(
        ["Layer", "Technology", "Purpose"],
        [
            ["Frontend", "React 19 + Vite", "Fast single-page UI for practice, mock interview, auth, and dashboard screens."],
            ["Styling", "Tailwind CSS", "Responsive utility-based styling."],
            ["Routing", "React Router", "Routes for home, auth, dashboard, practice, and mock interview."],
            ["Charts", "Recharts", "Dashboard performance visualization."],
            ["Backend", "Node.js + Express 5", "REST API, middleware, auth, question retrieval, evaluation, and session persistence."],
            ["Database", "MongoDB + Mongoose", "Stores users, question bank, and saved session analytics."],
            ["Authentication", "JWT, bcryptjs, HTTP-only cookies", "Secure login, refresh, logout, and protected routes."],
            ["Evaluation", "OpenAI optional, Python optional, local smart evaluator", "Produces score, strengths, weaknesses, improvements, and overall feedback."],
            ["Testing", "Node test runner, Vitest, Testing Library", "Backend service tests and frontend flow tests."],
            ["Deployment", "Docker Compose, Nginx", "Containerized frontend, backend, and MongoDB."],
        ],
        [1600, 2500, 5260],
    )

    heading("4. Architecture", 1)
    p("SmartHire follows a three-tier architecture: presentation layer, application layer, and data layer. A separate evaluation concern is integrated into the backend service layer.")
    numbered("The React frontend renders pages, collects user input, and calls REST APIs.")
    numbered("The Express backend validates requests, handles authentication, fetches questions, evaluates answers, and saves sessions.")
    numbered("MongoDB stores persistent entities through Mongoose models.")
    numbered("The evaluation layer can use Python, OpenAI, or local fallback logic depending on configuration.")
    code("Browser -> React/Vite -> Express REST API -> Services -> MongoDB / OpenAI / Python evaluator")

    heading("5. Main Features", 1)
    bullet("User registration and login with email/password.")
    bullet("Optional Google sign-in support when configured.")
    bullet("Protected dashboard and protected practice session routes.")
    bullet("Practice sessions with configurable category, difficulty, and question count.")
    bullet("Mock interviews with sequential questions, voice input, question read-aloud, feedback read-aloud, retry, save, and dashboard actions.")
    bullet("Answer evaluation with score, strengths, weaknesses, improvement plan, and overall feedback.")
    bullet("Dashboard analytics with overall, practice-only, and mock-only views.")
    bullet("Question dataset support from MongoDB and bundled markdown/source fallback.")
    bullet("Health endpoints for live and readiness checks.")

    heading("6. Frontend Explanation", 1)
    p("The frontend is inside the SmartHire folder. It is a React/Vite application. App.jsx defines the routes. The homepage is built from components like Navbar, Hero, Features, Practice, Testimonials, Contact, and Footer.")
    table(
        ["Frontend File/Area", "Responsibility"],
        [
            ["App.jsx", "Defines main routes and protected routes."],
            ["Auth.jsx", "Handles login/signup UI and authentication calls."],
            ["ProtectedRoute.jsx", "Prevents unauthenticated access to dashboard and practice pages."],
            ["ConfigurePractice.jsx", "Lets user select practice or mock mode, difficulty, and question count."],
            ["PracticeSession.jsx", "Fetches questions, accepts text answers, evaluates answers, and saves practice results."],
            ["MockInterview.jsx", "Runs sequential mock interview flow with voice input, speech output, scoring, retry, and saving."],
            ["Dashboard.jsx", "Loads saved sessions and displays overview, mock, and practice analytics."],
            ["authFetch.js", "Sends credential-aware requests and attempts token refresh after eligible 401 responses."],
        ],
        [2500, 6860],
    )
    heading("Frontend Flow", 2)
    numbered("User selects a category from the UI.")
    numbered("ConfigurePractice builds query parameters such as mode, count, and difficulty.")
    numbered("PracticeSession or MockInterview fetches questions from the backend.")
    numbered("User submits answers.")
    numbered("Frontend displays evaluation feedback returned by the backend.")
    numbered("User saves the session, then Dashboard shows aggregated results.")

    heading("7. Backend Explanation", 1)
    p("The backend is inside smarthire-server. It is an Express app with routes, services, middleware, models, and utilities.")
    table(
        ["Backend Area", "Responsibility"],
        [
            ["app.js", "Configures Express, CORS, Helmet, JSON limit, logging, rate limits, health routes, and API routes."],
            ["server.js", "Connects to MongoDB, starts the server, and handles graceful shutdown."],
            ["routes/authRoutes.js", "Real auth implementation for register, login, Google login, me, refresh, and logout."],
            ["routes/questionRoutes.js", "Question fetch endpoints."],
            ["routes/practiceRoutes.js", "Practice question retrieval and saved session APIs."],
            ["routes/mockRoutes.js", "Mock interview question and evaluation endpoints."],
            ["routes/aiRoutes.js", "Practice answer evaluation and Python evaluator health endpoint."],
            ["services/aiEvaluationService.js", "Main evaluation decision logic."],
            ["services/evaluationGuardrails.js", "Caps invalid high scores for short, off-topic, or gibberish answers."],
            ["services/pythonEvaluationService.js", "Spawns the Python evaluator when enabled."],
        ],
        [2500, 6860],
    )

    heading("8. Database Design", 1)
    p("The project uses MongoDB with Mongoose schemas. The most important collections are User, Question, and PracticeSession.")
    table(
        ["Model", "Important Fields", "Purpose"],
        [
            ["User", "email, name, password, authProvider, googleId, avatarUrl, role, permissions, refreshTokenHash", "Stores account identity, authentication provider, roles, permissions, and refresh token hash."],
            ["Question", "question, category, role, difficulty, expected_keywords, sample_answer", "Stores interview questions and evaluation context."],
            ["PracticeSession", "user, mode, category, difficulty, questionCount, attemptedCount, averageScore", "Stores saved practice/mock performance for dashboard analytics."],
            ["Message", "Present in models", "Available for contact/message-style data if used by related routes."],
        ],
        [1700, 3900, 3760],
    )
    callout("Why MongoDB", "The data is document-oriented and flexible: questions may have different metadata, sessions are naturally stored as documents, and Mongoose gives schema validation while keeping development fast.")

    heading("9. Evaluation System", 1)
    p("This is the most important part to explain clearly because interviewers may ask whether Python or OpenAI evaluates the answers.")
    code(
        "Node backend\n"
        "  -> if USE_PYTHON_EVALUATOR=true: run Python evaluator\n"
        "       -> if USE_AI=true and OPENAI_API_KEY is valid: Python calls OpenAI\n"
        "       -> else: Python uses heuristic scoring\n"
        "  -> if Python disabled or fails: Node evaluator path\n"
        "       -> if USE_AI=true and OPENAI_API_KEY is valid: Node calls OpenAI\n"
        "       -> else: Node smart evaluator fallback\n"
        "  -> apply guardrails before returning final feedback"
    )
    heading("What To Say About Python And OpenAI", 2)
    callout(
        "Recommended answer",
        "For now, I have not purchased or configured an OpenAI API key, so the system can use the optional Python evaluator with heuristic/rule-based scoring. The architecture is ready for OpenAI: when a valid key is configured, either Python or Node can call OpenAI and return AI-generated JSON feedback. If OpenAI is unavailable, the system still works through local fallback evaluation.",
    )
    heading("Evaluation Output", 2)
    bullet("score: integer from 1 to 10.")
    bullet("strengths: what the answer did well.")
    bullet("weaknesses: what is missing or weak.")
    bullet("improvement: specific advice for the next answer.")
    bullet("overall_feedback or feedback: short final judgment.")
    heading("Guardrails", 2)
    p("Guardrails are applied after the raw evaluator result. They prevent the system from giving high marks to bad answers. For example, if an answer is too short, off-topic, or gibberish, the score is capped even if an evaluator returns a high score.")
    table(
        ["Risk", "Detection", "Result"],
        [
            ["Too short", "Answer word count is less than 4.", "Score capped at 2."],
            ["Gibberish", "Short off-topic answer with many consonant-heavy words.", "Score capped at 2."],
            ["Off-topic", "No question term hits and no expected keyword hits.", "Short off-topic answers capped at 3."],
            ["Relevant", "Question terms or expected keywords match.", "Original score is preserved."],
        ],
        [1700, 4100, 3560],
    )

    heading("10. Authentication And Security", 1)
    bullet("Passwords are hashed using bcryptjs.")
    bullet("JWT access and refresh tokens are issued after login/register.")
    bullet("Tokens are stored in HTTP-only cookies, reducing exposure to client-side JavaScript.")
    bullet("Refresh tokens are hashed in the database, so the raw refresh token is not stored.")
    bullet("Protected routes use authMiddleware to verify JWTs.")
    bullet("CORS is restricted to configured client origins.")
    bullet("Helmet adds security-related HTTP headers.")
    bullet("Rate limiters protect general API, auth routes, AI routes, and mock evaluation routes.")
    bullet("Validation middleware rejects malformed auth, evaluation, and session payloads.")

    heading("11. Question Bank And Session Flow", 1)
    p("Questions are stored in MongoDB but the system also has bundled question support. The question retrieval logic removes duplicates, samples randomly, supports category/difficulty filters, and tops up from bundled questions when a database bucket has too few records.")
    table(
        ["Mode", "How It Works"],
        [
            ["Practice", "User selects category, difficulty, and count. Multiple questions are shown. Each answer can be evaluated and the session can be saved."],
            ["Mock interview", "User answers one question at a time. The system tracks scores, supports speech input/output, and shows final actions after the last question."],
            ["Dashboard", "Saved sessions are loaded for the logged-in user and summarized by category and mode."],
        ],
        [2200, 7160],
    )

    heading("12. Testing", 1)
    p("The project has both backend and frontend tests. Backend tests use Node's built-in test runner. Frontend tests use Vitest and Testing Library.")
    table(
        ["Test Area", "Examples"],
        [
            ["Backend guardrails", "Tests score caps for too-short, off-topic, gibberish, and relevant answers."],
            ["API validation", "Tests invalid payload behavior."],
            ["Auth session", "Tests authentication/session behavior."],
            ["Question extraction", "Tests parsing and extraction utilities."],
            ["Frontend auth flow", "Tests login/signup behavior."],
            ["Protected route", "Tests access control around protected pages."],
            ["Practice/mock flow", "Tests user-facing interview flows."],
            ["Dashboard", "Tests analytics display behavior."],
        ],
        [2500, 6860],
    )
    code("Backend tests: cd smarthire-server && npm test\nFrontend tests: cd SmartHire && npm test")

    heading("13. Deployment", 1)
    p("The project includes Docker support. docker-compose.yml starts MongoDB, the backend, and the frontend. The frontend is served through Nginx inside the container. The backend runs as a non-root user and depends on MongoDB health. Health endpoints are available for liveness and readiness checks.")
    table(
        ["Service", "Port", "Purpose"],
        [
            ["mongodb", "27017", "Database persistence."],
            ["backend", "5000", "Express REST API and evaluation service."],
            ["frontend", "5173 host -> 8080 container", "React build served by Nginx."],
        ],
        [2200, 1800, 5360],
    )
    code("docker compose up --build")

    heading("14. APIs To Remember", 1)
    table(
        ["Endpoint", "Purpose"],
        [
            ["GET /health/live", "Checks whether the backend process is alive."],
            ["GET /health/ready", "Checks whether MongoDB is ready."],
            ["POST /api/auth/register", "Creates user and session."],
            ["POST /api/auth/login", "Logs in user and creates session cookies."],
            ["POST /api/auth/refresh", "Rotates access/refresh session."],
            ["POST /api/auth/logout", "Clears cookies and invalidates refresh hash."],
            ["GET /api/questions", "Fetches question list by category/difficulty/count."],
            ["POST /api/ai/evaluate", "Evaluates practice answer."],
            ["GET /api/ai/python-health", "Checks optional Python evaluator status."],
            ["GET /api/practice/:type", "Fetches practice questions by category."],
            ["POST /api/practice/sessions", "Saves practice or mock session."],
            ["GET /api/practice/sessions/me", "Loads dashboard sessions for current user."],
            ["POST /api/mock/evaluate", "Evaluates mock interview answer."],
        ],
        [3100, 6260],
    )

    heading("15. Strengths Of The Project", 1)
    bullet("It solves a real student problem: interview readiness and self-assessment.")
    bullet("It has a working full-stack architecture rather than only a UI prototype.")
    bullet("It supports both practice and mock interview workflows.")
    bullet("It stores progress and provides analytics, making improvement measurable.")
    bullet("It has fallback evaluation, so the app is not completely dependent on paid AI keys.")
    bullet("It includes security basics: hashed passwords, JWT cookies, validation, CORS, Helmet, and rate limiting.")
    bullet("It has tests for critical logic and user flows.")
    bullet("It is containerized for easier deployment.")

    heading("16. Limitations To Admit Honestly", 1)
    bullet("Without a configured OpenAI API key, evaluation is heuristic and cannot fully understand human language like a real LLM.")
    bullet("Voice input depends on browser SpeechRecognition support.")
    bullet("Scores are guidance, not a final hiring judgment.")
    bullet("The current system focuses on text/voice answers, not video analysis or facial/body-language feedback.")
    bullet("Question quality depends on the dataset and expected keyword coverage.")
    bullet("The dashboard stores session-level summaries, not a full historical answer-by-answer transcript.")

    heading("17. Future Work", 1)
    bullet("Add resume-based question generation.")
    bullet("Add role-specific interview tracks such as frontend, backend, QA, and data analyst.")
    bullet("Add admin panel for managing question bank content.")
    bullet("Add detailed downloadable reports for each session.")
    bullet("Improve scoring calibration with rubrics and more evaluation samples.")
    bullet("Add video interview analysis only if privacy and ethical requirements are handled properly.")

    heading("18. Common Interview Questions And Answers", 1)
    qa = [
        ("What is your FYP about?", "SmartHire is an AI-powered interview preparation assistant. It allows users to practice technical, behavioral, and situational questions, receive structured feedback, save sessions, and track improvement through dashboard analytics."),
        ("Why did you choose this project?", "Interview preparation is a real problem for students. Many students know concepts but cannot express them clearly in interviews. This project provides repeated practice, objective feedback, and measurable progress."),
        ("What is the architecture?", "It is a three-tier full-stack architecture: React frontend, Express backend, and MongoDB database. The backend also integrates an evaluation service that can use OpenAI, Python, or local fallback scoring."),
        ("Does Python evaluate the answer or OpenAI?", "Both are possible depending on configuration. Python is optional. If Python is enabled and OpenAI key is valid, Python can call OpenAI. Without the key, Python uses heuristic scoring. If Python is disabled or fails, Node can call OpenAI directly or use its own smart evaluator fallback."),
        ("Why did you add fallback evaluation?", "Because relying only on paid or external AI makes the system fragile. Fallback evaluation keeps the system usable during development, demos, network failures, or missing API keys."),
        ("How do guardrails work?", "After evaluation, guardrails inspect the answer for risks such as too-short text, off-topic content, and gibberish. If risk is detected, the score is capped and feedback is adjusted."),
        ("What database models did you create?", "The main models are User, Question, and PracticeSession. User stores account/session identity, Question stores interview question data and expected context, and PracticeSession stores saved performance summaries."),
        ("How is authentication implemented?", "The backend uses bcryptjs for password hashing, JWT access and refresh tokens, HTTP-only cookies, refresh token hashing in the database, and middleware to protect private routes."),
        ("How does the dashboard work?", "When a user saves practice or mock sessions, the backend stores session summaries. The dashboard fetches the logged-in user's sessions and calculates overall, practice-only, and mock-only averages by category."),
        ("What tests did you write?", "Backend tests cover guardrails, API validation, auth session behavior, and question extraction. Frontend tests cover auth flow, protected route behavior, practice session flow, mock interview flow, and dashboard rendering."),
        ("What is the hardest part?", "The hardest part is evaluation reliability. A simple evaluator can over-score irrelevant answers, while external AI may fail or require paid keys. I handled this by combining context, fallback scoring, and guardrails."),
        ("How would you improve it?", "I would add resume-based question generation, admin question management, more calibrated scoring rubrics, downloadable reports, and role-specific interview tracks."),
    ]
    for q, a in qa:
        p(q, style="Heading3")
        p(a)

    heading("19. Mistakes To Avoid In Front Of Examiners", 1)
    bullet("Do not say Python is always the AI evaluator. Say it is optional and can call OpenAI or use heuristic fallback.")
    bullet("Do not claim OpenAI is active if no API key is configured.")
    bullet("Do not say authController.js is the main auth file; the real current auth logic is in routes/authRoutes.js.")
    bullet("Do not overclaim accuracy. Say the scoring is a preparation aid, not a hiring decision engine.")
    bullet("Do not ignore limitations. Honest limitations make your defense stronger.")
    bullet("Do not describe the dashboard as real-time analytics; it is based on saved session summaries.")

    heading("20. Final Revision Sheet", 1)
    bullet("Project name: SmartHire.")
    bullet("Problem: students need structured interview practice and measurable feedback.")
    bullet("Frontend: React, Vite, Tailwind, Router, Recharts.")
    bullet("Backend: Node.js, Express, MongoDB, Mongoose.")
    bullet("Auth: bcrypt, JWT access/refresh cookies, protected routes.")
    bullet("Evaluation: OpenAI optional, Python optional, Node fallback, guardrails final.")
    bullet("Database: User, Question, PracticeSession.")
    bullet("Testing: backend Node tests, frontend Vitest/Testing Library.")
    bullet("Deployment: Docker Compose with MongoDB, backend, frontend/Nginx.")
    bullet("Best honest AI statement: OpenAI is supported but not currently required; without a key, local heuristic evaluation is used.")


styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="111827"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="52"/><w:color w:val="0B2545"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="240"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="28"/><w:color w:val="475569"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="320" w:after="160"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="26"/><w:color w:val="2E74B5"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/>
    <w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="24"/><w:color w:val="1F4D78"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="BulletList">
    <w:name w:val="Bullet List"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="80" w:line="280" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="NumberList">
    <w:name w:val="Number List"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="80" w:line="280" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Code">
    <w:name w:val="Code"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="80" w:after="120" w:line="260" w:lineRule="auto"/><w:shd w:fill="F2F4F7"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="19"/><w:color w:val="111827"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Callout">
    <w:name w:val="Callout"/><w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:before="120" w:after="160" w:line="280" w:lineRule="auto"/><w:shd w:fill="F4F6F9"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="0B2545"/></w:rPr>
  </w:style>
  <w:style w:type="table" w:styleId="TableGrid">
    <w:name w:val="Table Grid"/>
    <w:tblPr><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:start w:w="120" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr>
  </w:style>
</w:styles>
"""


numbering_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="-"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:abstractNum w:abstractNumId="2">
    <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl>
  </w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>
"""


def build():
    add_content()
    sect = (
        '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>'
        '</w:sectPr>'
    )
    document_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f'<w:body>{"".join(body)}{sect}</w:body></w:document>'
    )
    content_types = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
        '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>'
        '</Types>'
    )
    rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        '</Relationships>'
    )
    doc_rels = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'
        '</Relationships>'
    )
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as docx:
        docx.writestr("[Content_Types].xml", content_types)
        docx.writestr("_rels/.rels", rels)
        docx.writestr("word/document.xml", document_xml)
        docx.writestr("word/styles.xml", styles_xml)
        docx.writestr("word/numbering.xml", numbering_xml)
        docx.writestr("word/_rels/document.xml.rels", doc_rels)
    print(OUT)
    print(OUT.stat().st_size)


if __name__ == "__main__":
    build()
