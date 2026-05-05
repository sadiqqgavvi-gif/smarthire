from pathlib import Path
import zipfile, html, math
from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"e:\Code\ReactFYP\SmartHire_FYP_Report_Revised.docx")
MEDIA_DIR = Path(r"e:\Code\ReactFYP\fyp_report_media")
MEDIA_DIR.mkdir(exist_ok=True)

def font(size=22, bold=False):
    for path in [
        r"C:\Windows\Fonts\timesbd.ttf" if bold else r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

F_TITLE = font(28, True)
F_HEAD = font(21, True)
F_TEXT = font(18)
F_SMALL = font(15)
BLACK = "#0f172a"
SLATE = "#475569"
BORDER = "#334155"
FILL = "#f8fafc"
BLUE = "#dbeafe"
GREEN = "#dcfce7"
PURPLE = "#ede9fe"
AMBER = "#fef3c7"
RED = "#fee2e2"

def wrap(draw, text, fnt, width):
    words = str(text).split()
    lines, cur = [], ""
    for word in words:
        test = (cur + " " + word).strip()
        if draw.textbbox((0, 0), test, font=fnt)[2] <= width or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines

def draw_box(draw, xy, title, lines=None, fill=FILL):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=18, fill=fill, outline=BORDER, width=2)
    draw.text((x1 + 16, y1 + 14), title, font=F_HEAD, fill=BLACK)
    yy = y1 + 48
    for line in lines or []:
        for wrapped in wrap(draw, line, F_SMALL, x2 - x1 - 32):
            draw.text((x1 + 16, yy), wrapped, font=F_SMALL, fill=SLATE)
            yy += 20

def arrow(draw, start, end, text=None):
    draw.line([start, end], fill=BORDER, width=3)
    ang = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 14
    points = [
        end,
        (end[0] - length * math.cos(ang - math.pi / 6), end[1] - length * math.sin(ang - math.pi / 6)),
        (end[0] - length * math.cos(ang + math.pi / 6), end[1] - length * math.sin(ang + math.pi / 6)),
    ]
    draw.polygon(points, fill=BORDER)
    if text:
        mx, my = (start[0] + end[0]) // 2, (start[1] + end[1]) // 2
        draw.rectangle((mx - 90, my - 16, mx + 90, my + 16), fill="white")
        tw = draw.textbbox((0, 0), text, font=F_SMALL)[2]
        draw.text((mx - tw / 2, my - 10), text, font=F_SMALL, fill=SLATE)

def save_diagram(name, title, boxes, arrows):
    img = Image.new("RGB", (1400, 850), "white")
    draw = ImageDraw.Draw(img)
    draw.text((50, 30), title, font=F_TITLE, fill=BLACK)
    for box in boxes:
        draw_box(draw, box["xy"], box["title"], box.get("lines"), box.get("fill", FILL))
    for arr in arrows:
        arrow(draw, arr[0], arr[1], arr[2] if len(arr) > 2 else None)
    path = MEDIA_DIR / f"{name}.png"
    img.save(path, "PNG")
    return path

diagrams = {}
diagrams["architecture"] = save_diagram("architecture", "SmartHire Three-Tier Architecture", [
    {"xy": (70, 150, 390, 340), "title": "Presentation Layer", "fill": BLUE, "lines": ["React + Vite web app", "Authentication screens", "Practice, mock interview, dashboard UI"]},
    {"xy": (540, 150, 860, 340), "title": "Application Layer", "fill": GREEN, "lines": ["Node.js / Express REST API", "JWT cookies, validation, rate limiting", "Question, evaluation, session routes"]},
    {"xy": (1010, 120, 1330, 270), "title": "Data Layer", "fill": AMBER, "lines": ["MongoDB via Mongoose", "Users, Questions, PracticeSessions"]},
    {"xy": (1010, 360, 1330, 520), "title": "AI Evaluation Layer", "fill": PURPLE, "lines": ["OpenAI when enabled", "Python evaluator option", "Smart fallback evaluator + guardrails"]},
    {"xy": (540, 500, 860, 690), "title": "Security & Operations", "fill": RED, "lines": ["Helmet, CORS, rate limits", "Health checks", "Structured API responses"]},
], [((390, 245), (540, 245), "HTTPS REST"), ((860, 210), (1010, 195), "Mongoose"), ((860, 280), (1010, 430), "Evaluate"), ((700, 340), (700, 500), "Middleware"), ((540, 300), (390, 300), "JSON response")])

