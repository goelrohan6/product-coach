"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CaseScenario,
  CaseScenarioChallenge,
  CaseSession,
  CompletedSessionSummary,
  CurriculumWeekChallenge,
  EvaluationDetailResponse,
  EvaluationResult,
  ProgressSnapshot,
  RubricAxis,
  WeaknessSignal
} from "@coach/core-types";
import { fetchJson } from "@/lib/http";
import { Button, Card, Pill, ProgressBar, Tabs } from "@/components/ui";
import { CompanyLabel } from "@/components/company-label";

type StartCaseResponse = {
  session: CaseSession;
  scenario: CaseScenarioChallenge;
};

type MessageResponse = {
  session: CaseSession;
  coachReply: string;
  interrupt: string | null;
};

type EvaluateResponse = {
  evaluation: EvaluationResult;
  progress: ProgressSnapshot;
};

type TabKey = "mission" | "chat" | "debrief" | "history" | "skills" | "streak";
const MIN_MEMO_CHARS = 20;

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "mission", label: "Mission Map" },
  { id: "chat", label: "Challenge Chat" },
  { id: "debrief", label: "Debrief Board" },
  { id: "history", label: "Case History" },
  { id: "skills", label: "Skill Tree" },
  { id: "streak", label: "Streak + XP" }
];

const rubricLabels: Record<RubricAxis, string> = {
  problemFraming: "Problem Framing",
  customerUnderstanding: "Customer Understanding",
  businessEconomics: "Business Economics",
  metricsExperimentation: "Metrics + Experimentation",
  strategicCoherence: "Strategic Coherence",
  riskHandling: "Risk Handling",
  executionRealism: "Execution Realism",
  communicationClarity: "Communication Clarity"
};

function scoreTone(score: number): string {
  if (score >= 80) {
    return "Excellent";
  }
  if (score >= 65) {
    return "Strong";
  }
  if (score >= 50) {
    return "Developing";
  }
  return "Needs Work";
}

function normalizeMissionCardTitle(title: string, company: string): string {
  const prefix = `${company}: `;
  if (title.startsWith(prefix)) {
    return title.slice(prefix.length);
  }

  return title;
}

function SectionIcon({
  kind,
  className
}: {
  kind: "brief" | "chat" | "memo";
  className?: string;
}) {
  if (kind === "brief") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <rect x="4" y="4" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9H16M8 13H16M8 17H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === "memo") {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
        <path d="M6 3.8h8.8L19.6 8.6V20a1.8 1.8 0 0 1-1.8 1.8H6A1.8 1.8 0 0 1 4.2 20V5.6A1.8 1.8 0 0 1 6 3.8Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14.6 3.8V8.2h4.4M8 12.1h8M8 15.7h8M8 19.2h5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M7.7 5.4h8.6a2.3 2.3 0 0 1 2.3 2.3v5a2.3 2.3 0 0 1-2.3 2.3h-5l-3.9 3.6v-3.6H7.7a2.3 2.3 0 0 1-2.3-2.3v-5a2.3 2.3 0 0 1 2.3-2.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ProgressCircle({ completed, total, size = 20 }: { completed: number; total: number; size?: number }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? completed / total : 0;
  const offset = circumference * (1 - progress);
  const color =
    completed >= total
      ? "var(--color-positive)"
      : completed > 0
        ? "var(--color-accent)"
        : "var(--color-border-light)";

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border-light)"
        strokeWidth={strokeWidth}
      />
      {completed > 0 && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      )}
    </svg>
  );
}

