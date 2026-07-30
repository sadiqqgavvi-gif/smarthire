from pathlib import Path
import html
import math
import zipfile

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
MEDIA_DIR = ROOT / "fyp_report_media" / "uml_diagrams"
OUT_DOCX = ROOT / "SmartHire_UML_Diagrams.docx"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)


PAGE_W = 1800
PAGE_H = 1125
BLACK = "#111827"
MUTED = "#475569"
BORDER = "#334155"
LIGHT = "#F8FAFC"
BLUE = "#DBEAFE"
GREEN = "#DCFCE7"
PURPLE = "#EDE9FE"
AMBER = "#FEF3C7"
RED = "#FEE2E2"
CYAN = "#CFFAFE"
GRAY = "#E5E7EB"
WHITE = "#FFFFFF"


def font(size=24, bold=False):
    candidates = [
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


F_TITLE = font(42, True)
F_H = font(28, True)
F_TEXT = font(22)
F_SMALL = font(18)
F_TINY = font(16)


def text_width(draw, text, fnt):
    return draw.textbbox((0, 0), str(text), font=fnt)[2]


def wrap(draw, text, fnt, width):
    words = str(text).split()
    lines = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if text_width(draw, trial, fnt) <= width or not current:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def centered_text(draw, xy, text, fnt=F_TEXT, fill=BLACK):
    x1, y1, x2, y2 = xy
    lines = wrap(draw, text, fnt, x2 - x1 - 16)
    line_h = fnt.size + 6
    total_h = line_h * len(lines)
    y = y1 + ((y2 - y1) - total_h) / 2
    for line in lines:
        w = text_width(draw, line, fnt)
        draw.text((x1 + ((x2 - x1) - w) / 2, y), line, font=fnt, fill=fill)
        y += line_h


def box(draw, xy, title, lines=None, fill=LIGHT, outline=BORDER, radius=18, stereotype=None):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=3)
    y = y1 + 18
    if stereotype:
        draw.text((x1 + 18, y), stereotype, font=F_TINY, fill=MUTED)
        y += 22
    draw.text((x1 + 18, y), title, font=F_H, fill=BLACK)
    y += 38
    for line in lines or []:
        for wrapped in wrap(draw, line, F_SMALL, x2 - x1 - 36):
            draw.text((x1 + 18, y), wrapped, font=F_SMALL, fill=MUTED)
            y += 24


def component_box(draw, xy, title, lines=None, fill=LIGHT):
    box(draw, xy, title, lines, fill, stereotype="<<component>>")
    x1, y1, x2, _ = xy
    draw.rectangle((x2 - 54, y1 + 20, x2 - 24, y1 + 42), fill=WHITE, outline=BORDER, width=2)
    draw.rectangle((x2 - 64, y1 + 28, x2 - 44, y1 + 50), fill=WHITE, outline=BORDER, width=2)


def package(draw, xy, title, lines=None, fill=LIGHT):
    x1, y1, x2, y2 = xy
    tab_w = min(170, int((x2 - x1) * 0.45))
    draw.rectangle((x1, y1 + 28, x2, y2), fill=fill, outline=BORDER, width=3)
    draw.rectangle((x1, y1, x1 + tab_w, y1 + 30), fill=fill, outline=BORDER, width=3)
    draw.text((x1 + 16, y1 + 44), title, font=F_H, fill=BLACK)
    y = y1 + 84
    for line in lines or []:
        draw.text((x1 + 18, y), line, font=F_SMALL, fill=MUTED)
        y += 26


def node(draw, xy, title, lines=None, fill=LIGHT):
    x1, y1, x2, y2 = xy
    offset = 22
    draw.polygon(
        [(x1 + offset, y1), (x2, y1), (x2, y2 - offset), (x2 - offset, y2), (x1, y2), (x1, y1 + offset)],
        fill=fill,
        outline=BORDER,
    )
    draw.line((x1 + offset, y1, x1 + offset, y2 - offset, x1, y2), fill=BORDER, width=3)
    draw.line((x1 + offset, y2 - offset, x2, y2 - offset), fill=BORDER, width=3)
    draw.text((x1 + 28, y1 + 22), "<<node>>", font=F_TINY, fill=MUTED)
    draw.text((x1 + 28, y1 + 48), title, font=F_H, fill=BLACK)
    y = y1 + 92
    for line in lines or []:
        for wrapped in wrap(draw, line, F_SMALL, x2 - x1 - 60):
            draw.text((x1 + 28, y), wrapped, font=F_SMALL, fill=MUTED)
            y += 24