diagrams["use_case"] = save_diagram("use_case", "SmartHire Use Case Diagram", [
    {"xy": (60, 250, 260, 430), "title": "Candidate", "fill": BLUE, "lines": ["Student / job seeker"]},
    {"xy": (1110, 250, 1340, 430), "title": "AI Evaluator", "fill": PURPLE, "lines": ["OpenAI / Smart evaluator"]},
    {"xy": (450, 90, 760, 170), "title": "Register / Login"},
    {"xy": (450, 200, 760, 280), "title": "Configure Practice"},
    {"xy": (450, 310, 760, 390), "title": "Answer Questions"},
    {"xy": (450, 420, 760, 500), "title": "Run Mock Interview"},
    {"xy": (450, 530, 760, 610), "title": "Save Session"},
    {"xy": (450, 640, 760, 720), "title": "View Dashboard"},
    {"xy": (840, 310, 1060, 430), "title": "Evaluate Answer", "fill": GREEN, "lines": ["Score, strengths, weaknesses, improvement"]},
], [((260, 310), (450, 130), ""), ((260, 330), (450, 240), ""), ((260, 350), (450, 350), ""), ((260, 370), (450, 460), ""), ((260, 390), (450, 570), ""), ((260, 410), (450, 680), ""), ((760, 350), (840, 370), "submit answer"), ((1060, 370), (1110, 340), ""), ((840, 390), (760, 570), "result saved")])

diagrams["erd"] = save_diagram("erd", "SmartHire Data Model", [
    {"xy": (100, 120, 430, 360), "title": "User", "fill": BLUE, "lines": ["_id", "email, name", "password hash or Google ID", "role, permissions", "refreshTokenHash"]},
    {"xy": (535, 120, 865, 360), "title": "PracticeSession", "fill": GREEN, "lines": ["_id", "user -> User", "mode: practice/mock", "category, difficulty", "questionCount, attemptedCount", "averageScore"]},
    {"xy": (970, 120, 1300, 360), "title": "Question", "fill": AMBER, "lines": ["_id", "question text", "category: technical/behavioral/situational", "difficulty", "expected_keywords", "sample_answer"]},
    {"xy": (535, 500, 865, 680), "title": "Evaluation Result", "fill": PURPLE, "lines": ["Generated at runtime", "score", "strengths, weaknesses", "improvement", "overall_feedback"]},
], [((430, 240), (535, 240), "1 to many"), ((865, 240), (970, 240), "uses"), ((700, 360), (700, 500), "produces")])

diagrams["sequence"] = save_diagram("sequence", "Mock Interview Evaluation Sequence", [
    {"xy": (60, 110, 250, 190), "title": "Candidate", "fill": BLUE},
    {"xy": (340, 110, 530, 190), "title": "React UI", "fill": BLUE},
    {"xy": (620, 110, 810, 190), "title": "Express API", "fill": GREEN},
    {"xy": (900, 110, 1090, 190), "title": "Evaluator", "fill": PURPLE},
    {"xy": (1180, 110, 1370, 190), "title": "MongoDB", "fill": AMBER},
], [((250, 260), (340, 260), "answer"), ((530, 320), (620, 320), "POST /api/mock/evaluate"), ((810, 380), (900, 380), "evaluate"), ((900, 440), (810, 440), "feedback JSON"), ((620, 500), (530, 500), "score + feedback"), ((340, 560), (250, 560), "display feedback"), ((530, 630), (620, 630), "POST session"), ((810, 690), (1180, 690), "save")])

diagrams["activity"] = save_diagram("activity", "Practice and Mock Session Activity Flow", [
    {"xy": (90, 90, 360, 170), "title": "Start", "fill": BLUE},
    {"xy": (90, 230, 360, 330), "title": "Select Category", "lines": ["Technical, Behavioral, Situational"]},
    {"xy": (90, 390, 360, 510), "title": "Configure Session", "lines": ["Practice: 5, 10, 15, 20 questions", "Mock: 10 questions"]},
    {"xy": (520, 230, 840, 330), "title": "Answer Question", "fill": GREEN, "lines": ["Text or voice transcript"]},
    {"xy": (520, 390, 840, 510), "title": "Evaluate Answer", "fill": PURPLE, "lines": ["AI/fallback rubric evaluation"]},
    {"xy": (990, 230, 1300, 330), "title": "More Questions?", "fill": AMBER, "lines": ["Continue until final question"]},
    {"xy": (990, 390, 1300, 510), "title": "Save or Retry", "fill": BLUE, "lines": ["Save to dashboard", "Retry mock interview", "Review summary"]},
    {"xy": (990, 600, 1300, 700), "title": "Dashboard", "fill": GREEN, "lines": ["Overall, mock, and practice analytics"]},
], [((225, 170), (225, 230), ""), ((225, 330), (225, 390), ""), ((360, 450), (520, 280), "begin"), ((680, 330), (680, 390), ""), ((840, 450), (990, 280), "next"), ((1145, 330), (1145, 390), "final"), ((1145, 510), (1145, 600), "saved")])

