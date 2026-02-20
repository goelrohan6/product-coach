import {
  CaseExpandedBriefSchema,
  type CaseExpandedBrief,
  type CitationRecord
} from "@coach/core-types";

type ExpandedBriefCaseSeed = {
  slug: string;
  title: string;
  company: string;
  year: number;
  domain: string;
  context: string;
  keyDecision: string;
  result: string;
  primaryCitation: CitationRecord;
  tags?: string[];
};

type ExpandedBriefWeekTemplate = {
  week: number;
  title: string;
  competencyFocus: string[];
  knowns: string[];
  unknowns: string[];
  constraints: string[];
  cases: ExpandedBriefCaseSeed[];
};

function compact(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stakeholders(seed: ExpandedBriefCaseSeed, template: ExpandedBriefWeekTemplate): string[] {
  return [
    `CPO tension: protect long-term strategic coherence while committing to ${template.competencyFocus[0]} decisions now.`,
    `CFO tension: demand downside visibility before resourcing ${seed.keyDecision.toLowerCase()} in this planning window.`,
    `VP Sales tension: push for near-term win-rate impact without overpromising capabilities not yet ready.`,
    `VP CS tension: reduce adoption and renewal risk while operating inside fixed onboarding capacity constraints.`
  ];
}

function decisionOptions(seed: ExpandedBriefCaseSeed): Array<{ option: string; upside: string; downside: string }> {
  return [
    {
      option: `Option A: Commit fully to ${seed.keyDecision.toLowerCase()}.`,
      upside: "Creates clear strategic focus and tighter cross-functional execution alignment.",
      downside: "Raises short-term execution risk if enablement and sequencing are not tightly managed."
    },
    {
      option: "Option B: Phase the move with one pilot segment before broad rollout.",
      upside: "Improves learning quality and reduces reversible risk in the first quarter.",
      downside: "Can delay meaningful business impact and weaken internal urgency."
    },
    {
      option: "Option C: Preserve current motion and optimize local wins.",
      upside: "Protects immediate predictability for pipeline and delivery teams.",
      downside: "Leaves structural strategic risks unresolved under rising competitive pressure."
    }
  ];
}

function buildExpandedBrief(
  template: ExpandedBriefWeekTemplate,
  seed: ExpandedBriefCaseSeed
): CaseExpandedBrief {
  const historyToDate = compact(
    `${seed.company} entered ${seed.year} with meaningful traction in ${seed.domain}, but leadership saw growing friction between existing growth motion and enterprise expectations. ` +
      `The operating signal was consistent: ${seed.context} Teams were already debating whether the current product and GTM posture could sustain durable expansion without stronger governance, monetization clarity, and execution discipline. ` +
      `This case represents the moment when leadership had to move from incremental optimization to an explicit strategic choice with visible tradeoffs.`
  );

  const currentOperatingContext = compact(
    `Week ${template.week} focuses on ${template.title.toLowerCase()}, so this scenario is evaluated through that lens. ` +
      `Known operating signals include ${template.knowns[0].toLowerCase()} and ${template.knowns[1].toLowerCase()} ` +
      `At the same time, unresolved uncertainty remains around ${template.unknowns[0].toLowerCase()} and ${template.unknowns[1].toLowerCase()}`
  );

  const problemStatement = compact(
    `${seed.company} must decide whether to ${seed.keyDecision.toLowerCase()} while operating under practical constraints such as ${template.constraints[0].toLowerCase()} ` +
      `and ${template.constraints[1].toLowerCase()} The core problem is selecting a path that improves strategic position without breaking economics, trust, or delivery credibility.`
  );

  const whyNow = compact(
    `Delay increases strategic cost because competitive pressure and buyer expectations are already moving faster than internal decision cycles. ` +
      `Leadership also needs a clear narrative before the next planning window so product, sales, and customer success can align on one operating thesis rather than fragmented local goals.`
  );

  const recommendedDirection = compact(
    `Recommended direction: pursue Option A with phased control points. The decision anchor is to ${seed.keyDecision.toLowerCase()} while forcing explicit guardrails on metrics, risk, and rollout sequence. ` +
      `This aligns with the observed outcome signal in the case: ${seed.result}`
  );

  const brief: CaseExpandedBrief = {
    historyToDate,
    currentOperatingContext,
    problemStatement,
    whyNow,
    stakeholderTensions: stakeholders(seed, template),
    decisionOptions: decisionOptions(seed),
    recommendedDirection,
    executionPlan30_60_90: [
      "First 30 days: lock the ICP, decision rights, and evidence baseline; publish one-page decision memo with explicit non-goals.",
      "By day 60: ship controlled rollout for priority segment, launch GTM/CS enablement, and track guardrail metrics weekly.",
      "By day 90: decide scale, hold, or pivot based on pre-defined threshold metrics, renewal risk signals, and delivery quality." 
    ],
    successMetrics: [
      "Segment-level activation and early retention trend improve versus baseline cohort.",
      "Expansion pipeline quality rises with clearer qualification and packaging narrative.",
      "Gross margin and support load remain inside guardrail thresholds through rollout.",
      "Executive team alignment increases as one strategy narrative drives roadmap and GTM decisions."
    ],
    riskRegister: [
      "Execution risk: sequencing gaps create delivery churn and weaken trust with field teams.",
      "Economic risk: monetization shifts add complexity before clear customer value is proven.",
      "Adoption risk: enterprise controls improve procurement fit but slow first-value time for some cohorts.",
      "Organizational risk: ambiguous ownership between product, sales, and CS reduces decision velocity."
    ],
    openQuestions: [
      "Which leading indicator in the next quarter should force a hold or reversal?",
      "What scope should be explicitly deferred to protect execution quality in this cycle?",
      "How will leadership reconcile segment-specific asks that conflict with platform coherence?"
    ],
    nonGoals: [
      "Do not attempt a full operating-model redesign in the same quarter as strategic repositioning.",
      "Do not optimize for vanity growth metrics that are disconnected from durable account value.",
      "Do not introduce bespoke commitments that cannot be supported by repeatable product capability."
    ],
    factsAndAssumptions: [
      `[Fact] Case context: ${seed.context}`,
      `[Fact] Documented decision: ${seed.keyDecision}`,
      `[Fact] Documented result: ${seed.result}`,
      `[Fact] Primary source: ${seed.primaryCitation.sourceTitle} (${seed.primaryCitation.url})`,
      "[Inference] Board-level scrutiny will increase if near-term margin and execution guardrails are not explicit.",
      "[Inference] Field teams will require tighter segmentation and enablement before scaling this strategy."
    ]
  };

  return CaseExpandedBriefSchema.parse(brief);
}

export function buildExpandedBriefsBySlug(
  weeks: ExpandedBriefWeekTemplate[]
): Record<string, CaseExpandedBrief> {
  const bySlug: Record<string, CaseExpandedBrief> = {};

  for (const week of weeks) {
    for (const seed of week.cases) {
      if (bySlug[seed.slug]) {
        throw new Error(`Duplicate expanded brief slug: ${seed.slug}`);
      }

      bySlug[seed.slug] = buildExpandedBrief(week, seed);
    }
  }

  return bySlug;
}