def class_box(draw, xy, name, attrs, methods=None, fill=LIGHT):
    x1, y1, x2, y2 = xy
    draw.rectangle(xy, fill=fill, outline=BORDER, width=3)
    h1 = y1 + 48
    h2 = h1 + 132
    draw.line((x1, h1, x2, h1), fill=BORDER, width=3)
    draw.line((x1, h2, x2, h2), fill=BORDER, width=3)
    centered_text(draw, (x1, y1, x2, h1), name, F_H)
    y = h1 + 12
    for attr in attrs:
        draw.text((x1 + 14, y), attr, font=F_TINY, fill=BLACK)
        y += 22
    y = h2 + 12
    for method in methods or []:
        draw.text((x1 + 14, y), method, font=F_TINY, fill=MUTED)
        y += 22


def arrow(draw, start, end, label=None, fill=BORDER, width=4, dashed=False):
    if dashed:
        dash_line(draw, start, end, fill, width)
    else:
        draw.line((start, end), fill=fill, width=width)
    ang = math.atan2(end[1] - start[1], end[0] - start[0])
    length = 18
    points = [
        end,
        (end[0] - length * math.cos(ang - math.pi / 6), end[1] - length * math.sin(ang - math.pi / 6)),
        (end[0] - length * math.cos(ang + math.pi / 6), end[1] - length * math.sin(ang + math.pi / 6)),
    ]
    draw.polygon(points, fill=fill)
    if label:
        mx, my = (start[0] + end[0]) / 2, (start[1] + end[1]) / 2
        tw = text_width(draw, label, F_TINY)
        draw.rectangle((mx - tw / 2 - 8, my - 14, mx + tw / 2 + 8, my + 14), fill=WHITE)
        draw.text((mx - tw / 2, my - 10), label, font=F_TINY, fill=MUTED)


def dash_line(draw, start, end, fill=BORDER, width=3, dash=14, gap=10):
    x1, y1 = start
    x2, y2 = end
    length = math.hypot(x2 - x1, y2 - y1)
    if length == 0:
        return
    dx = (x2 - x1) / length
    dy = (y2 - y1) / length
    pos = 0
    while pos < length:
        sx = x1 + dx * pos
        sy = y1 + dy * pos
        ex = x1 + dx * min(pos + dash, length)
        ey = y1 + dy * min(pos + dash, length)
        draw.line((sx, sy, ex, ey), fill=fill, width=width)
        pos += dash + gap


def title(draw, text):
    draw.text((54, 34), text, font=F_TITLE, fill=BLACK)
    draw.line((54, 92, PAGE_W - 54, 92), fill="#CBD5E1", width=2)


def save(name, draw_fn):
    img = Image.new("RGB", (PAGE_W, PAGE_H), WHITE)
    draw = ImageDraw.Draw(img)
    draw_fn(draw)
    path = MEDIA_DIR / f"{name}.png"
    img.save(path, "PNG")
    return path


def block_diagram():
    def draw_it(draw):
        title(draw, "SmartHire Block Diagram")
        box(draw, (80, 180, 390, 360), "Candidate Browser", ["React UI", "Voice input", "Dashboard"], BLUE)
        box(draw, (545, 160, 875, 380), "Frontend App", ["React Router", "Auth screens", "Practice and mock pages", "authFetch utility"], CYAN)
        box(draw, (1030, 140, 1360, 390), "Backend API", ["Express app", "Routes/controllers", "Validation, CORS, Helmet", "Rate limiting"], GREEN)
        box(draw, (1460, 170, 1720, 350), "MongoDB", ["Users", "Questions", "PracticeSessions", "Messages"], AMBER)
        box(draw, (1030, 540, 1360, 780), "Evaluation Engine", ["Python evaluator optional", "OpenAI optional", "Smart fallback evaluator", "Guardrails"], PURPLE)
        box(draw, (545, 560, 875, 780), "External Identity", ["Google Identity Services", "Email/password auth", "JWT cookies"], RED)
        arrow(draw, (390, 270), (545, 270), "uses")
        arrow(draw, (875, 270), (1030, 270), "REST JSON")
        arrow(draw, (1360, 260), (1460, 260), "Mongoose")
        arrow(draw, (1195, 390), (1195, 540), "score answers")
        arrow(draw, (875, 650), (1030, 650), "optional OAuth / session")
    return save("01_block_diagram", draw_it)