diagrams["component"] = save_diagram("component", "SmartHire Component Diagram", [
    {"xy": (70, 120, 390, 300), "title": "Frontend Components", "fill": BLUE, "lines": ["Auth", "ConfigurePractice", "PracticeSession", "MockInterview", "Dashboard"]},
    {"xy": (530, 100, 870, 300), "title": "API Routes", "fill": GREEN, "lines": ["/api/auth", "/api/questions", "/api/practice", "/api/mock", "/api/ai"]},
    {"xy": (1010, 100, 1320, 280), "title": "Services", "fill": PURPLE, "lines": ["aiEvaluationService", "smartEvaluator", "pythonEvaluationService", "guardrails"]},
    {"xy": (530, 430, 870, 620), "title": "Middleware", "fill": RED, "lines": ["authMiddleware", "validationMiddleware", "rateLimitMiddleware", "observability"]},
    {"xy": (1010, 430, 1320, 620), "title": "Models", "fill": AMBER, "lines": ["User", "Question", "PracticeSession", "Message"]},
], [((390, 210), (530, 200), "REST"), ((870, 190), (1010, 190), "calls"), ((700, 300), (700, 430), "uses"), ((870, 520), (1010, 520), "persists")])

diagrams["deployment"] = save_diagram("deployment", "SmartHire Deployment Diagram", [
    {"xy": (80, 170, 380, 330), "title": "User Browser", "fill": BLUE, "lines": ["Chrome / Edge / Firefox", "React static assets", "SpeechRecognition API"]},
    {"xy": (540, 140, 860, 360), "title": "Frontend Host", "fill": BLUE, "lines": ["Vite build / Nginx container", "HTML, CSS, JS bundle"]},
    {"xy": (1010, 140, 1330, 360), "title": "Backend Server", "fill": GREEN, "lines": ["Node.js Express", "REST APIs", "JWT cookies", "Rate limiting"]},
    {"xy": (1010, 500, 1330, 680), "title": "MongoDB", "fill": AMBER, "lines": ["Persistent collections", "Users, Questions, Sessions"]},
    {"xy": (540, 500, 860, 680), "title": "External Services", "fill": PURPLE, "lines": ["OpenAI API optional", "Google Identity Services optional"]},
], [((380, 250), (540, 250), "HTTPS"), ((860, 250), (1010, 250), "API"), ((1170, 360), (1170, 500), "Mongoose"), ((1010, 570), (860, 570), "AI/OAuth")])

rels = []
body = []

def esc(text):
    return html.escape(str(text), quote=True)

def p(text="", align=None, bold=False, italic=False, size=24, break_page=False):
    jc = f'<w:jc w:val="{align}"/>' if align else ""
    br = '<w:r><w:br w:type="page"/></w:r>' if break_page else ""
    rpr = f'<w:rPr>{"<w:b/>" if bold else ""}{"<w:i/>" if italic else ""}<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="{size}"/></w:rPr>'
    text = esc(text).replace("\n", '</w:t><w:br/><w:t xml:space="preserve">')
    body.append(f'<w:p><w:pPr>{jc}<w:spacing w:before="120" w:after="120" w:line="360" w:lineRule="auto"/></w:pPr>{br}<w:r>{rpr}<w:t xml:space="preserve">{text}</w:t></w:r></w:p>')

def heading(text, level=1):
    if level == 0:
        p(text.upper(), align="center", bold=True, size=32, break_page=True)
    elif level == 1:
        p(text, bold=True, size=28)
    elif level == 2:
        p(text, bold=True, italic=True, size=24)
    else:
        p(text, italic=True, size=24)

def bullets(items):
    for item in items:
        p("- " + item)

def table(rows):
    body.append('<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="8"/><w:left w:val="single" w:sz="8"/><w:bottom w:val="single" w:sz="8"/><w:right w:val="single" w:sz="8"/><w:insideH w:val="single" w:sz="8"/><w:insideV w:val="single" w:sz="8"/></w:tblBorders></w:tblPr>')
    for ri, row in enumerate(rows):
        body.append("<w:tr>")
        for cell in row:
            shade = '<w:shd w:fill="D9EAF7"/>' if ri == 0 else ""
            bold = "<w:b/>" if ri == 0 else ""
            body.append(f'<w:tc><w:tcPr>{shade}</w:tcPr><w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr>{bold}<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">{esc(cell)}</w:t></w:r></w:p></w:tc>')
        body.append("</w:tr>")
    body.append("</w:tbl>")

def image(path, caption):
    rid = f"rId{len(rels)+1}"
    rels.append((rid, f"media/{Path(path).name}"))
    cx = 5943600
    with Image.open(path) as img:
        cy = int(cx * img.height / img.width)
    body.append(f'''<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{len(rels)}" name="{esc(caption)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="{esc(Path(path).name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>''')
    p(caption, align="center", italic=True, size=22)

