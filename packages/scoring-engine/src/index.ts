import { randomUUID } from "node:crypto";
import {
  EvaluationResultSchema,
  PanelFeedbackSchema,
  RUBRIC_WEIGHTS,
  type CaseScenario,
  type EvaluationResult,
  type EvaluationRubric,
  type PanelFeedback,
  type RubricAxis
} from "@coach/core-types";

export type LiteLLMRuntimeConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  enableRedaction?: boolean;
};

export type EvaluateDecisionInput = {
  sessionId: string;
  caseScenario: CaseScenario;
  transcript: string[];
  finalMemo: string;
  llmConfig?: LiteLLMRuntimeConfig;
};

type SignalChecks = {
  assumptions: boolean;
  metrics: boolean;
  segmentation: boolean;
  pricing: boolean;
  risk: boolean;
  executionPlan: boolean;
  tradeoffs: boolean;
};

const KEYWORDS = {
  assumptions: ["assume", "hypothesis", "if/then", "we believe", "uncertainty"],
  metrics: ["metric", "kpi", "north star", "baseline", "%", "conversion", "retention", "nrr", "churn"],
  segmentation: ["segment", "icp", "persona", "enterprise", "mid-market", "smb", "vertical"],
  pricing: ["price", "pricing", "package", "tier", "consumption", "commitment", "margin"],
  risk: ["risk", "failure mode", "mitigation", "downside", "tradeoff", "guardrail"],
  executionPlan: ["90-day", "milestone", "owner", "timeline", "rollout", "phase"],
  tradeoffs: ["trade-off", "tradeoff", "versus", "option", "alternative", "counterfactual"]
};

const AXIS_DESCRIPTIONS: Record<RubricAxis, string> = {
  problemFraming: "Problem framing quality",
  customerUnderstanding: "Customer and segment understanding",
  businessEconomics: "Business and pricing economics",
  metricsExperimentation: "Metrics and experimentation rigor",
  strategicCoherence: "Strategic coherence",
  riskHandling: "Risk handling and mitigation",
  executionRealism: "Execution realism",
  communicationClarity: "Communication clarity"
};

const AXIS_STRENGTH_GUIDANCE: Record<RubricAxis, string> = {
  problemFraming:
    "You are defining the core decision clearly and reducing ambiguity for downstream teams.",
  customerUnderstanding:
    "You are anchoring recommendations in a clear customer segment and practical buyer reality.",
  businessEconomics:
    "You are connecting product choices to revenue quality, margin health, and payback logic.",
  metricsExperimentation:
    "You are treating decisions as testable bets with measurable milestones and learning loops.",
  strategicCoherence:
    "You are aligning sequencing, scope, and priorities to a coherent strategic thesis.",
  riskHandling:
    "You are naming downside scenarios early and pairing them with concrete guardrails.",
  executionRealism:
    "You are translating strategy into realistic rollout sequencing and ownership expectations.",
  communicationClarity:
    "Your memo structure makes it easier for leaders to follow the argument and decide quickly."
};

const AXIS_BLIND_SPOT_GUIDANCE: Record<RubricAxis, string> = {
  problemFraming:
    "The decision frame is still too broad, so options are not yet compared on a common objective.",
  customerUnderstanding:
    "The target segment and buying context need sharper specificity to avoid generic recommendations.",
  businessEconomics:
    "The recommendation needs clearer economic consequences, including downside exposure and tradeoffs.",
  metricsExperimentation:
    "Success criteria and experiment design are under-specified, making course correction harder.",
  strategicCoherence:
    "The plan lacks explicit prioritization logic about what to do now versus defer.",
  riskHandling:
    "Major failure modes are acknowledged only lightly and not fully tied to mitigations.",
  executionRealism:
    "Execution sequencing and ownership details need to be concrete enough for real teams to run.",
  communicationClarity:
    "The memo needs tighter structure so key decisions and rationale are immediately visible."
};

const AXIS_NEXT_CASE_DRILLS: Record<RubricAxis, string> = {
  problemFraming:
    "Write the decision in one sentence, define the objective function, and compare at least two options against it.",
  customerUnderstanding:
    "Specify one primary ICP with qualifying traits, one adjacent segment to defer, and why.",
  businessEconomics:
    "Quantify expected revenue impact, margin effect, and a clear pivot/continue threshold.",
  metricsExperimentation:
    "List baseline, target, and decision threshold for each core metric before proposing rollout.",
  strategicCoherence:
    "State explicit sequencing logic: now, next, later, and what you are intentionally not doing.",
  riskHandling:
    "For the top three risks, include trigger signals, owner, and mitigation action.",
  executionRealism:
    "Provide a 30/60/90-day plan with named milestones, dependencies, and handoffs.",
  communicationClarity:
    "Use a fixed memo format: decision, rationale, economics, risks, rollout, metrics, and open questions."
};