def component_diagram():
    def draw_it(draw):
        title(draw, "UML Component Diagram")
        component_box(draw, (70, 150, 430, 380), "React Web Client", ["Pages: Auth, Dashboard", "PracticeSession, MockInterview", "Components: Hero, Practice", "Utilities: authFetch, apiBaseUrl"], BLUE)
        component_box(draw, (560, 140, 920, 380), "Express REST API", ["app.js route mounting", "/api/auth, /api/questions", "/api/practice, /api/mock", "/api/ai, /api/contact"], GREEN)
        component_box(draw, (1060, 120, 1420, 330), "Evaluation Services", ["aiEvaluationService", "pythonEvaluationService", "smartEvaluator", "evaluationGuardrails"], PURPLE)
        component_box(draw, (1060, 450, 1420, 690), "Mongoose Models", ["User", "Question", "PracticeSession", "Message"], AMBER)
        component_box(draw, (560, 520, 920, 770), "Middleware / Utilities", ["authMiddleware", "validationMiddleware", "rateLimitMiddleware", "observability", "apiResponse, database"], RED)
        box(draw, (1510, 230, 1730, 360), "OpenAI API", ["Optional external service"], LIGHT)
        box(draw, (1510, 520, 1730, 650), "MongoDB", ["Persistent database"], LIGHT)
        arrow(draw, (430, 260), (560, 260), "requires REST endpoints")
        arrow(draw, (920, 240), (1060, 220), "uses")
        arrow(draw, (920, 600), (1060, 560), "persists")
        arrow(draw, (740, 380), (740, 520), "passes through")
        arrow(draw, (1420, 220), (1510, 285), "when USE_AI=true")
        arrow(draw, (1420, 570), (1510, 570), "stores / queries")
    return save("02_component_diagram", draw_it)


def package_diagram():
    def draw_it(draw):
        title(draw, "UML Package Diagram")
        package(draw, (80, 150, 430, 430), "SmartHire/src", ["pages", "components", "layout", "routes", "utils", "tests"], BLUE)
        package(draw, (555, 130, 910, 430), "smarthire-server", ["routes", "controllers", "services", "middleware", "models", "utils", "tests"], GREEN)
        package(draw, (1040, 160, 1390, 430), "models", ["User", "Question", "PracticeSession", "Message"], AMBER)
        package(draw, (1040, 550, 1390, 820), "services", ["aiEvaluationService", "pythonEvaluationService", "smartEvaluator", "guardrails"], PURPLE)
        package(draw, (555, 570, 910, 820), "data and topics", ["practiceQuestions.js", "topics/en/technical", "topics/en/behavioral", "topics/en/situational"], CYAN)
        package(draw, (80, 585, 430, 820), "deployment", ["Dockerfile", "docker-compose.yml", "nginx.conf", "vercel.json"], RED)
        arrow(draw, (430, 275), (555, 275), "<<import>> REST API")
        arrow(draw, (910, 275), (1040, 290), "<<use>>")
        arrow(draw, (735, 430), (735, 570), "<<load dataset>>")
        arrow(draw, (910, 650), (1040, 650), "<<evaluate>>")
        arrow(draw, (255, 585), (555, 400), "<<build/deploy>>", dashed=True)
    return save("03_package_diagram", draw_it)


