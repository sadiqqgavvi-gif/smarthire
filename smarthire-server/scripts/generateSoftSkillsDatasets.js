import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const BEHAVIORAL_OUTPUT = path.resolve(
  PROJECT_ROOT,
  "topics",
  "en",
  "behavioral",
  "behavioral_questions.md"
);
const SITUATIONAL_OUTPUT = path.resolve(
  PROJECT_ROOT,
  "topics",
  "en",
  "situational",
  "situational_questions.md"
);

const TARGET_COUNT = 1200;

const normalizeKey = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const pushUnique = (store, seen, question) => {
  const clean = String(question || "").trim();
  if (!clean) return false;
  const key = normalizeKey(clean);
  if (!key || seen.has(key)) return false;
  seen.add(key);
  store.push(clean.endsWith("?") ? clean : `${clean}?`);
  return true;
};

const buildBehavioralQuestions = (limit = TARGET_COUNT) => {
  const openers = [
    "Tell me about a time when you",
    "Describe a situation where you",
    "Give an example of when you",
    "Can you share a time when you",
  ];

  const actions = [
    "resolved a conflict between team members",
    "managed a disagreement with a difficult stakeholder",
    "handled negative feedback from a manager",
    "adapted quickly to a major process change",
    "explained a complex technical concept to a non-technical audience",
    "improved a broken team process",
    "took ownership of a mistake and corrected it",
    "prioritized competing deadlines",
    "worked with a teammate who had a very different work style",
    "led a project without formal authority",
    "delivered bad news to a client or customer",
    "recovered a project that was falling behind",
    "de-escalated a tense conversation",
    "motivated a low-morale team",
    "influenced a decision without direct control",
    "learned a new skill under pressure",
    "handled a sudden shift in scope",
    "made a difficult tradeoff with limited information",
    "improved communication across teams",
    "built trust with a skeptical stakeholder",
    "challenged an unclear requirement",
    "managed expectations during uncertainty",
    "balanced speed and quality in delivery",
    "mentored a junior teammate",
    "received critical feedback and turned it into improvement",
    "managed a high-stakes deadline",
    "took initiative beyond your role",
    "reached alignment in a cross-functional team",
    "handled a missed commitment",
    "solved a recurring operational issue",
    "onboarded quickly to a new domain",
    "handled ambiguity in project goals",
    "navigated conflicting priorities from leadership",
    "built consensus on a controversial decision",
    "managed a customer escalation",
    "improved quality in a process with frequent errors",
    "introduced a better way of working",
    "collaborated effectively with a remote team",
    "handled pressure during a production incident",
    "made a decision that was initially unpopular",
    "delivered results with limited resources",
    "resolved miscommunication between teams",
    "supported a teammate who was struggling",
    "rebuilt confidence after a failed attempt",
    "managed a sudden leadership change",
    "handled confidential information responsibly",
    "identified a risk before it became a problem",
    "improved your team's delivery predictability",
    "managed scope creep from stakeholders",
    "worked through uncertainty in product direction",
    "handled feedback from multiple stakeholders with conflicting views",
    "turned around underperformance on a project",
    "set boundaries while still being collaborative",
    "communicated a technical risk to leadership",
    "handled a handoff failure between teams",
    "rebalanced workload to avoid burnout",
    "managed a project dependency outside your control",
    "improved collaboration between engineering and product",
    "handled a disagreement on technical direction",
    "implemented a process that reduced rework",
    "improved team ownership and accountability",
    "managed a project with unclear success criteria",
    "recovered from a communication breakdown",
    "handled a critical bug close to release",
    "coached someone through performance improvement",
    "worked effectively with limited stakeholder availability",
    "managed a tradeoff between customer and business needs",
    "advocated for quality when timelines were tight",
    "protected the team from unnecessary context switching",
    "helped the team learn from a failure",
    "driven alignment after a change in priorities",
    "handled resistance to a new process",
    "adapted your communication for different audiences",
    "navigated unclear ownership across teams",
    "built momentum in a stalled initiative",
    "resolved repeated blockers in delivery",
    "managed workload when several emergencies happened at once",
    "improved transparency in project tracking",
    "earned trust from a new manager or team",
    "responded to an unexpected customer requirement",
    "handled personal bias in decision-making",
    "supported inclusion within your team",
    "managed pressure while maintaining quality",
    "handled a delayed dependency that affected your timeline",
    "improved handoff quality between development and QA",
    "managed an urgent request without derailing planned work",
    "recovered stakeholder trust after a missed milestone",
    "adjusted your plan when assumptions proved wrong",
    "addressed recurring quality issues in production",
    "managed communication during a service outage",
    "handled a situation where requirements were incomplete",
    "worked through conflicting interpretations of success",
    "encouraged constructive disagreement in your team",
    "aligned execution across distributed teams",
    "managed a transition to new tools or systems",
    "ensured accountability in a cross-team effort",
    "handled a last-minute executive request",
    "improved decision-making in ambiguous situations",
  ];

  const contexts = [
    "during a high-pressure deadline",
    "while working with limited resources",
    "when requirements changed unexpectedly",
    "in a cross-functional project",
    "with remote team members across time zones",
    "while managing multiple critical priorities",
    "in a high-visibility project",
    "when senior stakeholders disagreed",
    "while onboarding to a new team",
    "during a period of organizational change",
    "when customer expectations were escalating",
    "while balancing quality and speed",
    "under unclear ownership boundaries",
    "while dependencies were blocked",
    "when project risk was increasing rapidly",
    "while supporting a business-critical release",
    "in a team with mixed experience levels",
    "during a process transition",
    "while delivering against aggressive goals",
    "when communication channels were fragmented",
  ];

  const followUps = [
    "What actions did you take and what was the outcome?",
    "How did you approach it and what did you learn?",
    "What did you prioritize first and why?",
    "How did you communicate with stakeholders and what changed afterward?",
    "What would you do differently if the same situation happened again?",
    "What measurable impact did your approach create?",
    "How did you ensure alignment and follow-through?",
    "How did you evaluate success at the end?",
  ];

  const templates = [
    (opener, action, context, followUp) =>
      `${opener} ${action} ${context}. ${followUp}`,
    (opener, action, context, followUp) =>
      `${opener} ${action} ${context}, and ${followUp[0].toLowerCase()}${followUp.slice(1)}`,
    (opener, action, context, followUp) =>
      `${opener} ${action} ${context}. In that situation, ${followUp[0].toLowerCase()}${followUp.slice(1)}`,
  ];

  const questions = [];
  const seen = new Set();

  for (const opener of openers) {
    for (const action of actions) {
      for (const context of contexts) {
        for (const followUp of followUps) {
          for (const template of templates) {
            if (questions.length >= limit) return questions;
            pushUnique(questions, seen, template(opener, action, context, followUp));
          }
        }
      }
    }
  }

  return questions;
};