# Document content
p("AI-Powered Interview Preparation Assistant (SmartHire)", align="center", bold=True, size=36)
p("Final Year Project Report", align="center", bold=True, size=30)
p("By", align="center")
p("Gavriel Sadiq    22-ARID-1005", align="center")
p("Faizan Habib     22-ARID-1004", align="center")
p("Supervisor: Ms. Iram Rubab", align="center")
p("Department of Software Engineering", align="center")
p("University Institute of Information Technology", align="center")
p("PMAS-Arid Agriculture University Rawalpindi", align="center")
p("Pakistan (2022-2026)", align="center")

heading("Declaration", 0)
p("We hereby declare that this software project and its documentation have been developed by us as an original academic effort. The work presented in this report has not been copied from any source and has not been submitted previously for any degree or qualification. Any external material, tool, library, or reference used for the development and documentation of SmartHire has been acknowledged appropriately.")
p("__________________________                 __________________________", align="center")
p("Gavriel Sadiq                              Faizan Habib", align="center")

heading("Certificate of Approval", 0)
p("It is certified that the Final Year Project titled “AI-Powered Interview Preparation Assistant (SmartHire)” has been developed by Gavriel Sadiq (22-ARID-1005) and Faizan Habib (22-ARID-1004) under the supervision of Ms. Iram Rubab. In the supervisor’s opinion, the project is adequate in scope and quality for the degree of Bachelor of Science in Software Engineering.")
p("__________________________\nSupervisor", align="center")
p("__________________________\nExaminer-I", align="center")
p("__________________________\nExaminer-II", align="center")

heading("Executive Summary", 0)
p("SmartHire is an AI-powered interview preparation and performance analytics platform designed for students and job seekers who need structured, accessible, and objective interview practice. Traditional preparation methods usually depend on static question lists, self-assessment, peer feedback, or expensive coaching. These approaches often fail to provide immediate, personalized, and measurable feedback. SmartHire addresses this gap through a web-based system that provides technical, behavioral, and situational practice sessions, mock interviews, AI-based answer evaluation, voice input support, and dashboard analytics.")
p("The system is implemented as a full-stack web application using React on the frontend, Node.js and Express on the backend, and MongoDB for persistent storage. It uses secure authentication with JWT cookies, role-aware user records, protected session APIs, structured validation, rate limiting, and a modular evaluation service. Candidate answers are evaluated through an AI service when configured, with a smart fallback evaluator and guardrails to keep feedback stable and relevant. Users can save practice and mock interview sessions and review their performance through separate overall, practice, and mock analytics views.")

heading("Acknowledgement", 0)
p("All praise is to Almighty Allah, who gave us the strength, knowledge, and patience to complete this project. We are sincerely thankful to our supervisor, Ms. Iram Rubab, for her guidance, support, and valuable feedback throughout the development of this Final Year Project. We are also grateful to our department, teachers, family, and friends for their encouragement and support during this work.")

heading("Abbreviations", 0)
table([["Abbreviation", "Meaning"], ["AI", "Artificial Intelligence"], ["API", "Application Programming Interface"], ["FYP", "Final Year Project"], ["JWT", "JSON Web Token"], ["NLP", "Natural Language Processing"], ["REST", "Representational State Transfer"], ["SRS", "Software Requirements Specification"], ["UI", "User Interface"], ["UML", "Unified Modeling Language"]])

heading("Table of Contents", 0)
for line in ["Chapter 1: Introduction", "Chapter 2: Problem Definition", "Chapter 3: Requirement Analysis", "Chapter 4: Design and Architecture", "Chapter 5: Implementation", "Chapter 6: Testing and Evaluation", "Chapter 7: Conclusion and Future Work", "References"]:
    p(line)

