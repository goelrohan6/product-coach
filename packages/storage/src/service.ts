import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import {
  getAllCases,
  getCaseById,
  getCurriculum,
  recommendCaseId
} from "@coach/case-library";
import {
  CaseMessageResponseSchema,
  CaseSessionSchema,
  CompletedSessionsResponseSchema,
  CurriculumResponseSchema,
  EvaluateCaseResponseSchema,
  EvaluationDetailResponseSchema,
  LiteLLMConfigRequestSchema,
  ProgressSnapshotSchema,
  ProgressSummaryResponseSchema,
  RUBRIC_AXES,
  StartCaseRequestSchema,
  StartCaseResponseSchema,
  UnlockResponseSchema,
  WeaknessesResponseSchema,
  type CaseMessageRequest,
  type CaseSession,
  type CompletedSessionSummary,
  type EvaluateCaseRequest,
  type EvaluationResult,
  type LiteLLMConfigRequest,
  type ProgressSnapshot,
  type RubricAxis,
  type WeaknessSignal,
  type WeekProgress
} from "@coach/core-types";
import { evaluateDecision, type LiteLLMRuntimeConfig } from "@coach/scoring-engine";
import { decryptApiKey, encryptApiKey, generateSessionToken, hashPasscode, hashToken, verifyPasscode } from "./crypto.js";
import { getDatabase } from "./db.js";
import {
  authConfigTable,
  authSessionsTable,
  caseCompletionsTable,
  caseSessionsTable,
  evaluationsTable,
  liteLlmConfigTable,
  progressTable,
  weaknessHistoryTable
} from "./schema.js";

const AUTH_CONFIG_ID = "default";
const LITELLM_CONFIG_ID = "default";
const PROGRESS_ID = "default";
const PASSCODELESS_ENCRYPTION_SEED = "coach-local-passcodeless-mode";

