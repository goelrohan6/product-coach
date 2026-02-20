import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const authConfigTable = sqliteTable("auth_config", {
  id: text("id").primaryKey(),
  passcodeHash: text("passcode_hash").notNull(),
  passcodeSalt: text("passcode_salt").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull()
});

export const authSessionsTable = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull()
});

export const liteLlmConfigTable = sqliteTable("litellm_config", {
  id: text("id").primaryKey(),
  baseUrl: text("base_url").notNull(),
  model: text("model").notNull(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  iv: text("iv").notNull(),
  tag: text("tag").notNull(),
  enableRedaction: integer("enable_redaction", { mode: "boolean" }).notNull(),
  updatedAt: integer("updated_at").notNull()
});

export const caseSessionsTable = sqliteTable("case_sessions", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  week: integer("week").notNull(),
  status: text("status").notNull(),
  startedAt: integer("started_at").notNull(),
  completedAt: integer("completed_at"),
  lastUserResponse: text("last_user_response"),
  evaluationId: text("evaluation_id"),
  turnsJson: text("turns_json").notNull()
});

export const evaluationsTable = sqliteTable("evaluations", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  caseId: text("case_id").notNull(),
  normalizedScore: real("normalized_score").notNull(),
  rubricJson: text("rubric_json").notNull(),
  panelJson: text("panel_json").notNull(),
  strengthsJson: text("strengths_json").notNull(),
  blindSpotsJson: text("blind_spots_json").notNull(),
  missingEvidenceJson: text("missing_evidence_json").notNull(),
  betterDecisionMemo: text("better_decision_memo").notNull(),
  weaknessSignalsJson: text("weakness_signals_json").notNull(),
  createdAt: integer("created_at").notNull()
});

export const progressTable = sqliteTable("progress", {
  id: text("id").primaryKey(),
  xp: integer("xp").notNull(),
  level: integer("level").notNull(),
  streakDays: integer("streak_days").notNull(),
  lastActivityDate: text("last_activity_date")
});

export const caseCompletionsTable = sqliteTable("case_completions", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  week: integer("week").notNull(),
  score: real("score").notNull(),
  xpAwarded: integer("xp_awarded").notNull(),
  completedAt: integer("completed_at").notNull()
});

export const weaknessHistoryTable = sqliteTable("weakness_history", {
  id: text("id").primaryKey(),
  axis: text("axis").notNull(),
  signal: real("signal").notNull(),
  createdAt: integer("created_at").notNull()
});