heading("Chapter 1: Introduction", 0)
heading("1.1 Brief", 1)
p("SmartHire is an AI-powered interview preparation assistant that helps users practice interview questions, receive structured evaluation, and track their improvement over time. The application supports three major question categories: technical, behavioral, and situational. Users can configure practice sessions with 5, 10, 15, or 20 questions, attempt mock interviews, submit answers through text or voice transcription, and receive feedback containing a score, strengths, weaknesses, improvement guidance, and overall comments. The dashboard presents overall, practice-only, and mock-only performance analytics.")
heading("1.2 Relevance to Course Modules", 1)
bullets(["Software Requirement Engineering is applied through requirement analysis, use cases, and SRS documentation.", "Web Engineering is applied through React frontend development and REST API integration.", "Database Systems are applied through MongoDB schema design for users, questions, and sessions.", "Artificial Intelligence concepts are applied through automated answer evaluation and feedback generation.", "Software Quality Assurance is applied through validation, unit tests, integration tests, and usability checks.", "Software Project Management is applied through phased development and incremental delivery."])
heading("1.3 Project Background", 1)
p("Interview preparation is a common challenge for university students and fresh graduates. Many students know technical concepts but struggle to express them clearly in interviews. Behavioral and situational questions are also difficult because they require structured examples, prioritization, and professional communication. Existing online resources provide question lists but rarely provide objective feedback or progress tracking. SmartHire was designed to provide an interactive and measurable preparation environment that can be used repeatedly without requiring a human interviewer every time.")
heading("1.4 Literature Review", 1)
p("Research and market trends show increasing interest in automated assessment, natural language processing, and AI-supported learning. Existing tools such as Google Interview Warmup provide practice questions and basic feedback, while peer interview platforms provide human interaction but depend on availability and scheduling. Large language model based systems can evaluate semantic relevance, structure, and completeness of answers. However, a useful student-focused system must combine evaluation with session tracking, simple workflows, and clear improvement suggestions. SmartHire focuses on these needs by combining a question bank, AI-supported evaluation, voice input, and analytics.")
heading("1.5 Analysis from Literature Review", 1)
p("The review indicates that SmartHire should not be limited to simple scoring. It should provide actionable feedback, category-specific evaluation, and progress tracking. Unlike unrelated summarization or video analysis systems, SmartHire is specifically focused on interview preparation. Therefore, the implemented system evaluates the answer against the actual interview question, uses expected keywords and sample answer guidance when available, and stores session-level metrics for dashboard analytics.")
heading("1.6 Methodology and Software Life Cycle", 1)
p("The project follows an incremental and iterative methodology. The first increment focused on authentication, question loading, and basic practice sessions. The second increment added AI evaluation, mock interview flow, and voice input. The third increment added dashboard analytics, saved sessions, validation, rate limiting, and improved user experience. This approach is suitable because AI evaluation and user interaction features require repeated testing and refinement.")

heading("Chapter 2: Problem Definition", 0)
heading("2.1 Problem Statement", 1)
p("Students and job seekers often enter interviews without receiving reliable feedback on their answers. Static question banks do not identify weak areas, peer feedback may be subjective, and professional coaching can be expensive. Candidates also need a way to monitor improvement across multiple sessions. The problem is the absence of an accessible web-based interview preparation platform that combines realistic practice, AI-driven feedback, voice-supported answering, and performance analytics.")
heading("2.2 Purpose", 1)
p("The purpose of SmartHire is to provide a structured interview preparation environment where users can practice, receive immediate feedback, save sessions, and track progress. The system aims to improve confidence, answer quality, and self-awareness before real interviews.")
heading("2.3 Product Functions", 1)
bullets(["Register, log in, log out, and maintain a secure user session.", "Configure practice sessions by category, difficulty, and question count.", "Conduct mock interviews with a professional final-question completion flow.", "Accept typed answers and browser voice transcription where supported.", "Evaluate answers and return score, strengths, weaknesses, improvement, and overall feedback.", "Save practice and mock sessions to the dashboard.", "Display overall, practice-only, and mock-only performance analytics."])
heading("2.4 Proposed Architecture", 1)
p("SmartHire uses a three-tier architecture. The presentation layer is a React web application. The application layer is a Node.js and Express REST API that handles authentication, validation, question retrieval, evaluation requests, and session persistence. The data layer is MongoDB, accessed through Mongoose models. The evaluation service can use OpenAI when enabled, an optional Python evaluator, or a smart fallback evaluator with guardrails.")
image(diagrams["architecture"], "Figure 2.1: Proposed Architecture of SmartHire")
heading("2.5 Project Deliverables", 1)
bullets(["A working SmartHire web application.", "Frontend source code developed in React and Vite.", "Backend source code developed in Node.js and Express.", "MongoDB schemas and seed/question dataset support.", "AI evaluation service and fallback evaluation logic.", "Dashboard analytics for saved practice and mock sessions.", "FYP documentation, diagrams, testing evidence, and presentation material."])
heading("2.6 Operating Environment", 1)
table([["Category", "Technology", "Purpose"], ["Frontend", "React 19, Vite, Tailwind CSS", "User interface and client-side routing"], ["Backend", "Node.js, Express 5", "REST API and business logic"], ["Database", "MongoDB, Mongoose", "Persistent data storage"], ["Authentication", "JWT, bcryptjs, Google Identity optional", "Secure login and session management"], ["AI/Evaluation", "OpenAI API optional, smart evaluator fallback", "Answer scoring and feedback"], ["Testing", "Vitest, Testing Library, Node test runner", "Frontend and backend verification"], ["Deployment", "Docker, Nginx support", "Containerized deployment support"]])
heading("2.7 Assumptions and Dependencies", 1)
p("Users are assumed to have a modern browser, internet connection, and microphone permission if they want to use voice input. AI evaluation depends on API configuration when OpenAI is enabled, while the fallback evaluator allows the system to continue working without an external AI key. MongoDB availability is required for persistent users, questions, and saved sessions.")

