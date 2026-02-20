import { z } from "zod";

export const RUBRIC_AXES = [
  "problemFraming",
  "customerUnderstanding",
  "businessEconomics",
  "metricsExperimentation",
  "strategicCoherence",
  "riskHandling",
  "executionRealism",
  "communicationClarity"
] as const;

export type RubricAxis = (typeof RUBRIC_AXES)[number];

export const RUBRIC_WEIGHTS: Record<RubricAxis, number> = {
  problemFraming: 0.14,
  customerUnderstanding: 0.12,
  businessEconomics: 0.18,
  metricsExperimentation: 0.12,
  strategicCoherence: 0.18,
  riskHandling: 0.1,
  executionRealism: 0.1,
  communicationClarity: 0.06
};

export const CitationRecordSchema = z.object({
  sourceTitle: z.string().min(1),
  url: z.string().url(),
  sourceType: z.enum([
    "earnings_call",
    "shareholder_letter",
    "official_blog",
    "leadership_interview",
    "postmortem",
    "regulatory_filing",
    "investor_relations",
    "other"
  ]),
  publishedAt: z.string().min(4),
  confidence: z.number().min(0).max(1)
});

export type CitationRecord = z.infer<typeof CitationRecordSchema>;

export const CaseScenarioSchema = z.object({
  id: z.string().min(1),
  week: z.number().int().min(1).max(12),
  sequence: z.number().int().min(1).max(5),
  caseType: z.enum(["standard", "deep-dive", "boss"]),
  title: z.string().min(1),
  company: z.string().min(1),
  year: z.number().int().min(1990).max(2100),
  domain: z.string().min(1),
  topicTags: z.array(z.string().min(1)).min(1),
  difficulty: z.number().int().min(1).max(10),
  scenario: z.string().min(1),
  decisionPrompt: z.string().min(1),
  knowns: z.array(z.string().min(1)).min(1),
  unknowns: z.array(z.string().min(1)).min(1),
  constraints: z.array(z.string().min(1)).min(1),
  actualDecision: z.string().min(1),
  outcome: z.string().min(1),
  counterfactuals: z.array(z.string().min(1)).min(1),
  citations: z.array(CitationRecordSchema).min(1)
});

export type CaseScenario = z.infer<typeof CaseScenarioSchema>;

export const CurriculumWeekSchema = z.object({
  week: z.number().int().min(1).max(12),
  title: z.string().min(1),
  competencyFocus: z.array(z.string().min(1)).min(1),
  cases: z.array(CaseScenarioSchema).length(5)
});

export type CurriculumWeek = z.infer<typeof CurriculumWeekSchema>;

export const CaseSessionTurnSchema = z.object({
  role: z.enum(["system", "user", "coach"]),
  content: z.string().min(1),
  timestamp: z.string().datetime()
});

export type CaseSessionTurn = z.infer<typeof CaseSessionTurnSchema>;

export const CaseSessionSchema = z.object({
  id: z.string().min(1),
  caseId: z.string().min(1),
  week: z.number().int().min(1).max(12),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  status: z.enum(["active", "evaluated"]),
  turns: z.array(CaseSessionTurnSchema),
  lastUserResponse: z.string().nullable(),
  evaluationId: z.string().nullable()
});

export type CaseSession = z.infer<typeof CaseSessionSchema>;

export const PanelPersonaSchema = z.enum(["CPO", "CFO", "VP_SALES", "VP_CS"]);
export type PanelPersona = z.infer<typeof PanelPersonaSchema>;

export const PanelFeedbackSchema = z.object({
  persona: PanelPersonaSchema,
  score: z.number().min(0).max(5),
  verdict: z.string().min(1),
  rationale: z.string().min(1),
  strongestPoint: z.string().min(1),
  biggestGap: z.string().min(1)
});

export type PanelFeedback = z.infer<typeof PanelFeedbackSchema>;

export const EvaluationRubricSchema = z.object({
  problemFraming: z.number().min(0).max(5),
  customerUnderstanding: z.number().min(0).max(5),
  businessEconomics: z.number().min(0).max(5),
  metricsExperimentation: z.number().min(0).max(5),
  strategicCoherence: z.number().min(0).max(5),
  riskHandling: z.number().min(0).max(5),
  executionRealism: z.number().min(0).max(5),
  communicationClarity: z.number().min(0).max(5)
});

export type EvaluationRubric = z.infer<typeof EvaluationRubricSchema>;

export const EvaluationResultSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  caseId: z.string().min(1),
  normalizedScore: z.number().min(0).max(100),
  rubric: EvaluationRubricSchema,
  panelFeedback: z.array(PanelFeedbackSchema).length(4),
  strengths: z.array(z.string().min(1)).min(1),
  blindSpots: z.array(z.string().min(1)).min(1),
  missingEvidence: z.array(z.string().min(1)).min(1),
  betterDecisionMemo: z.string().min(1),
  weaknessSignals: z.array(z.object({ axis: z.enum(RUBRIC_AXES), signal: z.number().min(0).max(1) })),
  createdAt: z.string().datetime()
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export const WeekProgressSchema = z.object({
  week: z.number().int().min(1).max(12),
  completedCases: z.number().int().min(0).max(5),
  requiredToUnlockBoss: z.number().int().min(0).max(4),
  bossUnlocked: z.boolean(),
  bossCompleted: z.boolean()
});