const buildSituationalQuestions = (limit = TARGET_COUNT) => {
  const scenarioSubjects = [
    "a critical release is at risk because testing uncovered serious defects",
    "two senior stakeholders are pushing conflicting priorities",
    "a production incident is impacting key customers",
    "project requirements change in the middle of implementation",
    "your team is understaffed and deadlines remain fixed",
    "an important dependency team misses their delivery date",
    "a customer requests a major scope increase late in the cycle",
    "your manager asks for delivery acceleration without extra resources",
    "a key team member is unexpectedly unavailable",
    "a high-priority bug appears right before launch",
    "quality metrics are declining while demand is rising",
    "there is disagreement about the technical approach",
    "leadership changes project direction at short notice",
    "a vendor integration fails close to release",
    "your team receives unclear and incomplete requirements",
    "a risky decision must be made with limited data",
    "stakeholder trust has dropped after a missed milestone",
    "cross-team communication is causing repeated delays",
    "security concerns are raised during final review",
    "your roadmap commitments exceed realistic capacity",
    "a customer escalation reaches executive level",
    "multiple urgent requests arrive at the same time",
    "handoff quality between teams causes recurring issues",
    "a rollback is required after deployment",
    "you inherit a project with no clear documentation",
    "a new compliance requirement affects the current plan",
    "your team must deliver while learning unfamiliar tools",
    "a decision is blocked because stakeholders cannot align",
    "team morale drops after repeated deadline pressure",
    "a critical feature has unclear ownership",
    "you discover hidden technical debt affecting reliability",
    "business goals shift after planning is complete",
    "a high-value customer requests an exception to process",
    "a partner team challenges your delivery assumptions",
    "you must choose between short-term fixes and long-term stability",
    "metrics show poor adoption of a newly delivered feature",
    "release readiness is uncertain and launch pressure is high",
    "important customer feedback conflicts with internal strategy",
    "a cross-functional project is slipping despite frequent meetings",
    "an urgent support issue interrupts planned sprint work",
    "a decision has ethical implications for customers",
    "budget constraints force scope reduction",
    "a migration plan introduces high operational risk",
    "critical monitoring gaps are discovered in production",
    "your team needs to recover after an avoidable incident",
    "a new leader questions the value of your current roadmap",
    "an external deadline is immovable but prerequisites are incomplete",
    "you identify a serious risk that others are downplaying",
    "several stakeholders demand status updates with different expectations",
    "deliverables are blocked by repeated approval delays",
    "your team is asked to take over another team's incomplete work",
    "customer-facing errors increase after a platform change",
    "a major feature cannot be shipped as originally planned",
    "inter-team dependencies create cascading schedule risk",
    "support tickets rise faster than your team can respond",
    "a roadmap item no longer aligns with customer needs",
    "performance problems appear under peak load",
    "you discover conflicting interpretations of success criteria",
    "a pilot rollout reveals major usability problems",
    "a high-visibility presentation is due before data is complete",
    "a key process lacks ownership and accountability",
    "a long-standing issue keeps returning despite prior fixes",
    "stakeholders ask for certainty where uncertainty remains high",
    "you need to decide whether to delay launch for quality",
    "a release dependency introduces legal and compliance concerns",
    "customer contracts require features that are not fully ready",
    "team members disagree on escalation severity",
    "you must coordinate recovery across several teams rapidly",
    "communication to customers must happen before root cause is confirmed",
    "an initiative is losing momentum and executive confidence",
    "new evidence invalidates your current implementation plan",
    "the team needs to cut scope but protect customer value",
    "a service degradation affects your highest-revenue segment",
    "post-release monitoring indicates hidden reliability issues",
    "you are asked to make a recommendation with incomplete tradeoff data",
    "a key deliverable depends on uncertain third-party timelines",
    "the team has to deliver while key assumptions remain unverified",
    "operational costs are rising faster than expected",
    "internal priorities conflict with urgent market demands",
    "a planned launch date conflicts with readiness signals",
    "you need to regain stakeholder alignment after recent setbacks",
  ];

  const constraints = [
    "while budget is constrained",
    "while staffing is limited",
    "while timelines are fixed",
    "while customer impact is increasing",
    "while executive visibility is high",
    "while key dependencies remain uncertain",
    "while compliance requirements are strict",
    "while communication channels are fragmented",
    "while team morale is fragile",
    "while data quality is incomplete",
    "while external vendors are involved",
    "while risk tolerance is low",
    "while competing priorities continue to grow",
    "while expectations are changing rapidly",
    "while root cause is still under investigation",
  ];

  const followUps = [
    "What would you do first, and why?",
    "How would you prioritize your next steps?",
    "Who would you involve, and how would you communicate the plan?",
    "How would you balance short-term containment with long-term prevention?",
    "How would you define success and track progress?",
    "How would you reduce risk while maintaining delivery momentum?",
    "What tradeoffs would you make, and how would you justify them?",
    "How would you align stakeholders on the decision?",
    "How would you protect customer trust during execution?",
    "What would your contingency plan look like?",
  ];

  const templates = [
    (scenario, constraint, followUp) =>
      `How would you handle a situation where ${scenario} ${constraint}? ${followUp}`,
    (scenario, constraint, followUp) =>
      `What would you do if ${scenario} ${constraint}? ${followUp}`,
    (scenario, constraint, followUp) =>
      `If ${scenario} ${constraint}, how would you respond? ${followUp}`,
    (scenario, constraint, followUp) =>
      `How would you approach it if ${scenario} ${constraint}? ${followUp}`,
  ];

  const questions = [];
  const seen = new Set();

  for (const scenario of scenarioSubjects) {
    for (const constraint of constraints) {
      for (const followUp of followUps) {
        for (const template of templates) {
          if (questions.length >= limit) return questions;
          pushUnique(questions, seen, template(scenario, constraint, followUp));
        }
      }
    }
  }

  return questions;
};

const writeDataset = (outputPath, questions) => {
  const content = questions.map((question) => `- ${question}`).join("\n");
  fs.writeFileSync(outputPath, `${content}\n`, "utf-8");
};

const behavioralQuestions = buildBehavioralQuestions(TARGET_COUNT);
const situationalQuestions = buildSituationalQuestions(TARGET_COUNT);

writeDataset(BEHAVIORAL_OUTPUT, behavioralQuestions);
writeDataset(SITUATIONAL_OUTPUT, situationalQuestions);

console.log(`Behavioral questions generated: ${behavioralQuestions.length}`);
console.log(`Situational questions generated: ${situationalQuestions.length}`);
console.log(`Updated: ${BEHAVIORAL_OUTPUT}`);
console.log(`Updated: ${SITUATIONAL_OUTPUT}`);