def deployment_diagram():
    def draw_it(draw):
        title(draw, "UML Deployment Diagram")
        node(draw, (70, 180, 410, 400), "User Device", ["Browser", "React static assets", "Web Speech API"], BLUE)
        node(draw, (545, 150, 900, 430), "Frontend Container / Host", ["Nginx serves Vite build", "Host port 5173", "VITE_API_URL configured"], CYAN)
        node(draw, (1035, 150, 1390, 430), "Backend Container / Server", ["Node.js Express", "Host port 5000", "JWT cookies", "Health checks"], GREEN)
        node(draw, (1035, 575, 1390, 820), "MongoDB Container", ["mongo:7", "Volume: mongo_data", "smarthire database"], AMBER)
        node(draw, (545, 575, 900, 820), "External Services", ["OpenAI API optional", "Google tokeninfo optional", "Python runtime optional"], PURPLE)
        arrow(draw, (410, 290), (545, 290), "HTTPS")
        arrow(draw, (900, 290), (1035, 290), "REST /api")
        arrow(draw, (1210, 430), (1210, 575), "mongodb://mongodb:27017")
        arrow(draw, (1035, 690), (900, 690), "API calls")
    return save("04_deployment_diagram", draw_it)


def class_diagram():
    def draw_it(draw):
        title(draw, "UML Class Diagram")
        class_box(
            draw,
            (60, 150, 405, 500),
            "User",
            ["+email: String", "+name: String", "+password: String?", "+authProvider: local|google", "+googleId: String?", "+role: user|admin", "+permissions: String[]", "+refreshTokenHash: String?"],
            ["+save()", "+findById()", "+findOne()"],
            BLUE,
        )
        class_box(
            draw,
            (520, 150, 865, 500),
            "PracticeSession",
            ["+user: ObjectId<User>", "+mode: practice|mock", "+category: String", "+difficulty: String", "+questionCount: Number", "+attemptedCount: Number", "+averageScore: Number"],
            ["+create()", "+find()", "+sort()", "+limit()"],
            GREEN,
        )
        class_box(
            draw,
            (980, 150, 1325, 500),
            "Question",
            ["+question: String", "+category: technical|behavioral|situational", "+role: String", "+difficulty: easy|medium|hard", "+expected_keywords: String[]", "+sample_answer: String"],
            ["+aggregate()", "+countDocuments()", "+findOne()"],
            AMBER,
        )
        class_box(
            draw,
            (1435, 150, 1740, 430),
            "Message",
            ["+name: String", "+email: String", "+message: String", "+date: Date"],
            ["+create()"],
            RED,
        )
        class_box(
            draw,
            (480, 650, 900, 910),
            "EvaluationResult",
            ["+score: Number", "+strengths: String", "+weaknesses: String", "+improvement: String", "+overall_feedback: String", "+source: String", "+model: String?"],
            ["+normalizeEvaluation()", "+applyEvaluationGuardrails()"],
            PURPLE,
        )
        class_box(
            draw,
            (1050, 650, 1485, 910),
            "EvaluationService",
            ["+mode: practice|mock", "+category: String", "+questionContext: Question?", "+expectedKeywords: String[]"],
            ["+evaluateInterviewAnswer()", "+evaluateWithPython()", "+smartEvaluate()"],
            CYAN,
        )
        arrow(draw, (405, 320), (520, 320), "1 owns 0..*")
        arrow(draw, (865, 320), (980, 320), "uses 0..*")
        arrow(draw, (1195, 500), (1195, 650), "context")
        arrow(draw, (1050, 780), (900, 780), "returns")
        arrow(draw, (1325, 810), (1435, 360), "contact form separate", dashed=True)
    return save("05_class_diagram", draw_it)