const WEEKLY_UNLOCK_THRESHOLD = 3;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function toIso(timestampMs: number): string {
  return new Date(timestampMs).toISOString();
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUtcDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function parseTurns(turnsJson: string): CaseSession["turns"] {
  try {
    const parsed = JSON.parse(turnsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildSessionFromRow(row: {
  id: string;
  caseId: string;
  week: number;
  status: string;
  startedAt: number;
  completedAt: number | null;
  lastUserResponse: string | null;
  evaluationId: string | null;
  turnsJson: string;
}): CaseSession {
  return CaseSessionSchema.parse({
    id: row.id,
    caseId: row.caseId,
    week: row.week,
    startedAt: toIso(row.startedAt),
    completedAt: row.completedAt ? toIso(row.completedAt) : null,
    status: row.status,
    turns: parseTurns(row.turnsJson),
    lastUserResponse: row.lastUserResponse,
    evaluationId: row.evaluationId
  });
}

function recommendationForAxis(axis: RubricAxis): string {
  const map: Record<RubricAxis, string> = {
    problemFraming: "Use a one-page framing structure: context, tension, options, recommendation, and explicit non-goals.",
    customerUnderstanding: "Add segment-level evidence from buyer, admin, and end-user perspectives before committing roadmap resources.",
    businessEconomics: "Quantify margin, retention, and expansion implications for each option with guardrail thresholds.",
    metricsExperimentation: "Define baseline, target, and kill criteria for all major hypotheses.",
    strategicCoherence: "Write explicit tradeoffs and explain why the chosen path is durable over a 12-18 month horizon.",
    riskHandling: "List top failure modes with owner, trigger signal, and mitigation plan.",
    executionRealism: "Convert strategy into phased rollout with 30/60/90-day milestones and named owners.",
    communicationClarity: "Improve memo structure using concise headings and decision-first writing."
  };

  return map[axis];
}

export class CoachService {
  private static singleton: CoachService | null = null;

  static instance(): CoachService {
    if (!CoachService.singleton) {
      CoachService.singleton = new CoachService();
    }

    return CoachService.singleton;
  }

  private db = getDatabase().db;
  private sqlite = getDatabase().sqlite;

  private constructor() {
    this.ensureProgressSeed();
    this.cleanupExpiredSessions();
  }

  private ensureProgressSeed(): void {
    const existing = this.db.select().from(progressTable).where(eq(progressTable.id, PROGRESS_ID)).get();

    if (!existing) {
      this.db.insert(progressTable).values({
        id: PROGRESS_ID,
        xp: 0,
        level: 1,
        streakDays: 0,
        lastActivityDate: null
      }).run();
    }
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now();
    this.sqlite.prepare("DELETE FROM auth_sessions WHERE expires_at <= ?").run(now);
  }

  private requireToken(_token: string | null | undefined): void {
    // Passcode/session checks are intentionally disabled for local single-user mode.
  }

  private getAuthConfig(): { passcodeHash: string; passcodeSalt: string } | null {
    const row = this.db.select().from(authConfigTable).where(eq(authConfigTable.id, AUTH_CONFIG_ID)).get();
    if (!row) {
      return null;
    }

    return {
      passcodeHash: row.passcodeHash,
      passcodeSalt: row.passcodeSalt
    };
  }

  private apiKeyEncryptionHash(): string {
    return this.getAuthConfig()?.passcodeHash ?? hashToken(PASSCODELESS_ENCRYPTION_SEED);
  }

  private getLiteLLMConfigFromEnvOrNull(): LiteLLMRuntimeConfig | null {
    const baseUrl = process.env.LITELLM_BASE_URL?.trim();
    const apiKey = process.env.LITELLM_API_KEY?.trim();
    const model = process.env.LITELLM_MODEL?.trim();
    const hasAny = Boolean(baseUrl || apiKey || model);

    if (!hasAny) {
      return null;
    }

    if (!baseUrl || !apiKey || !model) {
      throw new Error(
        "Incomplete LiteLLM env config. Set LITELLM_BASE_URL, LITELLM_API_KEY, and LITELLM_MODEL."
      );
    }

    const parsed = LiteLLMConfigRequestSchema.parse({
      baseUrl,
      apiKey,
      model,
      enableRedaction: true
    });

    return {
      baseUrl: parsed.baseUrl,
      apiKey: parsed.apiKey,
      model: parsed.model,
      enableRedaction: parsed.enableRedaction
    };
  }

  private getLiteLLMConfigOrNull(): LiteLLMRuntimeConfig | null {
    const envConfig = this.getLiteLLMConfigFromEnvOrNull();
    if (envConfig) {
      return envConfig;
    }

    const row = this.db.select().from(liteLlmConfigTable).where(eq(liteLlmConfigTable.id, LITELLM_CONFIG_ID)).get();

    if (!row) {
      return null;
    }

    try {
      const apiKey = decryptApiKey(
        {
          encrypted: row.encryptedApiKey,
          iv: row.iv,
          tag: row.tag
        },
        this.apiKeyEncryptionHash()
      );

      return {
        baseUrl: row.baseUrl,
        apiKey,
        model: row.model,
        enableRedaction: row.enableRedaction
      };
    } catch {
      return null;
    }
  }

  private redactIfEnabled(input: string, enabled: boolean): string {
    if (!enabled) {
      return input;
    }

    return input
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
      .replace(/\b\d{6,}\b/g, "[REDACTED_NUMBER]");
  }

  private async generateCoachReply(
    message: string,
    session: CaseSession,
    timedMode?: boolean
  ): Promise<{ coachReply: string; interrupt: string | null }> {
    const scenario = getCaseById(session.caseId);
    const config = this.getLiteLLMConfigOrNull();
    const interruptPool = [
      "CFO asks: What leading indicators prove this will improve margin in one quarter?",
      "VP Sales asks: Which segment gets priority and what do we tell reps this week?",
      "VP CS asks: How do we de-risk onboarding failure in the first 30 days?",
      "Board observer asks: What option did you reject and why?"
    ];

    const interrupt = timedMode
      ? interruptPool[Math.floor(Math.random() * interruptPool.length)]
      : null;

    if (config) {
      try {
        const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.3,
            messages: [
              {
                role: "system",
                content:
                  "You are an executive product coach. Give direct, rigorous feedback. Keep reply under 150 words. Ask one high-leverage follow-up question."
              },
              {
                role: "user",
                content: this.redactIfEnabled(
                  JSON.stringify({
                    caseTitle: scenario.title,
                    company: scenario.company,
                    decisionPrompt: scenario.decisionPrompt,
                    userMessage: message,
                    priorTurns: session.turns.slice(-4)
                  }),
                  config.enableRedaction ?? true
                )
              }
            ]
          })
        });

        if (response.ok) {
          const payload = await response.json();
          const content = payload?.choices?.[0]?.message?.content;

          if (typeof content === "string" && content.trim().length > 0) {
            return {
              coachReply: interrupt ? `${content.trim()}\n\nStakeholder interrupt: ${interrupt}` : content.trim(),
              interrupt
            };
          }
        }
      } catch {
        // Fallback to deterministic guidance below.
      }
    }

    const lower = message.toLowerCase();
    const nudges: string[] = [];

    if (!lower.includes("segment") && !lower.includes("icp")) {
      nudges.push("Name your exact ICP and who you are deprioritizing.");
    }
    if (!lower.includes("metric") && !lower.includes("kpi") && !/\d+\s?%/.test(lower)) {
      nudges.push("Add baseline, target, and kill metric.");
    }
    if (!lower.includes("risk")) {
      nudges.push("Define one critical failure mode and mitigation owner.");
    }
    if (!lower.includes("price") && !lower.includes("tier") && !lower.includes("margin")) {
      nudges.push("State pricing/packaging implication and margin effect.");
    }

    const base = nudges.length > 0
      ? `Strong direction. Tighten your memo on: ${nudges.join(" ")}`
      : "Decision quality is improving. Now sharpen tradeoffs with explicit rejected options and success thresholds.";

    const followUp = "What evidence in the next 30 days would force you to reverse this decision?";
    const coachReply = interrupt
      ? `${base}\n\nStakeholder interrupt: ${interrupt}\n\nFollow-up: ${followUp}`
      : `${base}\n\nFollow-up: ${followUp}`;

    return { coachReply, interrupt };
  }

  private loadSessionRow(sessionId: string) {
    const row = this.db
      .select()
      .from(caseSessionsTable)
      .where(eq(caseSessionsTable.id, sessionId))
      .get();

    if (!row) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return row;
  }

  private completedCaseIds(): Set<string> {
    const rows = this.sqlite
      .prepare("SELECT DISTINCT case_id as caseId FROM case_completions")
      .all() as Array<{ caseId: string }>;

    return new Set(rows.map((row) => row.caseId));
  }

  private weekCompletionCounts(): Map<number, number> {
    const rows = this.sqlite
      .prepare(
        "SELECT week, COUNT(DISTINCT case_id) as count FROM case_completions GROUP BY week ORDER BY week ASC"
      )
      .all() as Array<{ week: number; count: number }>;

    const result = new Map<number, number>();
    for (const row of rows) {
      result.set(row.week, row.count);
    }

    return result;
  }

  private buildWeekProgress(completedCaseIds: Set<string>): WeekProgress[] {
    const counts = this.weekCompletionCounts();

    const weeks: WeekProgress[] = [];
    for (let week = 1; week <= 12; week += 1) {
      const completedCases = counts.get(week) ?? 0;
      const boss = getAllCases().find((candidate) => candidate.week === week && candidate.caseType === "boss");
      const bossCompleted = boss ? completedCaseIds.has(boss.id) : false;

      weeks.push({
        week,
        completedCases,
        requiredToUnlockBoss: WEEKLY_UNLOCK_THRESHOLD,
        bossUnlocked: completedCases >= WEEKLY_UNLOCK_THRESHOLD,
        bossCompleted
      });
    }

    return weeks;
  }

  private bossUnlockedForWeek(week: number): boolean {
    const counts = this.weekCompletionCounts();
    const completed = counts.get(week) ?? 0;
    return completed >= WEEKLY_UNLOCK_THRESHOLD;
  }

  private isCaseStartable(caseId: string): boolean {
    const scenario = getCaseById(caseId);
    if (scenario.caseType !== "boss") {
      return true;
    }

    return this.bossUnlockedForWeek(scenario.week);
  }

  private calculateXpAward(caseId: string, score: number): number {
    const scenario = getCaseById(caseId);
    const priorAttempts = this.sqlite
      .prepare("SELECT COUNT(*) as count FROM case_completions WHERE case_id = ?")
      .get(caseId) as { count: number };

    const base = 100;
    const typeBonus = scenario.caseType === "boss" ? 60 : scenario.caseType === "deep-dive" ? 30 : 0;
    const scoreBonus = Math.round(score);
    const firstAttemptMultiplier = priorAttempts.count === 0 ? 1 : 0.5;

    return Math.round((base + typeBonus + scoreBonus) * firstAttemptMultiplier);
  }

  private updateProgressForCompletion(xpAwarded: number): void {
    const row = this.db.select().from(progressTable).where(eq(progressTable.id, PROGRESS_ID)).get();

    if (!row) {
      this.ensureProgressSeed();
      return this.updateProgressForCompletion(xpAwarded);
    }

    const today = todayUtcDate();
    const yesterday = yesterdayUtcDate();

    let nextStreak = row.streakDays;
    if (!row.lastActivityDate) {
      nextStreak = 1;
    } else if (row.lastActivityDate === today) {
      nextStreak = row.streakDays;
    } else if (row.lastActivityDate === yesterday) {
      nextStreak = row.streakDays + 1;
    } else {
      nextStreak = 1;
    }

    const nextXp = row.xp + xpAwarded;
    const nextLevel = Math.floor(nextXp / 400) + 1;

    this.db
      .update(progressTable)
      .set({
        xp: nextXp,
        level: nextLevel,
        streakDays: nextStreak,
        lastActivityDate: today
      })
      .where(eq(progressTable.id, PROGRESS_ID))
      .run();
  }

  private skillTreeFromEvaluations(): Array<{ skill: string; mastery: number }> {
    const rows = this.db.select().from(evaluationsTable).orderBy(desc(evaluationsTable.createdAt)).all();

    if (rows.length === 0) {
      return [
        { skill: "Strategy", mastery: 10 },
        { skill: "Customer Insight", mastery: 10 },
        { skill: "Economics", mastery: 10 },
        { skill: "Metrics", mastery: 10 },
        { skill: "Execution", mastery: 10 },
        { skill: "Communication", mastery: 10 }
      ];
    }

    const rubricRows = rows.map((row) => JSON.parse(row.rubricJson) as Record<RubricAxis, number>);

    const avg = (axes: RubricAxis[]): number => {
      let total = 0;
      let count = 0;
      for (const rubric of rubricRows) {
        for (const axis of axes) {
          total += rubric[axis] ?? 0;
          count += 1;
        }
      }

      return count > 0 ? total / count : 0;
    };

    const nodes = [
      { skill: "Strategy", mastery: Math.round((avg(["problemFraming", "strategicCoherence"]) / 5) * 100) },
      { skill: "Customer Insight", mastery: Math.round((avg(["customerUnderstanding"]) / 5) * 100) },
      { skill: "Economics", mastery: Math.round((avg(["businessEconomics"]) / 5) * 100) },
      { skill: "Metrics", mastery: Math.round((avg(["metricsExperimentation"]) / 5) * 100) },
      { skill: "Execution", mastery: Math.round((avg(["executionRealism", "riskHandling"]) / 5) * 100) },
      { skill: "Communication", mastery: Math.round((avg(["communicationClarity"]) / 5) * 100) }
    ];

    return nodes.map((node) => ({
      ...node,
      mastery: Math.max(0, Math.min(100, node.mastery))
    }));
  }

  private recentScores(): Array<{ caseId: string; score: number }> {
    const rows = this.sqlite
      .prepare(
        "SELECT case_id as caseId, score FROM case_completions ORDER BY completed_at DESC LIMIT 20"
      )
      .all() as Array<{ caseId: string; score: number }>;

    return rows.map((row) => ({
      caseId: row.caseId,
      score: row.score
    }));
  }

  private averageScore(): number {
    const row = this.sqlite
      .prepare("SELECT AVG(normalized_score) as avgScore FROM evaluations")
      .get() as { avgScore: number | null };

    return row.avgScore ? Math.round(row.avgScore * 10) / 10 : 0;
  }

  private buildProgressSnapshot(): ProgressSnapshot {
    this.ensureProgressSeed();

    const progress = this.db.select().from(progressTable).where(eq(progressTable.id, PROGRESS_ID)).get();
    if (!progress) {
      throw new Error("Progress seed row missing");
    }

    const completedIds = this.completedCaseIds();
    const weekProgress = this.buildWeekProgress(completedIds);
    const bossIds = getAllCases().filter((candidate) => candidate.caseType === "boss").map((c) => c.id);
    const bossCasesCompleted = bossIds.filter((caseId) => completedIds.has(caseId)).length;

    const snapshot: ProgressSnapshot = {
      xp: progress.xp,
      level: progress.level,
      streakDays: progress.streakDays,
      casesCompleted: completedIds.size,
      bossCasesCompleted,
      averageScore: this.averageScore(),
      weekProgress,
      skillTree: this.skillTreeFromEvaluations(),
      recentScores: this.recentScores()
    };

    return ProgressSnapshotSchema.parse(snapshot);
  }

  private currentWeaknessSignals(limit = 5): WeaknessSignal[] {
    const rows = this.sqlite
      .prepare(
        "SELECT axis, AVG(signal) as averageSignal FROM weakness_history GROUP BY axis ORDER BY averageSignal DESC"
      )
      .all() as Array<{ axis: string; averageSignal: number }>;

    const normalized = rows
      .filter((row) => RUBRIC_AXES.includes(row.axis as RubricAxis))
      .map((row) => ({
        axis: row.axis as RubricAxis,
        averageSignal: Math.round((row.averageSignal ?? 0) * 100) / 100,
        recommendation: recommendationForAxis(row.axis as RubricAxis)
      }));

    if (normalized.length > 0) {
      return normalized.slice(0, limit);
    }

    return RUBRIC_AXES.slice(0, limit).map((axis) => ({
      axis,
      averageSignal: 0.5,
      recommendation: recommendationForAxis(axis)
    }));
  }

  async unlock(passcode: string): Promise<{ unlocked: boolean; token?: string }> {
    const now = Date.now();
    const existing = this.getAuthConfig();

    if (!existing) {
      const hashed = hashPasscode(passcode);
      this.db
        .insert(authConfigTable)
        .values({
          id: AUTH_CONFIG_ID,
          passcodeHash: hashed.hash,
          passcodeSalt: hashed.salt,
          createdAt: now,
          updatedAt: now
        })
        .run();
    } else {
      const valid = verifyPasscode(passcode, existing.passcodeHash, existing.passcodeSalt);
      if (!valid) {
        return UnlockResponseSchema.parse({ unlocked: false });
      }
    }

    const { token, tokenHash } = generateSessionToken();
    this.db
      .insert(authSessionsTable)
      .values({
        tokenHash,
        createdAt: now,
        expiresAt: now + SESSION_TTL_MS
      })
      .run();

    return {
      ...UnlockResponseSchema.parse({ unlocked: true }),
      token
    };
  }

  async saveLiteLLMConfig(token: string, payload: LiteLLMConfigRequest): Promise<{ saved: boolean }> {
    this.requireToken(token);
    const parsed = LiteLLMConfigRequestSchema.parse(payload);
    const encrypted = encryptApiKey(parsed.apiKey, this.apiKeyEncryptionHash());

    this.db
      .insert(liteLlmConfigTable)
      .values({
        id: LITELLM_CONFIG_ID,
        baseUrl: parsed.baseUrl,
        model: parsed.model,
        encryptedApiKey: encrypted.encrypted,
        iv: encrypted.iv,
        tag: encrypted.tag,
        enableRedaction: parsed.enableRedaction,
        updatedAt: Date.now()
      })
      .onConflictDoUpdate({
        target: liteLlmConfigTable.id,
        set: {
          baseUrl: parsed.baseUrl,
          model: parsed.model,
          encryptedApiKey: encrypted.encrypted,
          iv: encrypted.iv,
          tag: encrypted.tag,
          enableRedaction: parsed.enableRedaction,
          updatedAt: Date.now()
        }
      })
      .run();

    return { saved: true };
  }

  async getCurriculum(token: string): Promise<{ weeks: ReturnType<typeof getCurriculum> }> {
    this.requireToken(token);
    return CurriculumResponseSchema.parse({ weeks: getCurriculum() });
  }

  async startCase(token: string, request: { caseId?: string }) {
    this.requireToken(token);
    const parsed = StartCaseRequestSchema.parse(request);

    const completedIds = this.completedCaseIds();
    const weaknessAxes = this.currentWeaknessSignals(3)
      .filter((entry) => entry.averageSignal >= 0.45)
      .map((entry) => entry.axis);

    const suggestedCaseId = recommendCaseId(completedIds, weaknessAxes).caseId;
    const resolvedCaseId = parsed.caseId ?? suggestedCaseId;
    let scenario = getCaseById(resolvedCaseId);

    if (scenario.caseType === "boss" && !this.bossUnlockedForWeek(scenario.week)) {
      if (parsed.caseId) {
        throw new Error(
          `Boss case locked for week ${scenario.week}. Complete at least ${WEEKLY_UNLOCK_THRESHOLD} cases in that week first.`
        );
      }

      const fallback = getAllCases().find(
        (candidate) => !completedIds.has(candidate.id) && this.isCaseStartable(candidate.id)
      );

      if (!fallback) {
        throw new Error("No startable case is available. Complete more standard cases first.");
      }

      scenario = fallback;
    }

    const now = Date.now();
    const sessionId = randomUUID();
    const turns = [
      {
        role: "system",
        content: `Case kickoff: ${scenario.title}. ${scenario.decisionPrompt}`,
        timestamp: new Date(now).toISOString()
      }
    ];

    this.db
      .insert(caseSessionsTable)
      .values({
        id: sessionId,
        caseId: scenario.id,
        week: scenario.week,
        status: "active",
        startedAt: now,
        completedAt: null,
        lastUserResponse: null,
        evaluationId: null,
        turnsJson: JSON.stringify(turns)
      })
      .run();

    const row = this.loadSessionRow(sessionId);
    return StartCaseResponseSchema.parse({
      session: buildSessionFromRow(row),
      scenario
    });
  }

  async messageCase(token: string, request: CaseMessageRequest) {
    this.requireToken(token);

    const row = this.loadSessionRow(request.sessionId);
    if (row.status !== "active") {
      throw new Error("Cannot message a completed session.");
    }

    const session = buildSessionFromRow(row);
    const turns = [...session.turns];
    const userTurn = {
      role: "user" as const,
      content: request.message,
      timestamp: new Date().toISOString()
    };
    turns.push(userTurn);

    const generated = await this.generateCoachReply(request.message, session, request.timedMode);

    turns.push({
      role: "coach",
      content: generated.coachReply,
      timestamp: new Date().toISOString()
    });

    this.db
      .update(caseSessionsTable)
      .set({
        turnsJson: JSON.stringify(turns),
        lastUserResponse: request.message
      })
      .where(eq(caseSessionsTable.id, request.sessionId))
      .run();

    const updated = buildSessionFromRow(this.loadSessionRow(request.sessionId));

    return CaseMessageResponseSchema.parse({
      session: updated,
      coachReply: generated.coachReply,
      interrupt: generated.interrupt
    });
  }

  private loadEvaluationById(evaluationId: string): EvaluationResult {
    const row = this.db.select().from(evaluationsTable).where(eq(evaluationsTable.id, evaluationId)).get();
    if (!row) {
      throw new Error(`Evaluation not found: ${evaluationId}`);
    }

    return {
      id: row.id,
      sessionId: row.sessionId,
      caseId: row.caseId,
      normalizedScore: row.normalizedScore,
      rubric: JSON.parse(row.rubricJson),
      panelFeedback: JSON.parse(row.panelJson),
      strengths: JSON.parse(row.strengthsJson),
      blindSpots: JSON.parse(row.blindSpotsJson),
      missingEvidence: JSON.parse(row.missingEvidenceJson),
      betterDecisionMemo: row.betterDecisionMemo,
      weaknessSignals: JSON.parse(row.weaknessSignalsJson),
      createdAt: toIso(row.createdAt)
    };
  }

  async evaluateCase(token: string, request: EvaluateCaseRequest) {
    this.requireToken(token);

    const row = this.loadSessionRow(request.sessionId);

    if (row.status === "evaluated" && row.evaluationId) {
      const prior = this.loadEvaluationById(row.evaluationId);
      const progress = this.buildProgressSnapshot();
      return EvaluateCaseResponseSchema.parse({ evaluation: prior, progress });
    }

    const session = buildSessionFromRow(row);
    const scenario = getCaseById(session.caseId);
    const transcript = session.turns.map((turn) => `${turn.role}: ${turn.content}`);
    const llmConfig = this.getLiteLLMConfigOrNull() ?? undefined;

    const evaluation = await evaluateDecision({
      sessionId: session.id,
      caseScenario: scenario,
      transcript,
      finalMemo: request.finalMemo,
      llmConfig
    });

    const now = Date.now();

    this.db
      .insert(evaluationsTable)
      .values({
        id: evaluation.id,
        sessionId: evaluation.sessionId,
        caseId: evaluation.caseId,
        normalizedScore: evaluation.normalizedScore,
        rubricJson: JSON.stringify(evaluation.rubric),
        panelJson: JSON.stringify(evaluation.panelFeedback),
        strengthsJson: JSON.stringify(evaluation.strengths),
        blindSpotsJson: JSON.stringify(evaluation.blindSpots),
        missingEvidenceJson: JSON.stringify(evaluation.missingEvidence),
        betterDecisionMemo: evaluation.betterDecisionMemo,
        weaknessSignalsJson: JSON.stringify(evaluation.weaknessSignals),
        createdAt: now
      })
      .run();

    this.db
      .update(caseSessionsTable)
      .set({
        status: "evaluated",
        completedAt: now,
        evaluationId: evaluation.id,
        lastUserResponse: request.finalMemo,
        turnsJson: JSON.stringify([
          ...session.turns,
          {
            role: "user",
            content: request.finalMemo,
            timestamp: new Date(now).toISOString()
          }
        ])
      })
      .where(eq(caseSessionsTable.id, session.id))
      .run();

    const xpAwarded = this.calculateXpAward(scenario.id, evaluation.normalizedScore);
    this.db
      .insert(caseCompletionsTable)
      .values({
        id: randomUUID(),
        caseId: scenario.id,
        week: scenario.week,
        score: evaluation.normalizedScore,
        xpAwarded,
        completedAt: now
      })
      .run();

    for (const signal of evaluation.weaknessSignals) {
      this.db
        .insert(weaknessHistoryTable)
        .values({
          id: randomUUID(),
          axis: signal.axis,
          signal: signal.signal,
          createdAt: now
        })
        .run();
    }

    this.updateProgressForCompletion(xpAwarded);
    const progress = this.buildProgressSnapshot();

    return EvaluateCaseResponseSchema.parse({
      evaluation,
      progress
    });
  }

  async getProgress(token: string) {
    this.requireToken(token);
    return ProgressSummaryResponseSchema.parse({ progress: this.buildProgressSnapshot() });
  }

  async getWeaknesses(token: string) {
    this.requireToken(token);
    const weaknesses = this.currentWeaknessSignals();
    return WeaknessesResponseSchema.parse({ weaknesses });
  }

  async getActiveSession(_token: string): Promise<{ session: CaseSession; scenario: ReturnType<typeof getCaseById> } | null> {
    const row = this.db
      .select()
      .from(caseSessionsTable)
      .where(eq(caseSessionsTable.status, "active"))
      .orderBy(desc(caseSessionsTable.startedAt))
      .limit(1)
      .get();

    if (!row) {
      return null;
    }

    const session = buildSessionFromRow(row);
    const scenario = getCaseById(session.caseId);

    return { session, scenario };
  }

  async getCompletedSessions(_token: string) {
    const rows = this.sqlite
      .prepare(
        `SELECT cs.id as sessionId, cs.case_id as caseId, cs.week, cs.completed_at as completedAt,
                cs.evaluation_id as evaluationId, e.normalized_score as score
         FROM case_sessions cs
         JOIN evaluations e ON e.id = cs.evaluation_id
         WHERE cs.status = 'evaluated'
         ORDER BY cs.completed_at DESC
         LIMIT 50`
      )
      .all() as Array<{
        sessionId: string;
        caseId: string;
        week: number;
        completedAt: number;
        evaluationId: string;
        score: number;
      }>;

    const sessions: CompletedSessionSummary[] = rows.map((row) => {
      const scenario = getCaseById(row.caseId);
      return {
        sessionId: row.sessionId,
        caseId: row.caseId,
        week: row.week,
        completedAt: toIso(row.completedAt),
        score: row.score,
        caseTitle: scenario.title,
        company: scenario.company,
        evaluationId: row.evaluationId
      };
    });

    return CompletedSessionsResponseSchema.parse({ sessions });
  }

  async getEvaluation(_token: string, evaluationId: string) {
    const evaluation = this.loadEvaluationById(evaluationId);
    const sessionRow = this.loadSessionRow(evaluation.sessionId);
    const session = buildSessionFromRow(sessionRow);
    const scenario = getCaseById(session.caseId);

    return EvaluationDetailResponseSchema.parse({ evaluation, session, scenario });
  }

  async recommendNextCase(token: string): Promise<{ caseId: string; reason: string }> {
    this.requireToken(token);

    const completed = this.completedCaseIds();
    const weaknessAxes = this.currentWeaknessSignals(3)
      .filter((entry) => entry.averageSignal >= 0.45)
      .map((entry) => entry.axis);
    const recommendation = recommendCaseId(completed, weaknessAxes);

    if (this.isCaseStartable(recommendation.caseId)) {
      return recommendation;
    }

    const fallback = getAllCases().find(
      (candidate) => !completed.has(candidate.id) && this.isCaseStartable(candidate.id)
    );

    if (!fallback) {
      return recommendation;
    }

    return {
      caseId: fallback.id,
      reason: "Recommended next unlocked case while your boss case remains locked."
    };
  }
}