function clamp(value: number, min = 0, max = 5): number {
  return Math.max(min, Math.min(max, value));
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function keywordHits(text: string, keywords: string[]): number {
  return keywords.reduce((acc, keyword) => (text.includes(keyword) ? acc + 1 : acc), 0);
}

function detectSignals(text: string): SignalChecks {
  const normalized = normalize(text);
  return {
    assumptions: keywordHits(normalized, KEYWORDS.assumptions) >= 1,
    metrics: keywordHits(normalized, KEYWORDS.metrics) >= 2 || /\d+\s?%/.test(normalized),
    segmentation: keywordHits(normalized, KEYWORDS.segmentation) >= 1,
    pricing: keywordHits(normalized, KEYWORDS.pricing) >= 1,
    risk: keywordHits(normalized, KEYWORDS.risk) >= 1,
    executionPlan: keywordHits(normalized, KEYWORDS.executionPlan) >= 1,
    tradeoffs: keywordHits(normalized, KEYWORDS.tradeoffs) >= 1
  };
}

function scoreFromSignals(
  signalChecks: SignalChecks,
  combinedText: string,
  caseScenario: CaseScenario
): EvaluationRubric {
  const lengthFactor = Math.min(1, combinedText.length / 1800);
  const detailBonus = lengthFactor * 0.8;

  const problemFraming = clamp(
    1.8 +
      detailBonus +
      (signalChecks.tradeoffs ? 0.8 : 0) +
      (signalChecks.assumptions ? 0.6 : 0)
  );

  const customerUnderstanding = clamp(
    1.7 + detailBonus + (signalChecks.segmentation ? 1.0 : 0) + (signalChecks.tradeoffs ? 0.4 : 0)
  );

  const businessEconomics = clamp(
    1.5 + detailBonus + (signalChecks.pricing ? 1.3 : 0) + (signalChecks.metrics ? 0.5 : 0)
  );

  const metricsExperimentation = clamp(
    1.4 + detailBonus + (signalChecks.metrics ? 1.4 : 0) + (signalChecks.assumptions ? 0.5 : 0)
  );

  const strategicCoherence = clamp(
    1.7 +
      detailBonus +
      (signalChecks.tradeoffs ? 0.8 : 0) +
      (signalChecks.segmentation ? 0.4 : 0) +
      (signalChecks.pricing ? 0.3 : 0)
  );

  const riskHandling = clamp(
    1.5 + detailBonus + (signalChecks.risk ? 1.2 : 0) + (signalChecks.assumptions ? 0.4 : 0)
  );

  const executionRealism = clamp(
    1.6 + detailBonus + (signalChecks.executionPlan ? 1.1 : 0) + (signalChecks.metrics ? 0.4 : 0)
  );

  const communicationClarity = clamp(
    1.8 + detailBonus + (combinedText.split("\n").length >= 4 ? 0.7 : 0)
  );

  // Boss cases should have a higher bar; apply small penalty for weak coverage.
  const difficultyPenalty = caseScenario.caseType === "boss" && !signalChecks.tradeoffs ? 0.3 : 0;

  return {
    problemFraming: clamp(problemFraming - difficultyPenalty),
    customerUnderstanding: clamp(customerUnderstanding - difficultyPenalty),
    businessEconomics: clamp(businessEconomics - difficultyPenalty),
    metricsExperimentation: clamp(metricsExperimentation - difficultyPenalty),
    strategicCoherence: clamp(strategicCoherence - difficultyPenalty),
    riskHandling: clamp(riskHandling - difficultyPenalty),
    executionRealism: clamp(executionRealism - difficultyPenalty),
    communicationClarity: clamp(communicationClarity - difficultyPenalty)
  };
}

function weightedRubricScore(rubric: EvaluationRubric): number {
  const weighted =
    rubric.problemFraming * RUBRIC_WEIGHTS.problemFraming +
    rubric.customerUnderstanding * RUBRIC_WEIGHTS.customerUnderstanding +
    rubric.businessEconomics * RUBRIC_WEIGHTS.businessEconomics +
    rubric.metricsExperimentation * RUBRIC_WEIGHTS.metricsExperimentation +
    rubric.strategicCoherence * RUBRIC_WEIGHTS.strategicCoherence +
    rubric.riskHandling * RUBRIC_WEIGHTS.riskHandling +
    rubric.executionRealism * RUBRIC_WEIGHTS.executionRealism +
    rubric.communicationClarity * RUBRIC_WEIGHTS.communicationClarity;

  return Math.round(((weighted / 5) * 100) * 10) / 10;
}

function fallbackPanelFromRubric(rubric: EvaluationRubric): PanelFeedback[] {
  const panel: PanelFeedback[] = [
    {
      persona: "CPO",
      score: clamp((rubric.problemFraming + rubric.strategicCoherence + rubric.customerUnderstanding) / 3),
      verdict: "Strategy quality is solid but needs sharper prioritization language.",
      rationale:
        "I am looking for explicit strategy-choice logic tied to segment-level outcomes and defensibility.",
      strongestPoint: "Clear framing of strategic direction.",
      biggestGap: "Could tighten articulation of what not to build now."
    },
    {
      persona: "CFO",
      score: clamp((rubric.businessEconomics + rubric.metricsExperimentation + rubric.riskHandling) / 3),
      verdict: "Economic framing is credible but requires stronger downside math.",
      rationale:
        "The plan should quantify unit-economics exposure, margin implications, and leading indicators.",
      strongestPoint: "You connect decision choices to monetization logic.",
      biggestGap: "Missing explicit threshold metrics for pivot/continue decisions."
    },
    {
      persona: "VP_SALES",
      score: clamp((rubric.customerUnderstanding + rubric.executionRealism + rubric.communicationClarity) / 3),
      verdict: "Segment logic is promising, but activation and enablement sequencing can be sharper.",
      rationale:
        "Sales impact depends on clear ICP boundaries, packaging narrative, and rollout sequence.",
      strongestPoint: "Reasonable segmentation and GTM intent.",
      biggestGap: "Need tighter sales motion details and qualification criteria."
    },
    {
      persona: "VP_CS",
      score: clamp((rubric.executionRealism + rubric.riskHandling + rubric.customerUnderstanding) / 3),
      verdict: "Operational readiness is mostly sound with room to strengthen adoption risk management.",
      rationale:
        "Customer outcomes depend on post-sale activation, governance, and measurable value realization.",
      strongestPoint: "Acknowledges customer risk and adoption considerations.",
      biggestGap: "Needs clearer customer success leading indicators."
    }
  ];

  return panel.map((entry) => PanelFeedbackSchema.parse(entry));
}

function stripCodeFences(text: string): string {
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

async function llmPanelFeedback(
  config: LiteLLMRuntimeConfig,
  input: EvaluateDecisionInput,
  rubric: EvaluationRubric,
  signals: SignalChecks
): Promise<PanelFeedback[] | null> {
  try {
    const payload = {
      model: config.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an executive product decision panel with CPO, CFO, VP_SALES, VP_CS personas. Return strict JSON with key panelFeedback: [{persona, score, verdict, rationale, strongestPoint, biggestGap}] and no extra keys. score must be 0-5."
        },
        {
          role: "user",
          content: JSON.stringify({
            caseTitle: input.caseScenario.title,
            company: input.caseScenario.company,
            decisionPrompt: input.caseScenario.decisionPrompt,
            finalMemo: input.finalMemo,
            rubric,
            signals
          })
        }
      ]
    };

    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    const raw = result?.choices?.[0]?.message?.content;

    if (typeof raw !== "string") {
      return null;
    }

    const parsed = JSON.parse(stripCodeFences(raw));
    const candidate = parsed?.panelFeedback;

    if (!Array.isArray(candidate) || candidate.length !== 4) {
      return null;
    }

    return candidate.map((entry) => PanelFeedbackSchema.parse(entry));
  } catch {
    return null;
  }
}