function CaseRevealCard({ scenario }: { scenario: CaseScenario }) {
  const brief = scenario.expandedBrief;

  return (
    <Card variant="subtle" padding="md">
      <h3 className="text-[var(--text-lg)] font-semibold">Case Reveal</h3>
      <p className="mt-2 text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">{scenario.title}</p>
      <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        <CompanyLabel company={scenario.company} meta={`(${scenario.year}) • ${scenario.caseType}`} />
      </p>

      <div className="mt-4">
        <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Option Set</p>
        <div className="mt-2 space-y-3">
          {brief.decisionOptions.map((item) => (
            <div key={item.option} className="rounded-[var(--radius-md)] border border-[color:var(--color-border-light)] p-3">
              <p className="text-[var(--text-base)] font-medium text-[var(--color-text-primary)]">{item.option}</p>
              <p className="mt-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">Upside: {item.upside}</p>
              <p className="mt-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">Downside: {item.downside}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
        <strong className="text-[var(--color-text-primary)]">Recommended direction:</strong> {brief.recommendedDirection}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">30/60/90 Plan</p>
          <ul className="mt-2 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
            {brief.executionPlan30_60_90.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Success Metrics</p>
          <ul className="mt-2 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
            {brief.successMetrics.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Risk Register</p>
          <ul className="mt-2 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
            {brief.riskRegister.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Open Questions</p>
          <ul className="mt-2 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
            {brief.openQuestions.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Explicit Non-Goals</p>
        <ul className="mt-2 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
          {brief.nonGoals.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Facts vs Assumptions</p>
        <ul className="mt-2 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
          {brief.factsAndAssumptions.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function WhatActuallyHappenedCard({ scenario }: { scenario: CaseScenario }) {
  const brief = scenario.expandedBrief;

  return (
    <Card variant="subtle" padding="md">
      <h3 className="text-[var(--text-lg)] font-semibold">What Actually Happened</h3>
      <p className="mt-2 text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">{scenario.title}</p>
      <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
        <CompanyLabel company={scenario.company} meta={`(${scenario.year}) • ${scenario.caseType}`} />
      </p>

      <p className="mt-3 text-[var(--text-base)] text-[var(--color-text-secondary)]">
        <strong className="text-[var(--color-text-primary)]">Decision:</strong> {scenario.actualDecision}
      </p>
      <p className="mt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
        <strong className="text-[var(--color-text-primary)]">Outcome:</strong> {scenario.outcome}
      </p>

      <div className="mt-4">
        <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Detailed Notes</p>
        <p className="mt-2 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">{brief.historyToDate}</p>
        <p className="mt-2 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
          {brief.currentOperatingContext}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Knowns</p>
          <ul className="mt-2 space-y-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {scenario.knowns.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Unknowns</p>
          <ul className="mt-2 space-y-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {scenario.unknowns.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Constraints</p>
          <ul className="mt-2 space-y-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            {scenario.constraints.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Counterfactuals</p>
        <ul className="mt-2 space-y-1.5 text-[var(--text-base)] text-[var(--color-text-secondary)]">
          {scenario.counterfactuals.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Facts vs Inferences</p>
        <ul className="mt-2 space-y-1.5 text-[var(--text-base)] text-[var(--color-text-secondary)]">
          {brief.factsAndAssumptions.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">Citations</p>
        <ul className="mt-2 space-y-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">
          {scenario.citations.map((citation) => (
            <li key={`${citation.url}-${citation.sourceTitle}`}>
              •{" "}
              <a href={citation.url} target="_blank" rel="noreferrer" className="text-[var(--color-accent)] underline">
                {citation.sourceTitle}
              </a>{" "}
              ({citation.publishedAt}; confidence {(citation.confidence * 100).toFixed(0)}%)
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function CoachApp() {
  const [error, setError] = useState<string | null>(null);

  const [curriculum, setCurriculum] = useState<CurriculumWeekChallenge[]>([]);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [weaknesses, setWeaknesses] = useState<WeaknessSignal[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("mission");
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [activeSession, setActiveSession] = useState<CaseSession | null>(null);
  const [activeScenario, setActiveScenario] = useState<CaseScenarioChallenge | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [finalMemo, setFinalMemo] = useState("");
  const [timedMode, setTimedMode] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<EvaluationResult | null>(null);
  const [latestDebriefDetail, setLatestDebriefDetail] = useState<EvaluationDetailResponse | null>(null);

  const [historySessions, setHistorySessions] = useState<CompletedSessionSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<EvaluationDetailResponse | null>(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);

  const selectedWeekData = useMemo(
    () => curriculum.find((week) => week.week === selectedWeek) ?? null,
    [curriculum, selectedWeek]
  );
  const selectedWeekProgress = useMemo(
    () => progress?.weekProgress.find((entry) => entry.week === selectedWeek) ?? null,
    [progress, selectedWeek]
  );
  const completedCaseMap = useMemo(() => {
    const map = new Map<string, { score: number; evaluationId: string }>();
    for (const entry of historySessions) {
      const existing = map.get(entry.caseId);
      if (!existing || entry.score > existing.score) {
        map.set(entry.caseId, { score: entry.score, evaluationId: entry.evaluationId });
      }
    }
    return map;
  }, [historySessions]);

  const memoCharacters = finalMemo.trim().length;
  const memoShortBy = Math.max(0, MIN_MEMO_CHARS - memoCharacters);

  async function loadDashboard() {
    try {
      const [curriculumRes, progressRes, weaknessRes, activeRes, historyRes] = await Promise.all([
        fetchJson<{ weeks: CurriculumWeekChallenge[] }>("/api/curriculum"),
        fetchJson<{ progress: ProgressSnapshot }>("/api/progress/summary"),
        fetchJson<{ weaknesses: WeaknessSignal[] }>("/api/progress/weaknesses"),
        fetchJson<{ session: CaseSession | null; scenario: CaseScenarioChallenge | null }>("/api/cases/active"),
        fetchJson<{ sessions: CompletedSessionSummary[] }>("/api/cases/history")
      ]);

      setCurriculum(curriculumRes.weeks);
      setProgress(progressRes.progress);
      setWeaknesses(weaknessRes.weaknesses);
      setHistorySessions(historyRes.sessions);

      if (activeRes.session && activeRes.scenario) {
        setActiveSession(activeRes.session);
        setActiveScenario(activeRes.scenario);
        setActiveTab("chat");
      } else {
        setActiveSession(null);
        setActiveScenario(null);
      }

      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load coach dashboard";
      setError(message);
    }
  }

  useEffect(() => {
    loadDashboard().catch(() => {
      // Errors are handled in loadDashboard.
    });
  }, []);

  async function startCase(caseId?: string) {
    setError(null);
    try {
      const response = await fetchJson<StartCaseResponse>("/api/cases/start", {
        method: "POST",
        body: JSON.stringify(caseId ? { caseId } : {})
      });

      setActiveSession(response.session);
      setActiveScenario(response.scenario);
      setLatestEvaluation(null);
      setLatestDebriefDetail(null);
      setFinalMemo("");
      setActiveTab("chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start case");
    }
  }

  async function sendMessage() {
    if (!activeSession || !chatMessage.trim()) {
      return;
    }

    setChatLoading(true);
    setError(null);

    try {
      const response = await fetchJson<MessageResponse>("/api/cases/message", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSession.id,
          message: chatMessage,
          timedMode
        })
      });

      setActiveSession(response.session);
      setChatMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setChatLoading(false);
    }
  }

  async function evaluateCase() {
    if (!activeSession || finalMemo.trim().length < MIN_MEMO_CHARS) {
      setError(`Final memo must be at least ${MIN_MEMO_CHARS} characters.`);
      return;
    }

    setEvaluationLoading(true);
    setError(null);

    try {
      const response = await fetchJson<EvaluateResponse>("/api/cases/evaluate", {
        method: "POST",
        body: JSON.stringify({
          sessionId: activeSession.id,
          finalMemo
        })
      });

      setLatestEvaluation(response.evaluation);
      try {
        const detail = await fetchJson<EvaluationDetailResponse>(`/api/evaluations/${response.evaluation.id}`);
        setLatestDebriefDetail(detail);
      } catch {
        setLatestDebriefDetail(null);
      }
      setProgress(response.progress);
      setActiveSession(null);
      setActiveScenario(null);
      setActiveTab("debrief");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate case");
    } finally {
      setEvaluationLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const result = await fetchJson<{ sessions: CompletedSessionSummary[] }>("/api/cases/history");
      setHistorySessions(result.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load case history");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadHistoryDetail(evaluationId: string) {
    setHistoryDetailLoading(true);
    setSelectedHistoryDetail(null);
    try {
      const result = await fetchJson<EvaluationDetailResponse>(`/api/evaluations/${evaluationId}`);
      setSelectedHistoryDetail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load evaluation detail");
    } finally {
      setHistoryDetailLoading(false);
    }
  }

  function handleTabSelect(tabId: TabKey) {
    setActiveTab(tabId);
    if (tabId === "history") {
      void loadHistory();
    }
  }

  function viewDebrief(evaluationId: string) {
    void loadHistoryDetail(evaluationId);
    setActiveTab("history");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col gap-6 p-4 pb-12 md:p-10">
      <Card variant="elevated" padding="lg" className="animate-rise overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-16 h-48 w-48 rounded-full bg-[color:rgba(14,122,111,0.14)] blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-[color:rgba(255,123,44,0.14)] blur-2xl" />
        <div className="flex flex-col gap-4">
          <div>
            <p className="coach-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Executive Product Coach
            </p>
            <h1 className="coach-heading text-[34px] leading-[1.05] font-semibold md:text-[44px] md:whitespace-nowrap">
              Build World-Class Product Judgment
            </h1>
            <p className="mt-2 max-w-[56ch] text-[var(--text-lg)] text-[var(--color-text-secondary)]">
              Mixed B2B real-world scenarios, rigorous evaluation, and progression gates.
            </p>
          </div>
          <div className="flex justify-start md:justify-end">
            <div className="flex flex-wrap gap-2 md:flex-nowrap">
              <Pill variant="accent" className="whitespace-nowrap font-medium">
                XP:&nbsp;<span className="font-medium">{progress?.xp ?? 0}</span>
              </Pill>
              <Pill variant="accent" className="whitespace-nowrap font-medium">
                Level:&nbsp;<span className="font-medium">{progress?.level ?? 1}</span>
              </Pill>
              <Pill variant="accent" className="whitespace-nowrap font-medium">
                Streak:&nbsp;<span className="font-medium">{progress?.streakDays ?? 0}d</span>
              </Pill>
            </div>
          </div>
        </div>
      </Card>

      <Tabs options={tabs} activeId={activeTab} onSelect={handleTabSelect} className="w-fit max-w-full" />

      {error && (
        <Card
          variant="subtle"
          padding="sm"
          className="border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)] text-[var(--color-accent-alt)]"
        >
          <p className="text-[var(--text-base)]">{error}</p>
        </Card>
      )}

      {activeTab === "mission" && (
        <div className="animate-rise flex gap-4">
          {/* Sidebar — desktop only */}
          <div className="hidden w-[260px] shrink-0 lg:block">
            <Card variant="default" padding="md" className="sticky top-4">
              <h2 className="coach-heading mb-3 text-[18px] font-semibold leading-none text-[var(--color-text-primary)]">
                Mission Map
              </h2>
              <div className="flex flex-col gap-1">
                {curriculum.map((week) => {
                  const wp = progress?.weekProgress.find((entry) => entry.week === week.week);
                  const selected = selectedWeek === week.week;
                  const bossStatus = wp?.bossUnlocked
                    ? wp.bossCompleted
                      ? "Done"
                      : "Open"
                    : null;

                  return (
                    <button
                      type="button"
                      key={week.week}
                      onClick={() => setSelectedWeek(week.week)}
                      className={[
                        "flex items-start gap-2 rounded-[var(--radius-lg)] px-3 py-2 text-left transition-colors duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
                        selected
                          ? "bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                      ].join(" ")}
                    >
                      <span className="mt-0.5 shrink-0 text-[var(--text-xs)] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        {week.week}
                      </span>
                      <span className="min-w-0 flex-1 text-[var(--text-sm)] font-medium">
                        {week.title}
                      </span>
                      {bossStatus && (
                        <Pill variant={bossStatus === "Done" ? "neutral" : "accent"} className="px-2 py-0.5 text-[10px]">
                          {bossStatus === "Done" ? "Boss ✓" : "Boss"}
                        </Pill>
                      )}
                      <ProgressCircle completed={wp?.completedCases ?? 0} total={5} size={18} />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Mobile week selector + main content */}
          <div className="min-w-0 flex-1">
            {/* Dropdown — mobile only */}
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="mb-4 w-full rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-primary)] lg:hidden"
            >
              {curriculum.map((week) => (
                <option key={week.week} value={week.week}>
                  Week {week.week}: {week.title}
                </option>
              ))}
            </select>

            {/* Cases for selected week */}
            {selectedWeekData && (
              <Card variant="default" padding="lg">
                <div className="mb-5">
                  <h3 className="coach-heading text-[24px] font-semibold leading-none">
                    Week {selectedWeekData.week}: {selectedWeekData.title}
                  </h3>
                  <div className="mt-3 border-t border-[color:var(--color-border-light)]" />
                </div>
                <div className="grid gap-3">
                  {selectedWeekData.cases.map((item) => {
                    const isBossCase = item.caseType === "boss";
                    const isLocked = isBossCase && !selectedWeekProgress?.bossUnlocked;
                    const isActive = activeScenario?.id === item.id;
                    const completion = completedCaseMap.get(item.id);
                    const isCompleted = Boolean(completion);
                    const unlockTarget = selectedWeekProgress?.requiredToUnlockBoss ?? 4;
                    const unlockedCount = Math.min(selectedWeekProgress?.completedCases ?? 0, unlockTarget);
                    const ctaLabel = isLocked ? "Locked" : isCompleted ? "Retry case" : isBossCase ? "Start boss" : "Start case";
                    const displayTitle = normalizeMissionCardTitle(item.title, item.company);

                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          if (isCompleted && completion) {
                            viewDebrief(completion.evaluationId);
                          } else if (!isLocked) {
                            void startCase(item.id);
                          }
                        }}
                        disabled={isLocked}
                        className={[
                          "group w-full min-h-[120px] rounded-[var(--radius-xl)] border bg-[var(--color-surface)] p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
                          "md:grid md:grid-cols-[56px_minmax(0,1fr)_auto] md:items-start md:gap-4",
                          isLocked
                            ? "cursor-not-allowed border-[color:var(--color-border-light)] opacity-85"
                            : "border-[color:var(--color-border-light)] hover:border-[color:var(--color-accent-soft-border)] hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)] active:translate-y-px",
                          isActive ? "ring-1 ring-[var(--color-accent)] ring-offset-0" : ""
                        ].join(" ")}
                      >
                        <div className="mb-3 flex md:mb-0 md:block md:self-start">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-surface)]">
                            <CompanyLabel company={item.company} iconSize={40} showCompanyText={false} className="justify-center gap-0" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[var(--text-xl)] font-semibold text-[var(--color-text-primary)]">{displayTitle}</p>
                            {isCompleted && (
                              <Pill variant="neutral" className="px-2 py-0.5 text-[10px]">
                                {completion!.score.toFixed(0)}pts
                              </Pill>
                            )}
                          </div>
                          <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                            {item.company} ({item.year}) • {item.caseType}
                          </p>
                          <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-secondary)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                            {item.expandedBrief.problemStatement}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 md:mt-0 md:flex-col md:items-end md:justify-center">
                          <span
                            className={[
                              "inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-[var(--text-sm)] font-semibold",
                              isLocked
                                ? "border border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)] text-[var(--color-accent-alt)]"
                                : isCompleted
                                  ? "border border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                                  : "border border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100"
                            ].join(" ")}
                          >
                            {isCompleted ? "View debrief" : ctaLabel}
                          </span>

                          {isCompleted && !isLocked && (
                            <span
                              className="inline-flex items-center rounded-[var(--radius-full)] border border-[color:var(--color-border-light)] bg-[var(--color-surface-hover)] px-3 py-1 text-[var(--text-sm)] font-semibold text-[var(--color-text-secondary)] md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                void startCase(item.id);
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void startCase(item.id);
                                }
                              }}
                            >
                              Retry case
                            </span>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                            {isActive && !isCompleted && (
                              <Pill variant="neutral" className="px-2.5 py-1 text-[10px] uppercase tracking-[0.08em]">
                                In Progress
                              </Pill>
                            )}
                            {isLocked && (
                              <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                                Complete {unlockedCount}/{unlockTarget} to unlock
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card variant="default" padding="lg" className="animate-rise">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border-light)] pb-4">
              <div className="flex items-center gap-2">
                <SectionIcon kind="chat" className="h-5 w-5 text-[var(--color-accent)]" />
                <h2 className="coach-heading text-[28px] font-semibold leading-none">Challenge Chat</h2>
              </div>
              <label className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-[color:var(--color-border-light)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={timedMode}
                  onChange={(e) => setTimedMode(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)]"
                />
                Timed Mode
              </label>
            </div>

            {!activeSession || !activeScenario ? (
              <div className="rounded-[var(--radius-xl)] border border-dashed border-[color:var(--color-border)] p-5 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                Start a case from Mission Map to begin chat coaching.
              </div>
            ) : (
              <>
                <Card variant="subtle" padding="md">
                  <p className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">{activeScenario.title}</p>
                  <p className="mt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    <CompanyLabel
                      company={activeScenario.company}
                      meta={`(${activeScenario.year}) • ${activeScenario.caseType}`}
                      iconSize={24}
                    />
                  </p>
                  <p className="mt-3 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                    {activeScenario.scenario}
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center gap-2 border-t border-[color:var(--color-border-light)] pt-4">
                      <SectionIcon kind="brief" className="h-5 w-5 text-[var(--color-accent)]" />
                      <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">Executive Brief</h3>
                    </div>

                    <details open className="rounded-[var(--radius-lg)] border border-[color:var(--color-border-light)] bg-[var(--color-surface)] p-4">
                      <summary className="cursor-pointer text-[var(--text-base)] font-semibold">Narrative Context</summary>
                      <p className="mt-3 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                        {activeScenario.expandedBrief.historyToDate}
                      </p>
                      <p className="mt-3 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                        {activeScenario.expandedBrief.currentOperatingContext}
                      </p>
                      <p className="mt-3 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-text-primary)]">Problem:</strong>{" "}
                        {activeScenario.expandedBrief.problemStatement}
                      </p>
                      <p className="mt-3 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                        <strong className="text-[var(--color-text-primary)]">Why now:</strong>{" "}
                        {activeScenario.expandedBrief.whyNow}
                      </p>
                    </details>

                    <details className="rounded-[var(--radius-lg)] border border-[color:var(--color-border-light)] bg-[var(--color-surface)] p-4">
                      <summary className="cursor-pointer text-[var(--text-base)] font-semibold">Stakeholder Tensions</summary>
                      <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
                        {activeScenario.expandedBrief.stakeholderTensions.length} tensions
                      </p>
                      <ul className="mt-3 space-y-1.5 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                        {activeScenario.expandedBrief.stakeholderTensions.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </details>

                    <Card variant="subtle" padding="md" className="border-[color:var(--color-accent-soft-border)]">
                      <p className="text-[var(--text-sm)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Your Task</p>
                      <p className="mt-2 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                        Define your own options and recommendation. In your memo, include execution sequencing, metrics with thresholds,
                        explicit risks with mitigation, and a clear facts-vs-assumptions split.
                      </p>
                    </Card>
                  </div>
                </Card>

                <div className="mt-5 flex items-center gap-2">
                  <SectionIcon kind="chat" className="h-5 w-5 text-[var(--color-accent)]" />
                  <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">Chat Stream</h3>
                </div>
                <div className="mt-3 max-h-[520px] space-y-3 overflow-y-auto rounded-[var(--radius-xl)] border border-[color:var(--color-border-light)] p-4">
                  {activeSession.turns
                    .filter((turn) => turn.role !== "system")
                    .map((turn, idx) => (
                      <div
                        key={`${turn.timestamp}-${idx}`}
                        className={[
                          "rounded-[var(--radius-lg)] border p-4 text-[var(--text-base)] leading-relaxed",
                          turn.role === "user"
                            ? "ml-4 border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                            : "mr-4 border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)] text-[var(--color-text-primary)]"
                        ].join(" ")}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
                          {turn.role}
                        </p>
                        <p className="whitespace-pre-wrap">{turn.content}</p>
                      </div>
                    ))}
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    rows={5}
                    placeholder="Respond with your decision logic, tradeoffs, and metrics."
                    className="coach-textarea p-4"
                  />
                  <Button variant="secondary" onClick={sendMessage} disabled={chatLoading || !chatMessage.trim()} className="self-end">
                    {chatLoading ? "Analyzing..." : "Send Response"}
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card variant="default" padding="lg" className="animate-rise lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center gap-2">
              <SectionIcon kind="memo" className="h-5 w-5 text-[var(--color-accent-alt)]" />
              <h3 className="coach-heading text-[26px] font-semibold leading-none">Final Decision Memo</h3>
            </div>
            <p className="mt-2 text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
              Submit a full recommendation to trigger executive-panel evaluation.
            </p>
            <textarea
              value={finalMemo}
              onChange={(e) => setFinalMemo(e.target.value)}
              rows={14}
              className="coach-textarea coach-mono mt-4 p-4"
              placeholder="Decision, segment choice, pricing logic, metric thresholds, rollout, and risk mitigation..."
            />
            <p className="mt-3 text-[var(--text-sm)] text-[var(--color-text-tertiary)]">
              {memoShortBy > 0
                ? `Minimum ${MIN_MEMO_CHARS} characters required (${memoCharacters}/${MIN_MEMO_CHARS}).`
                : `Minimum ${MIN_MEMO_CHARS} characters reached (${memoCharacters}/${MIN_MEMO_CHARS}).`}
            </p>
            <Button
              onClick={evaluateCase}
              disabled={!activeSession || evaluationLoading || memoCharacters < MIN_MEMO_CHARS}
              size="lg"
              className="mt-3 w-full bg-[var(--color-accent-alt)] hover:brightness-95"
            >
              {evaluationLoading ? "Scoring your memo..." : "Evaluate Critical Thinking"}
            </Button>
          </Card>
        </section>
      )}

      {activeTab === "debrief" && (
        <Card variant="default" padding="lg" className="animate-rise">
          <h2 className="coach-heading text-[30px] font-semibold leading-none">Debrief Board</h2>

          {!latestEvaluation ? (
            <p className="mt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
              Complete a case to view your latest executive-panel debrief.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              <Card variant="subtle" padding="md" className="border-[color:var(--color-accent-soft-border)]">
                <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Normalized Score
                </p>
                <p className="coach-heading text-[56px] leading-none font-semibold text-[var(--color-accent)]">
                  {latestEvaluation.normalizedScore.toFixed(1)}
                </p>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">
                  Verdict: {scoreTone(latestEvaluation.normalizedScore)}
                </p>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                {(Object.entries(latestEvaluation.rubric) as Array<[RubricAxis, number]>).map(([axis, value]) => (
                  <Card key={axis} variant="subtle" padding="sm">
                    <div className="flex items-center justify-between text-[var(--text-base)]">
                      <span>{rubricLabels[axis]}</span>
                      <strong>{value.toFixed(1)}/5</strong>
                    </div>
                    <ProgressBar className="mt-2" value={Math.max(5, (value / 5) * 100)} />
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Card variant="subtle" padding="md">
                  <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-accent)]">Strengths</h3>
                  <ul className="mt-2 space-y-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    {latestEvaluation.strengths.map((item, idx) => (
                      <li key={`${item}-${idx}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
                <Card
                  variant="subtle"
                  padding="md"
                  className="border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)]"
                >
                  <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-accent-alt)]">Blind Spots</h3>
                  <ul className="mt-2 space-y-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    {latestEvaluation.blindSpots.map((item, idx) => (
                      <li key={`${item}-${idx}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card variant="subtle" padding="md">
                <h3 className="text-[var(--text-lg)] font-semibold">Executive Panel Verdicts</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {latestEvaluation.panelFeedback.map((panel) => (
                    <Card key={panel.persona} variant="default" padding="sm">
                      <p className="text-[var(--text-base)] font-semibold">{panel.persona}</p>
                      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        Score: {panel.score.toFixed(1)}/5
                      </p>
                      <p className="mt-1 text-[var(--text-base)]">{panel.verdict}</p>
                      <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        Gap: {panel.biggestGap}
                      </p>
                    </Card>
                  ))}
                </div>
              </Card>

              {latestDebriefDetail?.scenario ? (
                <>
                  <CaseRevealCard scenario={latestDebriefDetail.scenario} />
                  <WhatActuallyHappenedCard scenario={latestDebriefDetail.scenario} />
                </>
              ) : (
                <Card variant="subtle" padding="md">
                  <h3 className="text-[var(--text-lg)] font-semibold">Case Reveal Pending</h3>
                  <p className="mt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    Reveal details could not be loaded for this debrief. Open the case from History to view the full case reveal.
                  </p>
                </Card>
              )}
            </div>
          )}
        </Card>
      )}

      {activeTab === "history" && (
        <Card variant="default" padding="lg" className="animate-rise">
          {!selectedHistoryDetail && (
            <h2 className="coach-heading mb-4 text-[30px] font-semibold leading-none">Case History</h2>
          )}

          {selectedHistoryDetail && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setSelectedHistoryDetail(null)}
                className="mb-3 inline-flex items-center gap-1 text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                <span aria-hidden="true">&larr;</span> Case History
              </button>
              <h2 className="coach-heading text-[30px] font-semibold leading-none">
                {selectedHistoryDetail.scenario.title}
              </h2>
              <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                <CompanyLabel
                  company={selectedHistoryDetail.scenario.company}
                  meta={`(${selectedHistoryDetail.scenario.year}) • ${new Date(selectedHistoryDetail.session.completedAt ?? "").toLocaleDateString()}`}
                />
              </p>
            </div>
          )}

          {historyLoading && !selectedHistoryDetail && (
            <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">Loading history...</p>
          )}

          {!historyLoading && historySessions.length === 0 && !selectedHistoryDetail && (
            <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">
              No completed cases yet. Finish a case to see it here.
            </p>
          )}

          {!selectedHistoryDetail && historySessions.length > 0 && (
            <div className="grid gap-3">
              {historySessions.map((entry) => (
                <button
                  type="button"
                  key={entry.sessionId}
                  onClick={() => void loadHistoryDetail(entry.evaluationId)}
                  className="group w-full rounded-[var(--radius-xl)] border border-[color:var(--color-border-light)] bg-[var(--color-surface)] p-4 text-left transition-[background-color,border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)] hover:-translate-y-[1px] hover:border-[color:var(--color-accent-soft-border)] hover:bg-[var(--color-surface-hover)] hover:shadow-[var(--shadow-sm)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)]">
                        {entry.caseTitle}
                      </p>
                      <CompanyLabel
                        company={entry.company}
                        className="text-[var(--text-sm)] text-[var(--color-text-secondary)]"
                        meta={`• Week ${entry.week}`}
                      />
                      <p className="text-[var(--text-xs)] uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                        Completed {new Date(entry.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-[var(--radius-lg)] border border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] px-3 py-2 text-right">
                      <p className="coach-heading text-[26px] font-semibold leading-none text-[var(--color-accent)]">
                        {entry.score.toFixed(1)}
                      </p>
                      <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-secondary)]">
                        {scoreTone(entry.score)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {historyDetailLoading && (
            <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">Loading debrief...</p>
          )}

          {selectedHistoryDetail && (
            <div className="space-y-4">
              <Card variant="subtle" padding="md" className="border-[color:var(--color-accent-soft-border)]">
                <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                  Normalized Score
                </p>
                <p className="coach-heading text-[56px] leading-none font-semibold text-[var(--color-accent)]">
                  {selectedHistoryDetail.evaluation.normalizedScore.toFixed(1)}
                </p>
                <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">
                  Verdict: {scoreTone(selectedHistoryDetail.evaluation.normalizedScore)}
                </p>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                {(Object.entries(selectedHistoryDetail.evaluation.rubric) as Array<[RubricAxis, number]>).map(([axis, value]) => (
                  <Card key={axis} variant="subtle" padding="sm">
                    <div className="flex items-center justify-between text-[var(--text-base)]">
                      <span>{rubricLabels[axis]}</span>
                      <strong>{value.toFixed(1)}/5</strong>
                    </div>
                    <ProgressBar className="mt-2" value={Math.max(5, (value / 5) * 100)} />
                  </Card>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Card variant="subtle" padding="md">
                  <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-accent)]">Strengths</h3>
                  <ul className="mt-2 space-y-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    {selectedHistoryDetail.evaluation.strengths.map((item, idx) => (
                      <li key={`${item}-${idx}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
                <Card
                  variant="subtle"
                  padding="md"
                  className="border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)]"
                >
                  <h3 className="text-[var(--text-base)] font-semibold text-[var(--color-accent-alt)]">Blind Spots</h3>
                  <ul className="mt-2 space-y-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    {selectedHistoryDetail.evaluation.blindSpots.map((item, idx) => (
                      <li key={`${item}-${idx}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
              </div>

              <Card variant="subtle" padding="md">
                <h3 className="text-[var(--text-lg)] font-semibold">Executive Panel Verdicts</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {selectedHistoryDetail.evaluation.panelFeedback.map((panel) => (
                    <Card key={panel.persona} variant="default" padding="sm">
                      <p className="text-[var(--text-base)] font-semibold">{panel.persona}</p>
                      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        Score: {panel.score.toFixed(1)}/5
                      </p>
                      <p className="mt-1 text-[var(--text-base)]">{panel.verdict}</p>
                      <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        Gap: {panel.biggestGap}
                      </p>
                    </Card>
                  ))}
                </div>
              </Card>

              <CaseRevealCard scenario={selectedHistoryDetail.scenario} />
              <WhatActuallyHappenedCard scenario={selectedHistoryDetail.scenario} />

              {selectedHistoryDetail.session.lastUserResponse && (
                <Card variant="subtle" padding="md">
                  <h3 className="text-[var(--text-lg)] font-semibold">Your Final Memo</h3>
                  <p className="mt-2 whitespace-pre-wrap text-[var(--text-base)] leading-relaxed text-[var(--color-text-secondary)]">
                    {selectedHistoryDetail.session.lastUserResponse}
                  </p>
                </Card>
              )}

              <Card variant="subtle" padding="md">
                <h3 className="text-[var(--text-lg)] font-semibold">Chat Transcript</h3>
                <div className="mt-3 max-h-[400px] space-y-3 overflow-y-auto">
                  {selectedHistoryDetail.session.turns
                    .filter((turn) => turn.role !== "system")
                    .map((turn, idx) => (
                      <div
                        key={`${turn.timestamp}-${idx}`}
                        className={[
                          "rounded-[var(--radius-lg)] border p-4 text-[var(--text-base)] leading-relaxed",
                          turn.role === "user"
                            ? "ml-4 border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                            : "mr-4 border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)] text-[var(--color-text-primary)]"
                        ].join(" ")}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
                          {turn.role}
                        </p>
                        <p className="whitespace-pre-wrap">{turn.content}</p>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          )}
        </Card>
      )}

      {activeTab === "skills" && (
        <Card variant="default" padding="lg" className="animate-rise">
          <h2 className="coach-heading text-[30px] font-semibold leading-none">Skill Tree</h2>
          <p className="mt-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">
            Mastery is calculated from your historical rubric performance.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(progress?.skillTree ?? []).map((node) => (
              <Card key={node.skill} variant="subtle" padding="sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[var(--text-base)] font-medium">{node.skill}</span>
                  <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{node.mastery}%</span>
                </div>
                <ProgressBar tone="warning" value={Math.max(4, node.mastery)} />
              </Card>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "streak" && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card variant="default" padding="lg" className="animate-rise">
            <h2 className="coach-heading text-[30px] font-semibold leading-none">Streak + Progression</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card variant="subtle" padding="sm" className="min-h-[112px]">
                <div className="flex h-full flex-col">
                  <p className="min-h-[18px] whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--color-text-tertiary)]">
                    Cases Completed
                  </p>
                  <p className="mt-auto text-2xl font-semibold">{progress?.casesCompleted ?? 0}</p>
                </div>
              </Card>
              <Card variant="subtle" padding="sm" className="min-h-[112px]">
                <div className="flex h-full flex-col">
                  <p className="min-h-[18px] whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--color-text-tertiary)]">
                    Boss Cases
                  </p>
                  <p className="mt-auto text-2xl font-semibold">{progress?.bossCasesCompleted ?? 0}</p>
                </div>
              </Card>
              <Card variant="subtle" padding="sm" className="min-h-[112px]">
                <div className="flex h-full flex-col">
                  <p className="min-h-[18px] whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--color-text-tertiary)]">
                    Average Score
                  </p>
                  <p className="mt-auto text-2xl font-semibold">{progress?.averageScore?.toFixed(1) ?? "0.0"}</p>
                </div>
              </Card>
              <Card variant="subtle" padding="sm" className="min-h-[112px]">
                <div className="flex h-full flex-col">
                  <p className="min-h-[18px] whitespace-nowrap text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-[var(--color-text-tertiary)]">
                    Current Streak
                  </p>
                  <p className="mt-auto text-2xl font-semibold">{progress?.streakDays ?? 0}d</p>
                </div>
              </Card>
            </div>

            <div className="mt-4 space-y-2">
              {progress?.weekProgress.map((week) => (
                <Card key={week.week} variant="subtle" padding="sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-base)]">Week {week.week}</span>
                    <span className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                      {week.completedCases}/5 complete
                    </span>
                  </div>
                  <ProgressBar className="mt-2" value={Math.min(100, (week.completedCases / 5) * 100)} />
                  <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    Boss: {week.bossUnlocked ? (week.bossCompleted ? "Completed" : "Unlocked") : "Locked"}
                  </p>
                </Card>
              ))}
            </div>
          </Card>

          <Card variant="default" padding="lg" className="animate-rise">
            <h3 className="coach-heading text-[26px] font-semibold leading-none">Current Weakness Signals</h3>
            <div className="mt-3 space-y-3">
              {weaknesses.map((item) => (
                <Card key={item.axis} variant="subtle" padding="sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[var(--text-base)]">{rubricLabels[item.axis]}</span>
                    <Pill variant="warning" className="px-2 py-1 text-[var(--text-xs)]">
                      Signal {Math.round(item.averageSignal * 100)}%
                    </Pill>
                  </div>
                  <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">{item.recommendation}</p>
                </Card>
              ))}
            </div>
          </Card>
        </section>
      )}
    </main>
  );
}
