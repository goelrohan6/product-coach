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
    <main className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-4 p-4 pb-10 md:p-8">
      <header className="coach-card animate-rise p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-coach-accent">Executive Product Coach</p>
            <h1 className="text-2xl font-semibold md:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
              Build World-Class Product Judgment
            </h1>
            <p className="mt-1 text-sm text-coach-muted">
              Mixed B2B real-world scenarios, rigorous evaluation, and progression gates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="metric-pill rounded-full px-4 py-2 text-sm">
              XP: <strong>{progress?.xp ?? 0}</strong>
            </div>
            <div className="metric-pill rounded-full px-4 py-2 text-sm">
              Level: <strong>{progress?.level ?? 1}</strong>
            </div>
            <div className="metric-pill rounded-full px-4 py-2 text-sm">
              Streak: <strong>{progress?.streakDays ?? 0}d</strong>
            </div>
          </div>
        </div>
      </header>

      <section className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-coach-accent text-white"
                : "border border-[#cdd9d8] bg-white text-coach-muted hover:border-coach-accent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {error && (
        <section className="coach-card border border-[#e6b9aa] bg-[#fff8f5] p-4 text-sm text-[#9d391d]">
          {error}
        </section>
      )}

      {activeTab === "mission" && (
        <section className="coach-card animate-rise p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              12-Week Mission Map
            </h2>
            <button
              type="button"
              onClick={() => startCase()}
              className="rounded-lg bg-coach-accentAlt px-4 py-2 text-sm font-semibold text-white"
            >
              Start Recommended Case
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {curriculum.map((week) => {
              const wp = progress?.weekProgress.find((entry) => entry.week === week.week);
              const completion = wp ? `${wp.completedCases}/5` : "0/5";

              return (
                <button
                  type="button"
                  key={week.week}
                  onClick={() => setSelectedWeek(week.week)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedWeek === week.week
                      ? "border-coach-accent bg-[#f2fbf9]"
                      : "border-[#d8e1df] bg-white hover:border-coach-accentAlt"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-coach-muted">Week {week.week}</p>
                  <p className="mt-1 font-semibold text-coach-text">{week.title}</p>
                  <p className="mt-2 text-sm text-coach-muted">Progress: {completion}</p>
                  <p className="mt-1 text-xs text-coach-muted">
                    Boss: {wp?.bossUnlocked ? (wp.bossCompleted ? "Completed" : "Unlocked") : "Locked"}
                  </p>
                </button>
              );
            })}
          </div>

          {selectedWeekData && (
            <div className="mt-5 rounded-xl border border-[#d8e1df] p-4">
              <h3 className="font-semibold">Week {selectedWeekData.week} Cases</h3>
              <div className="mt-3 grid gap-2">
                {selectedWeekData.cases.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-[#deebe8] p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-coach-muted">
                        {item.company} ({item.year}) • {item.caseType}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCase(item.id)}
                      className="rounded-md bg-coach-accent px-3 py-2 text-sm font-medium text-white"
                    >
                      Start Challenge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === "chat" && (
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="coach-card animate-rise p-4 md:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                Challenge Chat
              </h2>
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-coach-muted">
                <input
                  type="checkbox"
                  checked={timedMode}
                  onChange={(e) => setTimedMode(e.target.checked)}
                  className="h-4 w-4"
                />
                Timed Mode
              </label>
            </div>

            {!activeSession || !activeScenario ? (
              <div className="rounded-xl border border-dashed border-[#b6cbc8] p-4 text-sm text-coach-muted">
                Start a case from Mission Map to begin chat coaching.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-[#d2dfdd] bg-[#f9fcfb] p-3 text-sm">
                  <p className="font-semibold text-coach-text">{activeScenario.title}</p>
                  <p className="mt-1 text-coach-muted">{activeScenario.scenario}</p>
                </div>

                <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto rounded-xl border border-[#d8e5e3] p-3">
                  {activeSession.turns
                    .filter((turn) => turn.role !== "system")
                    .map((turn, idx) => (
                      <div
                        key={`${turn.timestamp}-${idx}`}
                        className={`rounded-lg p-3 text-sm ${
                          turn.role === "user"
                            ? "ml-6 bg-[#e9f6f4] text-[#0f3e39]"
                            : "mr-6 bg-[#fff3ea] text-[#5d2f11]"
                        }`}
                      >
                        <p className="mb-1 text-[11px] uppercase tracking-[0.12em] opacity-70">{turn.role}</p>
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
                    className="rounded-xl border border-[#cfe0dd] p-3 outline-none focus:border-coach-accent"
                  />
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={chatLoading || !chatMessage.trim()}
                    className="rounded-lg bg-coach-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {chatLoading ? "Analyzing..." : "Send Response"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="coach-card animate-rise p-4 md:p-6">
            <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Final Decision Memo
            </h3>
            <p className="mt-1 text-sm text-coach-muted">
              Submit a full recommendation to trigger executive-panel evaluation.
            </p>
            <textarea
              value={finalMemo}
              onChange={(e) => setFinalMemo(e.target.value)}
              rows={14}
              className="mt-3 w-full rounded-xl border border-[#cfe0dd] p-3 outline-none focus:border-coach-accent"
              placeholder="Decision, segment choice, pricing logic, metric thresholds, rollout, and risk mitigation..."
            />
            <button
              type="button"
              onClick={evaluateCase}
              disabled={!activeSession || evaluationLoading || finalMemo.trim().length < 20}
              className="mt-3 w-full rounded-lg bg-coach-accentAlt px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {evaluationLoading ? "Scoring your memo..." : "Evaluate Critical Thinking"}
            </button>
          </div>
        </section>
      )}

      {activeTab === "debrief" && (
        <section className="coach-card animate-rise p-4 md:p-6">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            Debrief Board
          </h2>

          {!latestEvaluation ? (
            <p className="mt-2 text-sm text-coach-muted">Complete a case to view your latest executive-panel debrief.</p>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-[#d4e4e1] bg-[#f8fcfb] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-coach-muted">Normalized Score</p>
                <p className="text-4xl font-semibold text-coach-accent">{latestEvaluation.normalizedScore.toFixed(1)}</p>
                <p className="text-sm text-coach-muted">Verdict: {scoreTone(latestEvaluation.normalizedScore)}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {(Object.entries(latestEvaluation.rubric) as Array<[RubricAxis, number]>).map(([axis, value]) => (
                  <div key={axis} className="rounded-lg border border-[#d9e6e4] p-3">
                    <div className="flex justify-between text-sm">
                      <span>{rubricLabels[axis]}</span>
                      <strong>{value.toFixed(1)}/5</strong>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[#e6f0ee]">
                      <div
                        className="h-2 rounded-full bg-coach-accent"
                        style={{ width: `${Math.max(5, (value / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-[#deebe8] p-4">
                  <h3 className="font-semibold text-coach-accent">Strengths</h3>
                  <ul className="mt-2 space-y-2 text-sm text-coach-muted">
                    {latestEvaluation.strengths.map((item, idx) => (
                      <li key={`${item}-${idx}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-[#f0dfd4] p-4">
                  <h3 className="font-semibold text-coach-accentAlt">Blind Spots</h3>
                  <ul className="mt-2 space-y-2 text-sm text-coach-muted">
                    {latestEvaluation.blindSpots.map((item, idx) => (
                      <li key={`${item}-${idx}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe9e7] p-4">
                <h3 className="font-semibold">Executive Panel Verdicts</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {latestEvaluation.panelFeedback.map((panel) => (
                    <div key={panel.persona} className="rounded-lg border border-[#dbe7e5] p-3 text-sm">
                      <p className="font-semibold">{panel.persona}</p>
                      <p className="text-coach-muted">Score: {panel.score.toFixed(1)}/5</p>
                      <p className="mt-1">{panel.verdict}</p>
                      <p className="mt-2 text-coach-muted">Gap: {panel.biggestGap}</p>
                    </div>
                  ))}
                </div>
              </div>

              {activeScenario && (
                <div className="rounded-xl border border-[#dfe9e7] p-4">
                  <h3 className="font-semibold">What Actually Happened</h3>
                  <p className="mt-2 text-sm text-coach-muted">
                    <strong className="text-coach-text">Decision:</strong> {activeScenario.actualDecision}
                  </p>
                  <p className="mt-2 text-sm text-coach-muted">
                    <strong className="text-coach-text">Outcome:</strong> {activeScenario.outcome}
                  </p>
                  <div className="mt-3">
                    <p className="text-xs uppercase tracking-[0.12em] text-coach-muted">Citations</p>
                    <ul className="mt-2 space-y-1 text-sm text-coach-muted">
                      {activeScenario.citations.map((citation) => (
                        <li key={`${citation.url}-${citation.sourceTitle}`}>
                          •{" "}
                          <a href={citation.url} target="_blank" rel="noreferrer" className="text-coach-accent underline">
                            {citation.sourceTitle}
                          </a>{" "}
                          ({citation.publishedAt})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === "skills" && (
        <section className="coach-card animate-rise p-4 md:p-6">
          <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            Skill Tree
          </h2>
          <p className="mt-1 text-sm text-coach-muted">Mastery is calculated from your historical rubric performance.</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(progress?.skillTree ?? []).map((node) => (
              <div key={node.skill} className="rounded-xl border border-[#d8e5e2] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{node.skill}</span>
                  <span className="text-sm text-coach-muted">{node.mastery}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#e4efed]">
                  <div
                    className="h-2 rounded-full bg-coach-accentAlt"
                    style={{ width: `${Math.max(4, node.mastery)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "streak" && (
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="coach-card animate-rise p-4 md:p-6">
            <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Streak + Progression
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#dce9e7] p-3">
                <p className="text-xs uppercase text-coach-muted">Cases Completed</p>
                <p className="text-2xl font-semibold">{progress?.casesCompleted ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[#dce9e7] p-3">
                <p className="text-xs uppercase text-coach-muted">Boss Cases</p>
                <p className="text-2xl font-semibold">{progress?.bossCasesCompleted ?? 0}</p>
              </div>
              <div className="rounded-xl border border-[#dce9e7] p-3">
                <p className="text-xs uppercase text-coach-muted">Average Score</p>
                <p className="text-2xl font-semibold">{progress?.averageScore?.toFixed(1) ?? "0.0"}</p>
              </div>
              <div className="rounded-xl border border-[#dce9e7] p-3">
                <p className="text-xs uppercase text-coach-muted">Current Streak</p>
                <p className="text-2xl font-semibold">{progress?.streakDays ?? 0}d</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {progress?.weekProgress.map((week) => (
                <div key={week.week} className="rounded-lg border border-[#dce7e5] p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Week {week.week}</span>
                    <span className="text-coach-muted">{week.completedCases}/5 complete</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#e4efed]">
                    <div
                      className="h-2 rounded-full bg-coach-accent"
                      style={{ width: `${Math.min(100, (week.completedCases / 5) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-coach-muted">
                    Boss: {week.bossUnlocked ? (week.bossCompleted ? "Completed" : "Unlocked") : "Locked"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="coach-card animate-rise p-4 md:p-6">
            <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Current Weakness Signals
            </h3>
            <div className="mt-3 space-y-3">
              {weaknesses.map((item) => (
                <div key={item.axis} className="rounded-lg border border-[#e0ebea] p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span>{rubricLabels[item.axis]}</span>
                    <span className="text-coach-muted">Signal {Math.round(item.averageSignal * 100)}%</span>
                  </div>
                  <p className="text-xs text-coach-muted">{item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