heading("Chapter 3: Requirement Analysis", 0)
heading("3.1 Functional Requirements", 1)
table([["ID", "Requirement", "Description"], ["FR-01", "User Registration", "The system shall allow new users to register with email and password."], ["FR-02", "User Login", "The system shall authenticate users and create secure JWT cookie sessions."], ["FR-03", "Google Login", "The system shall support Google sign-in when configured."], ["FR-04", "Configure Practice", "The user shall select category, difficulty, mode, and number of questions."], ["FR-05", "Question Retrieval", "The system shall fetch technical, behavioral, or situational questions from the database."], ["FR-06", "Practice Evaluation", "The system shall evaluate practice answers and display feedback."], ["FR-07", "Mock Interview", "The system shall conduct mock interview sessions with sequential questions."], ["FR-08", "Voice Input", "The system shall support browser speech recognition where available."], ["FR-09", "Save Session", "The user shall save practice or mock session results to the dashboard."], ["FR-10", "Dashboard Analytics", "The system shall show overall, practice, and mock performance views."]])
heading("3.2 Non-Functional Requirements", 1)
heading("3.2.1 Usability", 2)
p("The interface shall be simple, responsive, and understandable for first-time users. Important actions such as evaluation, save, retry, and dashboard navigation shall be clearly visible.")
heading("3.2.2 Reliability", 2)
p("The system shall handle missing answers, invalid tokens, AI service failures, and unavailable data without crashing. Fallback evaluation shall be available when external AI is disabled or fails.")
heading("3.2.3 Performance", 2)
p("The dashboard and session screens should load quickly over normal broadband. Evaluation requests should return within an acceptable interactive time, and rate limiting shall protect APIs from excessive use.")
heading("3.2.4 Supportability", 2)
p("The codebase shall remain modular with separated routes, controllers, services, middleware, models, and React pages. This supports future extensions such as video analysis or resume-based interview generation.")
heading("3.2.5 Security Constraints", 2)
p("The system shall use hashed passwords, HTTP-only JWT cookies, input validation, CORS restrictions, Helmet security headers, and rate limiting.")
heading("3.3 Use Case Model", 1)
p("The primary actor is the Candidate. Supporting system actors include the AI Evaluator and MongoDB database. The main use cases are authentication, configuring a session, answering questions, evaluating answers, saving sessions, retrying mock interviews, and viewing analytics.")
image(diagrams["use_case"], "Figure 3.1: Use Case Diagram for SmartHire")
heading("3.3.1 Actors Description", 2)
table([["Actor", "Description"], ["Candidate", "A student, graduate, or job seeker who uses SmartHire for interview preparation."], ["AI Evaluator", "The evaluation service that scores answers and generates feedback."], ["Database", "MongoDB storage used for users, questions, and saved sessions."]])
heading("3.3.2 Use Case Description", 2)
table([["Use Case", "Conduct Interview Practice Session"], ["Primary Actor", "Candidate"], ["Preconditions", "User is authenticated for protected practice and dashboard features."], ["Main Flow", "User selects category and mode, answers questions, submits responses, receives feedback, saves results, and reviews dashboard analytics."], ["Alternative Flow", "If AI service fails, fallback evaluation generates feedback. If voice is unavailable, user enters text manually."], ["Postconditions", "Session results are available for dashboard tracking if the user saves them."]])
heading("3.4 Data Model", 1)
image(diagrams["erd"], "Figure 3.2: Entity Relationship Diagram for SmartHire")