function buildMissingEvidence(signals: SignalChecks): string[] {
  const missing: string[] = [];

  if (!signals.assumptions) {
    missing.push("State explicit assumptions and how you would validate each one.");
  }

  if (!signals.metrics) {
    missing.push("Define success metrics with baseline, target, and decision thresholds.");
  }

  if (!signals.segmentation) {
    missing.push("Specify primary ICP and why adjacent segments are deprioritized.");
  }

  if (!signals.pricing) {
    missing.push("Add pricing/packaging implications and margin tradeoffs.");
  }

  if (!signals.risk) {
    missing.push("Call out top risks and concrete mitigations with owners.");
  }

  if (!signals.executionPlan) {
    missing.push("Provide a phased rollout plan with 30/60/90-day milestones.");
  }

  if (!signals.tradeoffs) {
    missing.push("Compare at least two alternatives and justify the rejected option.");
  }

  return missing.length > 0 ? missing : ["Evidence quality is strong across core decision dimensions."];
}

function summarizeStrengthsAndBlindSpots(rubric: EvaluationRubric): {
  strengths: string[];
  blindSpots: string[];
  weaknessSignals: { axis: RubricAxis; signal: number }[];
} {
  const axes = Object.entries(rubric) as [RubricAxis, number][];
  const sortedByScore = [...axes].sort((a, b) => b[1] - a[1]);

  const strengths = sortedByScore.slice(0, 4).map(([axis, score]) => {
    return [
      `${AXIS_DESCRIPTIONS[axis]} is a relative strength (${score.toFixed(1)}/5).`,
      AXIS_STRENGTH_GUIDANCE[axis],
      `Maintain this edge by preserving the same evidence quality and explicit tradeoff logic in your next memo.`
    ].join(" ");
  });

  const blindSpots = sortedByScore.slice(-4).map(([axis, score]) => {
    return [
      `${AXIS_DESCRIPTIONS[axis]} needs improvement (${score.toFixed(1)}/5).`,
      AXIS_BLIND_SPOT_GUIDANCE[axis],
      `Next-case drill: ${AXIS_NEXT_CASE_DRILLS[axis]}`
    ].join(" ");
  });

  const weaknessSignals = axes.map(([axis, score]) => ({
    axis,
    signal: Math.round(((5 - score) / 5) * 100) / 100
  }));

  return { strengths, blindSpots, weaknessSignals };
}