def activity_diagram():
    def draw_it(draw):
        title(draw, "UML Activity Diagram")
        draw.ellipse((120, 160, 170, 210), fill=BLACK)
        centered_text(draw, (70, 225, 220, 260), "Start", F_SMALL)
        box(draw, (300, 140, 600, 230), "Login / open app", [], BLUE)
        diamond(draw, (760, 155), 78, "Authenticated?")
        box(draw, (960, 110, 1270, 210), "Register or Login", ["Email/password or Google"], RED)
        box(draw, (960, 280, 1270, 380), "Select category", ["Technical, behavioral, situational"], CYAN)
        box(draw, (630, 280, 860, 380), "Configure", ["Mode, count, difficulty"], CYAN)
        diamond(draw, (460, 330), 80, "Mode?")
        box(draw, (220, 490, 520, 600), "Practice flow", ["Fetch questions", "Answer each card", "Evaluate selected answers"], GREEN)
        box(draw, (640, 490, 980, 600), "Mock interview flow", ["Question sequence", "Voice/text answer", "Evaluate each answer"], PURPLE)
        box(draw, (1100, 490, 1400, 600), "Generate feedback", ["Score, strengths, weaknesses, improvement"], AMBER)
        diamond(draw, (910, 750), 85, "More questions?")
        box(draw, (1180, 720, 1510, 820), "Save session", ["PracticeSession stored for dashboard"], GREEN)
        box(draw, (625, 890, 960, 990), "Dashboard analytics", ["Overall, practice, and mock views"], BLUE)
        draw.ellipse((1190, 920, 1260, 990), outline=BLACK, width=5)
        draw.ellipse((1205, 935, 1245, 975), fill=BLACK)
        centered_text(draw, (1160, 995, 1290, 1030), "End", F_SMALL)
        arrow(draw, (170, 185), (300, 185))
        arrow(draw, (600, 185), (682, 185))
        arrow(draw, (838, 185), (960, 160), "no")
        arrow(draw, (1115, 210), (1115, 280), "success")
        arrow(draw, (760, 233), (760, 280), "yes")
        arrow(draw, (960, 330), (860, 330))
        arrow(draw, (630, 330), (540, 330))
        arrow(draw, (420, 405), (370, 490), "practice")
        arrow(draw, (520, 390), (735, 490), "mock")
        arrow(draw, (520, 545), (1100, 545))
        arrow(draw, (980, 545), (1100, 545))
        arrow(draw, (1250, 600), (960, 735))
        arrow(draw, (825, 750), (520, 600), "yes")
        arrow(draw, (995, 750), (1180, 770), "no")
        arrow(draw, (1180, 820), (960, 925))
        arrow(draw, (960, 940), (1190, 955))
    return save("06_activity_diagram", draw_it)


def diamond(draw, center, size, text):
    cx, cy = center
    pts = [(cx, cy - size), (cx + size, cy), (cx, cy + size), (cx - size, cy)]
    draw.polygon(pts, fill=WHITE, outline=BORDER)
    draw.line(pts + [pts[0]], fill=BORDER, width=3)
    centered_text(draw, (cx - size + 8, cy - 30, cx + size - 8, cy + 30), text, F_TINY)


def sequence_diagram():
    def draw_it(draw):
        title(draw, "UML Sequence Diagram: Mock Answer Evaluation")
        participants = [
            ("Candidate", 130),
            ("React MockInterview", 430),
            ("Express /api/mock", 760),
            ("EvaluationService", 1090),
            ("Question Model", 1390),
            ("MongoDB", 1640),
        ]
        for name, x in participants:
            box(draw, (x - 115, 140, x + 115, 220), name, [], LIGHT, radius=6)
            dash_line(draw, (x, 220), (x, 1010), "#94A3B8", 3)
        messages = [
            (130, 430, 300, "1: enter answer"),
            (430, 760, 380, "2: POST /api/mock/evaluate"),
            (760, 1090, 460, "3: evaluateInterviewAnswer()"),
            (1090, 1390, 540, "4: load question context"),
            (1390, 1640, 620, "5: findOne(question)"),
            (1640, 1390, 690, "6: context result"),
            (1090, 1090, 760, "7: Python/OpenAI/fallback + guardrails"),
            (1090, 760, 830, "8: evaluation JSON"),
            (760, 430, 900, "9: success response"),
            (430, 130, 970, "10: show feedback / next action"),
        ]
        for x1, x2, y, label in messages:
            if x1 == x2:
                draw.arc((x1 - 10, y - 25, x1 + 130, y + 45), start=90, end=270, fill=BORDER, width=4)
                arrow(draw, (x1 + 120, y + 10), (x1 + 35, y + 10), label)
            elif x1 < x2:
                arrow(draw, (x1 + 20, y), (x2 - 20, y), label)
            else:
                arrow(draw, (x1 - 20, y), (x2 + 20, y), label, dashed=True)
    return save("07_sequence_diagram", draw_it)