export type WeekProgress = z.infer<typeof WeekProgressSchema>;

export const SkillNodeProgressSchema = z.object({
  skill: z.string().min(1),
  mastery: z.number().int().min(0).max(100)
});

export type SkillNodeProgress = z.infer<typeof SkillNodeProgressSchema>;

export const ProgressSnapshotSchema = z.object({
  xp: z.number().int().min(0),
  level: z.number().int().min(1),
  streakDays: z.number().int().min(0),
  casesCompleted: z.number().int().min(0),
  bossCasesCompleted: z.number().int().min(0),
  averageScore: z.number().min(0).max(100),
  weekProgress: z.array(WeekProgressSchema).length(12),
  skillTree: z.array(SkillNodeProgressSchema).min(1),
  recentScores: z.array(z.object({ caseId: z.string().min(1), score: z.number().min(0).max(100) })).max(20)
});

export type ProgressSnapshot = z.infer<typeof ProgressSnapshotSchema>;

export const WeaknessSignalSchema = z.object({
  axis: z.enum(RUBRIC_AXES),
  averageSignal: z.number().min(0).max(1),
  recommendation: z.string().min(1)
});

export type WeaknessSignal = z.infer<typeof WeaknessSignalSchema>;

export const UnlockRequestSchema = z.object({ passcode: z.string().min(6) });
export const UnlockResponseSchema = z.object({ unlocked: z.boolean() });

export const LiteLLMConfigRequestSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(8),
  model: z.string().min(1),
  enableRedaction: z.boolean().default(true)
});

export const LiteLLMConfigResponseSchema = z.object({ saved: z.boolean() });

export const StartCaseRequestSchema = z.object({
  caseId: z.string().min(1).optional()
});

export const StartCaseResponseSchema = z.object({
  session: CaseSessionSchema,
  scenario: CaseScenarioSchema
});

export const CaseMessageRequestSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
  timedMode: z.boolean().optional()
});

export const CaseMessageResponseSchema = z.object({
  session: CaseSessionSchema,
  coachReply: z.string().min(1),
  interrupt: z.string().nullable()
});

export const EvaluateCaseRequestSchema = z.object({
  sessionId: z.string().min(1),
  finalMemo: z.string().min(20)
});

export const EvaluateCaseResponseSchema = z.object({
  evaluation: EvaluationResultSchema,
  progress: ProgressSnapshotSchema
});

export const CurriculumResponseSchema = z.object({
  weeks: z.array(CurriculumWeekSchema).length(12)
});

export const ProgressSummaryResponseSchema = z.object({
  progress: ProgressSnapshotSchema
});

export const WeaknessesResponseSchema = z.object({
  weaknesses: z.array(WeaknessSignalSchema)
});

export type UnlockRequest = z.infer<typeof UnlockRequestSchema>;
export type UnlockResponse = z.infer<typeof UnlockResponseSchema>;
export type LiteLLMConfigRequest = z.infer<typeof LiteLLMConfigRequestSchema>;
export type LiteLLMConfigResponse = z.infer<typeof LiteLLMConfigResponseSchema>;
export type StartCaseRequest = z.infer<typeof StartCaseRequestSchema>;
export type StartCaseResponse = z.infer<typeof StartCaseResponseSchema>;
export type CaseMessageRequest = z.infer<typeof CaseMessageRequestSchema>;
export type CaseMessageResponse = z.infer<typeof CaseMessageResponseSchema>;
export type EvaluateCaseRequest = z.infer<typeof EvaluateCaseRequestSchema>;
export type EvaluateCaseResponse = z.infer<typeof EvaluateCaseResponseSchema>;
export type CurriculumResponse = z.infer<typeof CurriculumResponseSchema>;
export type ProgressSummaryResponse = z.infer<typeof ProgressSummaryResponseSchema>;
export type WeaknessesResponse = z.infer<typeof WeaknessesResponseSchema>;

export const MCPPayloadSchemas = {
  listProgramInput: z.object({}),
  listProgramOutput: CurriculumResponseSchema,
  startCaseInput: StartCaseRequestSchema,
  startCaseOutput: StartCaseResponseSchema,
  submitResponseInput: CaseMessageRequestSchema,
  submitResponseOutput: CaseMessageResponseSchema,
  getFeedbackInput: EvaluateCaseRequestSchema,
  getFeedbackOutput: EvaluateCaseResponseSchema,
  getProgressInput: z.object({}),
  getProgressOutput: ProgressSummaryResponseSchema,
  recommendNextCaseInput: z.object({}),
  recommendNextCaseOutput: z.object({ caseId: z.string().min(1), reason: z.string().min(1) })
};