function betterDecisionMemoTemplate(input: EvaluateDecisionInput, missingEvidence: string[]): string {
  return [
    `Decision Memo: ${input.caseScenario.title}`,
    "",
    "Recommendation",
    `Choose a focused strategy for ${input.caseScenario.company} that prioritizes one primary segment and one monetization model for the next two quarters.`,
    "",
    "Why This Wins",
    "1. Tightens strategic focus and reduces roadmap dilution.",
    "2. Links product changes to measurable business outcomes.",
    "3. Preserves optionality through explicit guardrails and review checkpoints.",
    "",
    "Execution Plan (90 Days)",
    "1. Week 1-2: finalize ICP, success metrics, and counterfactual baseline.",
    "2. Week 3-6: ship MVP capability and launch controlled cohort rollout.",
    "3. Week 7-12: scale to enterprise segment with CS and sales enablement playbook.",
    "",
    "Metrics and Guardrails",
    "- Adoption: activation rate, cohort retention, and account expansion.",
    "- Economics: gross margin impact, payback period, and attach/conversion trend.",
    "- Risk: quality incidents, support load, and churn indicators.",
    "",
    "Evidence Gaps to Resolve",
    ...missingEvidence.map((item) => `- ${item}`)
  ].join("\n");
}

function averagePanelScore(panelFeedback: PanelFeedback[]): number {
  const total = panelFeedback.reduce((sum, entry) => sum + entry.score, 0);
  return total / panelFeedback.length;
}

export async function evaluateDecision(input: EvaluateDecisionInput): Promise<EvaluationResult> {
  const transcriptText = input.transcript.join("\n");
  const combinedText = `${transcriptText}\n\n${input.finalMemo}`;
  const signals = detectSignals(combinedText);
  const rubric = scoreFromSignals(signals, combinedText, input.caseScenario);
  const fallbackPanel = fallbackPanelFromRubric(rubric);
  const llmPanel = input.llmConfig
    ? await llmPanelFeedback(input.llmConfig, input, rubric, signals)
    : null;
  const panelFeedback = llmPanel ?? fallbackPanel;

  const rubricScore = weightedRubricScore(rubric);
  const panelScore = Math.round(((averagePanelScore(panelFeedback) / 5) * 100) * 10) / 10;
  const normalizedScore = Math.round((rubricScore * 0.7 + panelScore * 0.3) * 10) / 10;

  const missingEvidence = buildMissingEvidence(signals);
  const summary = summarizeStrengthsAndBlindSpots(rubric);

  const result: EvaluationResult = {
    id: randomUUID(),
    sessionId: input.sessionId,
    caseId: input.caseScenario.id,
    normalizedScore,
    rubric,
    panelFeedback,
    strengths: summary.strengths,
    blindSpots: summary.blindSpots,
    missingEvidence,
    betterDecisionMemo: betterDecisionMemoTemplate(input, missingEvidence),
    weaknessSignals: summary.weaknessSignals,
    createdAt: new Date().toISOString()
  };

  return EvaluationResultSchema.parse(result);
}
