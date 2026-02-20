"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CaseScenario,
  CaseSession,
  CurriculumWeek,
  EvaluationResult,
  ProgressSnapshot,
  RubricAxis,
  WeaknessSignal
} from "@coach/core-types";
import { fetchJson } from "@/lib/http";
import { Button, Card, Pill, ProgressBar, Tabs } from "@/components/ui";

type StartCaseResponse = {
  session: CaseSession;
  scenario: CaseScenario;
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

type TabKey = "mission" | "chat" | "debrief" | "skills" | "streak";

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "mission", label: "Mission Map" },
  { id: "chat", label: "Challenge Chat" },
  { id: "debrief", label: "Debrief Board" },
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

export function CoachApp() {
  const [error, setError] = useState<string | null>(null);

  const [curriculum, setCurriculum] = useState<CurriculumWeek[]>([]);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [weaknesses, setWeaknesses] = useState<WeaknessSignal[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("mission");
  const [selectedWeek, setSelectedWeek] = useState(1);

  const [activeSession, setActiveSession] = useState<CaseSession | null>(null);
  const [activeScenario, setActiveScenario] = useState<CaseScenario | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [finalMemo, setFinalMemo] = useState("");
  const [timedMode, setTimedMode] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<EvaluationResult | null>(null);

  const selectedWeekData = useMemo(
    () => curriculum.find((week) => week.week === selectedWeek) ?? null,
    [curriculum, selectedWeek]
  );

  async function loadDashboard() {
    try {
      const [curriculumRes, progressRes, weaknessRes] = await Promise.all([
        fetchJson<{ weeks: CurriculumWeek[] }>("/api/curriculum"),
        fetchJson<{ progress: ProgressSnapshot }>("/api/progress/summary"),
        fetchJson<{ weaknesses: WeaknessSignal[] }>("/api/progress/weaknesses")
      ]);

      setCurriculum(curriculumRes.weeks);
      setProgress(progressRes.progress);
      setWeaknesses(weaknessRes.weaknesses);
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
    if (!activeSession || finalMemo.trim().length < 20) {
      setError("Final memo must be at least 20 characters.");
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
      setProgress(response.progress);
      setActiveTab("debrief");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate case");
    } finally {
      setEvaluationLoading(false);
    }
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

      <Tabs options={tabs} activeId={activeTab} onSelect={setActiveTab} className="w-fit max-w-full" />

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
        <Card variant="default" padding="lg" className="animate-rise">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="coach-heading text-[30px] font-semibold leading-none">12-Week Mission Map</h2>
            <Button
              onClick={() => startCase()}
              className="bg-[var(--color-accent-alt)] hover:brightness-95 focus-visible:outline-[var(--color-focus)]"
            >
              Start Recommended Case
            </Button>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map((week) => {
              const wp = progress?.weekProgress.find((entry) => entry.week === week.week);
              const completion = wp ? `${wp.completedCases}/5` : "0/5";
              const selected = selectedWeek === week.week;

              return (
                <button
                  type="button"
                  key={week.week}
                  onClick={() => setSelectedWeek(week.week)}
                  className={[
                    "group rounded-[var(--radius-xl)] border p-4 text-left transition-[background-color,border-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-standard)]",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]",
                    selected
                      ? "border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)]"
                      : "border-[color:var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-[1px] hover:bg-[var(--color-surface-hover)]"
                  ].join(" ")}
                >
                  <span className="mb-3 block h-[2px] w-10 rounded-full bg-[var(--color-border-light)] transition-colors group-hover:bg-[var(--color-accent-soft-border)]" />
                  <p className="text-[var(--text-xs)] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
                    Week {week.week}
                  </p>
                  <p className="mt-1 text-[17px] font-semibold leading-[1.25] text-[var(--color-text-primary)]">{week.title}</p>
                  <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-secondary)]">Progress: {completion}</p>
                  <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-tertiary)]">
                    Boss: {wp?.bossUnlocked ? (wp.bossCompleted ? "Completed" : "Unlocked") : "Locked"}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedWeekData && (
            <Card variant="subtle" padding="md" className="mt-6">
              <h3 className="coach-heading text-[24px] font-semibold leading-none">Week {selectedWeekData.week} Cases</h3>
              <div className="mt-3 grid gap-2">
                {selectedWeekData.cases.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border-light)] bg-[var(--color-surface)] p-3.5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-[var(--text-base)] font-semibold">{item.title}</p>
                      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                        {item.company} ({item.year}) • {item.caseType}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => startCase(item.id)}>
                      Start Challenge
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Card>
      )}

      {activeTab === "chat" && (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card variant="default" padding="lg" className="animate-rise">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="coach-heading text-[28px] font-semibold leading-none">Challenge Chat</h2>
              <label className="flex items-center gap-2 text-[var(--text-xs)] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
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
              <div className="rounded-[var(--radius-xl)] border border-dashed border-[color:var(--color-border)] p-4 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                Start a case from Mission Map to begin chat coaching.
              </div>
            ) : (
              <>
                <Card variant="subtle" padding="sm">
                  <p className="text-[var(--text-base)] font-semibold text-[var(--color-text-primary)]">{activeScenario.title}</p>
                  <p className="mt-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">{activeScenario.scenario}</p>
                </Card>

                <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-[var(--radius-xl)] border border-[color:var(--color-border-light)] p-3">
                  {activeSession.turns
                    .filter((turn) => turn.role !== "system")
                    .map((turn, idx) => (
                      <div
                        key={`${turn.timestamp}-${idx}`}
                        className={[
                          "rounded-[var(--radius-lg)] border p-3.5 text-[var(--text-base)]",
                          turn.role === "user"
                            ? "ml-6 border-[color:var(--color-accent-soft-border)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]"
                            : "mr-6 border-[color:var(--color-accent-alt-soft-border)] bg-[var(--color-accent-alt-soft)] text-[var(--color-text-primary)]"
                        ].join(" ")}
                      >
                        <p className="mb-1 text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                          {turn.role}
                        </p>
                        <p className="whitespace-pre-wrap">{turn.content}</p>
                      </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    rows={4}
                    placeholder="Respond with your decision logic, tradeoffs, and metrics."
                    className="coach-textarea p-3"
                  />
                  <Button onClick={sendMessage} disabled={chatLoading || !chatMessage.trim()}>
                    {chatLoading ? "Analyzing..." : "Send Response"}
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card variant="default" padding="lg" className="animate-rise">
            <h3 className="coach-heading text-[26px] font-semibold leading-none">Final Decision Memo</h3>
            <p className="mt-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">
              Submit a full recommendation to trigger executive-panel evaluation.
            </p>
            <textarea
              value={finalMemo}
              onChange={(e) => setFinalMemo(e.target.value)}
              rows={14}
              className="coach-textarea coach-mono mt-3 p-3"
              placeholder="Decision, segment choice, pricing logic, metric thresholds, rollout, and risk mitigation..."
            />
            <Button
              onClick={evaluateCase}
              disabled={!activeSession || evaluationLoading || finalMemo.trim().length < 20}
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

              {activeScenario && (
                <Card variant="subtle" padding="md">
                  <h3 className="text-[var(--text-lg)] font-semibold">What Actually Happened</h3>
                  <p className="mt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    <strong className="text-[var(--color-text-primary)]">Decision:</strong> {activeScenario.actualDecision}
                  </p>
                  <p className="mt-2 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                    <strong className="text-[var(--color-text-primary)]">Outcome:</strong> {activeScenario.outcome}
                  </p>
                  <div className="mt-3">
                    <p className="text-[var(--text-xs)] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                      Citations
                    </p>
                    <ul className="mt-2 space-y-1 text-[var(--text-base)] text-[var(--color-text-secondary)]">
                      {activeScenario.citations.map((citation) => (
                        <li key={`${citation.url}-${citation.sourceTitle}`}>
                          •{" "}
                          <a
                            href={citation.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--color-accent)] underline"
                          >
                            {citation.sourceTitle}
                          </a>{" "}
                          ({citation.publishedAt})
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}
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