def collaboration_diagram():
    def draw_it(draw):
        title(draw, "UML Collaboration Diagram: Save and Review Session")
        box(draw, (90, 180, 380, 330), "1: Candidate", ["Starts practice/mock", "Submits answers"], BLUE)
        box(draw, (570, 120, 930, 300), "2: React Pages", ["ConfigurePractice", "PracticeSession", "MockInterview", "Dashboard"], CYAN)
        box(draw, (1120, 160, 1490, 340), "3: Express API", ["practiceRoutes", "mockRoutes", "aiRoutes", "authRoutes"], GREEN)
        box(draw, (1120, 560, 1490, 740), "4: EvaluationService", ["Question context", "Python/OpenAI/fallback", "Guardrails"], PURPLE)
        box(draw, (570, 620, 930, 790), "5: PracticeSession Model", ["mode", "category", "difficulty", "averageScore"], AMBER)
        box(draw, (90, 620, 380, 790), "6: Dashboard", ["Fetch /sessions/me", "Display charts"], BLUE)
        box(draw, (1540, 390, 1740, 560), "7: MongoDB", ["users", "questions", "practice sessions"], LIGHT)
        arrow(draw, (380, 255), (570, 210), "1. select category")
        arrow(draw, (930, 220), (1120, 245), "2. fetch/evaluate")
        arrow(draw, (1305, 340), (1305, 560), "3. evaluate")
        arrow(draw, (1490, 650), (1620, 560), "4. question context")
        arrow(draw, (1120, 650), (930, 705), "5. evaluation result")
        arrow(draw, (750, 620), (750, 300), "6. save session", dashed=True)
        arrow(draw, (930, 705), (1540, 500), "7. create/find")
        arrow(draw, (570, 705), (380, 705), "8. dashboard stats")
    return save("08_collaboration_diagram", draw_it)


def escape(text):
    return html.escape(str(text), quote=True)


class DocxBuilder:
    def __init__(self):
        self.parts = []
        self.rels = []
        self.image_id = 1

    def p(self, text="", style=None, align=None, bold=False, italic=False, size=22, color="000000", page_break=False):
        style_xml = f'<w:pStyle w:val="{style}"/>' if style else ""
        jc = f'<w:jc w:val="{align}"/>' if align else ""
        br = '<w:r><w:br w:type="page"/></w:r>' if page_break else ""
        rpr = (
            f'<w:rPr>{"<w:b/>" if bold else ""}{"<w:i/>" if italic else ""}'
            f'<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="{color}"/><w:sz w:val="{size}"/></w:rPr>'
        )
        safe = escape(text).replace("\n", '</w:t><w:br/><w:t xml:space="preserve">')
        self.parts.append(
            f'<w:p><w:pPr>{style_xml}{jc}</w:pPr>{br}<w:r>{rpr}<w:t xml:space="preserve">{safe}</w:t></w:r></w:p>'
        )

    def heading(self, text, level=1, page_break=False):
        style = f"Heading{level}"
        self.p(text, style=style, page_break=page_break)

    def bullet(self, text):
        self.p(text, style="ListBullet")

    def image(self, path, caption):
        rid = f"rId{self.image_id}"
        self.image_id += 1
        path = Path(path)
        self.rels.append((rid, f"media/{path.name}", path))
        cx = 5760720
        with Image.open(path) as im:
            cy = int(cx * im.height / im.width)
        self.parts.append(
            f'''<w:p><w:pPr><w:jc w:val="center"/><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="{cx}" cy="{cy}"/><wp:docPr id="{self.image_id + 100}" name="{escape(caption)}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="{escape(path.name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="{rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'''
        )
        self.p(caption, align="center", italic=True, size=20, color="475569")

    def save(self, out_path):
        sect = (
            '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/>'
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>'
            '</w:sectPr>'
        )
        document_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
            'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
            f'<w:body>{"".join(self.parts)}{sect}</w:body></w:document>'
        )
        styles_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="180"/></w:pPr><w:rPr><w:b/><w:color w:val="0B2545"/><w:sz w:val="36"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="200"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="2E74B5"/><w:sz w:val="26"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:ind w:left="720" w:hanging="360"/><w:spacing w:after="80"/></w:pPr><w:rPr><w:sz w:val="22"/></w:rPr></w:style>