heading("Chapter 4: Design and Architecture", 0)
heading("4.1 UML Structural Diagrams", 1)
heading("4.1.1 Component Diagram", 2)
p("The component diagram shows how frontend pages communicate with backend API routes, middleware, services, and database models. The design separates user interface logic from server-side business rules and evaluation services.")
image(diagrams["component"], "Figure 4.1: Component Diagram")
heading("4.1.2 Package Diagram", 2)
p("The frontend package contains pages, components, layout, routes, utilities, and tests. The backend package contains routes, controllers, services, middleware, models, utilities, tests, and data scripts. This package separation improves maintainability and supports independent testing of client and server concerns.")
heading("4.1.3 Deployment Diagram", 2)
image(diagrams["deployment"], "Figure 4.2: Deployment Diagram")
heading("4.1.4 Class / Data Structure Diagram", 2)
p("The main persistent classes are User, Question, and PracticeSession. User stores identity and session data. Question stores interview question metadata, category, difficulty, expected keywords, and sample guidance. PracticeSession stores the mode, category, difficulty, attempted count, and average score for dashboard analytics.")
heading("4.2 UML Behavioral Diagrams", 1)
heading("4.2.1 Activity Diagram", 2)
image(diagrams["activity"], "Figure 4.3: Activity Diagram for Practice and Mock Sessions")
heading("4.2.2 State Machine Description", 2)
p("A mock interview moves through the states: loading questions, answering current question, evaluating answer, showing feedback, moving to next question, final question evaluated, saved/retry/summary, and completed summary. Error states include no questions found, evaluation failed, and save failed.")
heading("4.3 UML Interaction Diagrams", 1)
heading("4.3.1 Sequence Diagram", 2)
image(diagrams["sequence"], "Figure 4.4: Sequence Diagram for Mock Interview Evaluation")
heading("4.4 Node Structure", 1)
p("The backend node structure follows a maintainable Express layout: routes define endpoints, controllers handle request-level logic, services implement evaluation behavior, middleware handles authentication and validation, models define MongoDB schemas, and utilities standardize responses and errors.")
heading("4.5 Communication Design Protocol", 1)
p("The system communicates through HTTPS REST APIs using JSON payloads. Authentication is maintained using HTTP-only JWT cookies and the frontend uses credential-aware API calls. Protected routes validate access tokens before returning dashboard or session data.")

heading("Chapter 5: Implementation", 0)
heading("5.1 Communication Protocol Implementation", 1)
p("SmartHire uses RESTful endpoints under /api. The frontend calls endpoints such as /api/auth/login, /api/questions, /api/ai/evaluate, /api/mock/evaluate, and /api/practice/sessions. Responses follow a structured success/error format to simplify frontend handling.")
heading("5.2 Frontend Application Implementation", 1)
p("The frontend is implemented in React with Vite. Main pages include Auth, ConfigurePractice, PracticeSession, MockInterview, and Dashboard. React Router manages navigation and protected routes. Tailwind CSS provides responsive styling. Recharts is used for dashboard bar charts, while lucide-react provides consistent icons.")
heading("5.3 Backend Application Implementation", 1)
p("The backend is implemented in Node.js and Express. It includes security middleware such as Helmet, CORS configuration, request size limits, rate limiting, and request logging. Authentication uses bcryptjs for password hashing and JWT cookies for access and refresh sessions. MongoDB is accessed through Mongoose models.")
heading("5.4 AI Evaluation Implementation", 1)
p("The evaluation service normalizes questions and answers, loads question-specific context from the database, applies category-specific rubrics, and returns structured feedback. If OpenAI is enabled and configured, the service requests JSON feedback from the selected model. If the external AI service is disabled or unavailable, SmartHire uses a smart local evaluator and guardrails to produce stable feedback.")
heading("5.5 Session Saving and Dashboard Implementation", 1)
p("Practice and mock sessions are saved through the PracticeSession model. Each saved record includes mode, category, difficulty, question count, attempted count, and average score. The dashboard groups saved sessions by category and mode, then displays overall, practice-only, and mock-only performance summaries.")
heading("5.6 User Interface Implementation", 1)
p("The interface includes a landing page, authentication screens, configuration panel, question answering screens, final mock interview action panel, and dashboard analytics. After the final mock question is evaluated, users can save to dashboard, retry the mock interview, review summary, or go back. This creates a more professional completion workflow than a simple success message.")