</w:styles>'''
        root_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
        doc_rels = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            + "".join(
                f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="{target}"/>'
                for rid, target, _ in self.rels
            )
            + "</Relationships>"
        )
        content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'''
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as docx:
            docx.writestr("[Content_Types].xml", content_types)
            docx.writestr("_rels/.rels", root_rels)
            docx.writestr("word/document.xml", document_xml)
            docx.writestr("word/styles.xml", styles_xml)
            docx.writestr("word/_rels/document.xml.rels", doc_rels)
            for _, target, src in self.rels:
                docx.write(src, f"word/{target}")


def build_doc(diagrams):
    doc = DocxBuilder()
    doc.p("SmartHire System Diagrams", style="Title", align="center")
    doc.p("Block Diagram and UML Structural, Behavioural, and Interaction Diagrams", align="center", bold=True, size=26, color="0B2545")
    doc.p("Project: SmartHire - AI-Powered Interview Preparation Assistant", align="center", size=22, color="475569")
    doc.p(
        "This document contains project-specific diagrams for the implemented SmartHire codebase: React/Vite frontend, Express REST API, MongoDB persistence, JWT authentication, optional Google login, and Python/OpenAI/fallback answer evaluation.",
        size=22,
    )
    doc.heading("Diagram Index", 1)
    for item in [
        "1. Block Diagram",
        "2. UML Component Diagram",
        "3. UML Package Diagram",
        "4. UML Deployment Diagram",
        "5. UML Class Diagram",
        "6. UML Activity Diagram",
        "7. UML Sequence Diagram",
        "8. UML Collaboration Diagram",
    ]:
        doc.p(item)

    entries = [
        ("Block Diagram", diagrams["block"], "Figure 1: SmartHire high-level block diagram showing browser, frontend, backend, database, authentication, and evaluation blocks."),
        ("UML Structural Diagram - Component Diagram", diagrams["component"], "Figure 2: UML component diagram showing React client components, Express API routes, middleware, services, models, MongoDB, and OpenAI integration."),
        ("UML Structural Diagram - Package Diagram", diagrams["package"], "Figure 3: UML package diagram showing frontend, backend, model, service, dataset, and deployment packages."),
        ("UML Structural Diagram - Deployment Diagram", diagrams["deployment"], "Figure 4: UML deployment diagram for browser, frontend host/container, backend server, MongoDB, and external services."),
        ("UML Structural Diagram - Class Diagram", diagrams["class"], "Figure 5: UML class diagram for SmartHire persistent models and evaluation result/service structures."),
        ("UML Behaviour Diagram - Activity Diagram", diagrams["activity"], "Figure 6: UML activity diagram for authentication, practice/mock configuration, answer evaluation, saving, and dashboard review."),
        ("UML Interaction Diagram - Sequence Diagram", diagrams["sequence"], "Figure 7: UML sequence diagram for mock answer evaluation from candidate input to feedback display."),
        ("UML Interaction Diagram - Collaboration Diagram", diagrams["collaboration"], "Figure 8: UML collaboration diagram showing object links and numbered messages for saving and reviewing sessions."),
    ]
    for heading, image_path, caption in entries:
        doc.heading(heading, 1, page_break=True)
        doc.image(image_path, caption)
    doc.save(OUT_DOCX)


def main():
    diagrams = {
        "block": block_diagram(),
        "component": component_diagram(),
        "package": package_diagram(),
        "deployment": deployment_diagram(),
        "class": class_diagram(),
        "activity": activity_diagram(),
        "sequence": sequence_diagram(),
        "collaboration": collaboration_diagram(),
    }
    build_doc(diagrams)
    print(OUT_DOCX)
    print(OUT_DOCX.stat().st_size)
    for path in diagrams.values():
        print(path)


if __name__ == "__main__":
    main()