heading("Chapter 6: Testing and Evaluation", 0)
heading("6.1 Verification", 1)
p("Verification ensures that implemented features match the specified requirements. Frontend tests verify authentication flow, protected routes, dashboard views, practice session flow, and mock interview behavior. Backend tests verify validation, guardrails, authentication session behavior, and question extraction.")
heading("6.1.1 Functional Testing", 2)
table([["Test Area", "Expected Result", "Status"], ["Register/Login", "User session is created and protected routes can be accessed.", "Pass"], ["Practice Session", "Questions load, answers evaluate, and session saves.", "Pass"], ["Mock Interview", "Question loads, answer evaluates, final actions appear, and manual save works.", "Pass"], ["Dashboard", "Overall, mock, and practice views show correct summaries.", "Pass"], ["Validation", "Invalid payloads return validation errors.", "Pass"]])
heading("6.1.2 Static Testing", 2)
p("Static testing includes reviewing code organization, route naming, schema fields, validation rules, and UI behavior. ESLint configuration is present for frontend code quality, and the backend uses modular files for routes, controllers, services, middleware, and models.")
heading("6.2 Validation", 1)
p("Validation checks whether the product solves the user problem. SmartHire provides direct practice, immediate feedback, saved performance history, and visual progress tracking. These functions address the original need for accessible and objective interview preparation.")
heading("6.3 Usability Testing", 1)
p("Usability testing focuses on whether users can register, start a session, answer questions, understand feedback, save results, retry mock interviews, and interpret dashboard charts without confusion. The updated final mock interview flow improves professionalism by giving clear user choices after the final evaluation.")
heading("6.4 Unit Testing", 1)
p("Unit and focused component tests are written using Vitest and Testing Library for frontend behavior. Backend tests use Node’s test runner for API validation and service guardrails.")
heading("6.5 Integration Testing", 1)
p("Integration testing verifies communication between frontend screens and backend endpoints. Practice and mock interview tests mock API calls and verify request payloads, saved session data, and UI transitions.")
heading("6.6 System Testing", 1)
p("System testing validates the full user journey: user authentication, category selection, session execution, answer evaluation, session saving, dashboard analytics, logout, and error handling.")
heading("6.7 Acceptance Testing", 1)
p("The project is acceptable when users can complete practice and mock interview sessions, receive meaningful feedback, save results, and view performance analytics without system errors.")
heading("6.8 Stress Testing", 1)
p("The backend includes rate limiting to reduce abuse of API and AI endpoints. Future stress testing may use tools such as k6 or JMeter to measure concurrent interview sessions and dashboard requests.")
heading("6.9 Hardware Configuration for Testing", 1)
table([["Item", "Configuration"], ["Processor", "Intel Core i5 or equivalent"], ["RAM", "8 GB minimum recommended"], ["Browser", "Chrome, Edge, or Firefox latest version"], ["Backend Runtime", "Node.js 20.x"], ["Database", "MongoDB local or cloud instance"]])
heading("6.10 Evaluation", 1)
p("The project successfully implements the major planned functions and corrects the weaknesses found in the previous documentation. The actual implementation is aligned with React, Express, MongoDB, JWT authentication, and AI/fallback answer evaluation rather than unrelated technologies.")
heading("6.11 Deployment", 1)
p("The project includes Docker and Nginx configuration support. In deployment, the frontend build can be served through Nginx while the backend Express server communicates with MongoDB and optional external AI/OAuth services.")
heading("6.12 Maintenance", 1)
p("Maintenance can be performed by updating question datasets, improving rubrics, adding new categories, refining dashboard metrics, and updating dependencies. The modular architecture supports such changes with low impact on unrelated modules.")

heading("Chapter 7: Conclusion and Future Work", 0)
heading("7.1 Conclusion", 1)
p("SmartHire provides an intelligent, practical, and user-friendly platform for interview preparation. It combines configurable practice sessions, mock interviews, AI-based feedback, voice input, saved session tracking, and dashboard analytics. The project applies core software engineering concepts including requirement analysis, full-stack web development, database design, security, testing, and iterative improvement.")
heading("7.2 Future Work", 1)
bullets(["Add resume-based question generation for personalized interviews.", "Add video analysis for posture, eye contact, and facial confidence if ethically approved.", "Add downloadable PDF reports for individual interview sessions.", "Add admin panel for managing question banks and reviewing usage analytics.", "Add role-specific interview tracks such as frontend developer, backend developer, QA engineer, and data analyst.", "Improve AI evaluation with more detailed rubrics and calibrated scoring."])

heading("References", 0)
for ref in [
    "OpenAI. (2024). OpenAI API documentation. https://platform.openai.com/docs",
    "MongoDB. (2024). MongoDB documentation. https://www.mongodb.com/docs/",
    "Express.js. (2024). Express documentation. https://expressjs.com/",
    "React. (2024). React documentation. https://react.dev/",
    "Mongoose. (2024). Mongoose documentation. https://mongoosejs.com/docs/",
    "Google. (2024). Google Identity Services documentation. https://developers.google.com/identity",
    "Mozilla Developer Network. (2024). Web Speech API. https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API",
    "Pressman, R. S., & Maxim, B. R. (2019). Software Engineering: A Practitioner’s Approach. McGraw-Hill.",
]:
    p(ref)

sect = '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1800" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>'
doc_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>{''.join(body)}{sect}</w:body></w:document>'''
styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:style></w:styles>'''
rels_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
doc_rels_xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join([f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{target}"/>' for rid, target in rels]) + '</Relationships>'
content_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'''

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as docx:
    docx.writestr("[Content_Types].xml", content_xml)
    docx.writestr("_rels/.rels", rels_xml)
    docx.writestr("word/document.xml", doc_xml)
    docx.writestr("word/styles.xml", styles_xml)
    docx.writestr("word/_rels/document.xml.rels", doc_rels_xml)
    for _, target in rels:
        img_path = MEDIA_DIR / Path(target).name
        docx.write(img_path, f"word/{target}")

print(OUT)
print(OUT.stat().st_size)
print(f"images={len(rels)}")
