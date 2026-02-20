import {
  CaseScenarioSchema,
  CurriculumWeekSchema,
  type CaseScenario,
  type CitationRecord,
  type CurriculumWeek,
  type RubricAxis,
  RUBRIC_AXES
} from "@coach/core-types";
import { buildExpandedBriefsBySlug } from "./expanded-briefs.js";

type CaseSeed = {
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

type WeekTemplate = {
  week: number;
  title: string;
  competencyFocus: string[];
  knowns: string[];
  unknowns: string[];
  constraints: string[];
  cases: CaseSeed[];
};

const COMPANY_REFERENCE: Record<string, { sourceTitle: string; url: string }> = {
  Slack: { sourceTitle: "Slack company updates", url: "https://slack.com/blog" },
  Atlassian: { sourceTitle: "Atlassian investor relations", url: "https://investors.atlassian.com" },
  Zoom: { sourceTitle: "Zoom investor relations", url: "https://investors.zoom.us" },
  Datadog: { sourceTitle: "Datadog investor relations", url: "https://investors.datadoghq.com" },
  Snowflake: { sourceTitle: "Snowflake investor relations", url: "https://investors.snowflake.com" },
  HubSpot: { sourceTitle: "HubSpot investor relations", url: "https://ir.hubspot.com" },
  Notion: { sourceTitle: "Notion product updates", url: "https://www.notion.com/releases" },
  Figma: { sourceTitle: "Figma enterprise resources", url: "https://www.figma.com/enterprise" },
  Canva: { sourceTitle: "Canva enterprise resources", url: "https://www.canva.com/canva-enterprise" },
  Salesforce: { sourceTitle: "Salesforce investor relations", url: "https://investor.salesforce.com" },
  Adobe: { sourceTitle: "Adobe investor relations", url: "https://investor.adobe.com" },
  Twilio: { sourceTitle: "Twilio investor relations", url: "https://investors.twilio.com" },
  MongoDB: { sourceTitle: "MongoDB investor relations", url: "https://investors.mongodb.com" },
  GitLab: { sourceTitle: "GitLab handbook", url: "https://about.gitlab.com/handbook" },
  AWS: { sourceTitle: "AWS news", url: "https://aws.amazon.com/about-aws/whats-new" },
  Amplitude: { sourceTitle: "Amplitude resources", url: "https://amplitude.com/resources" },
  Stripe: { sourceTitle: "Stripe docs", url: "https://docs.stripe.com" },
  Cloudflare: { sourceTitle: "Cloudflare investor relations", url: "https://ir.cloudflare.com" },
  Intercom: { sourceTitle: "Intercom blog", url: "https://www.intercom.com/blog" },
  Microsoft: { sourceTitle: "Microsoft investor relations", url: "https://www.microsoft.com/en-us/Investor" },
  ServiceNow: { sourceTitle: "ServiceNow investor relations", url: "https://investors.servicenow.com" },
  Shopify: { sourceTitle: "Shopify investor relations", url: "https://investors.shopify.com" },
  Miro: { sourceTitle: "Miro blog", url: "https://miro.com/blog" },
  Asana: { sourceTitle: "Asana investor relations", url: "https://investors.asana.com" },
  CrowdStrike: { sourceTitle: "CrowdStrike investor relations", url: "https://ir.crowdstrike.com" },
  Okta: { sourceTitle: "Okta investor relations", url: "https://investor.okta.com" },
  "monday.com": { sourceTitle: "monday.com investor relations", url: "https://ir.monday.com" },
  Databricks: { sourceTitle: "Databricks blog", url: "https://www.databricks.com/blog" },
  Google: { sourceTitle: "Google Cloud blog", url: "https://cloud.google.com/blog" },
  GitHub: { sourceTitle: "GitHub blog", url: "https://github.blog" },
  Zendesk: { sourceTitle: "Zendesk investor relations", url: "https://investor.zendesk.com" },
  Dropbox: { sourceTitle: "Dropbox investor relations", url: "https://investors.dropbox.com" }
};

const WEEK_TEMPLATES: WeekTemplate[] = [
  {
    week: 1,
    title: "Strategic Wedges and ICP Precision",
    competencyFocus: ["strategy", "icp", "segmentation", "business-economics"],
    knowns: [
      "Bottom-up adoption exists but monetization in enterprise accounts is inconsistent.",
      "Sales feedback indicates expansion blockers tied to missing governance and compliance.",
      "Competition is increasing from bundled incumbents with procurement leverage."
    ],
    unknowns: [
      "How much willingness-to-pay exists for advanced admin and security controls.",
      "Whether moving upmarket will hurt organic product-led growth loops.",
      "How quickly field sales can turn product upgrades into closed-won revenue."
    ],
    constraints: [
      "Roadmap capacity is fixed for two quarters.",
      "Any new enterprise capability must not degrade SMB activation.",
      "Gross margin profile must stay within board guidance."
    ],
    cases: [
      {
        slug: "slack-enterprise-grid",
        title: "Slack: Enterprise Grid as an Upmarket Wedge",
        company: "Slack",
        year: 2017,
        domain: "Collaboration SaaS",
        context:
          "Slack had strong team-level pull but large enterprises demanded centralized governance, data controls, and legal review paths before broad rollout.",
        keyDecision:
          "Invest in Enterprise Grid as a dedicated upmarket product line despite uncertain short-term conversion lift.",
        result:
          "Enterprise contract value expanded, and Slack improved strategic position in larger accounts before intense bundling pressure arrived.",
        primaryCitation: {
          sourceTitle: "Introducing Slack Enterprise Grid",
          url: "https://slack.com/blog/news/introducing-slack-enterprise-grid",
          sourceType: "official_blog",
          publishedAt: "2017-01-31",
          confidence: 0.84
        },
        tags: ["platform", "enterprise-governance", "upmarket"]
      },
      {
        slug: "atlassian-enterprise-plg",
        title: "Atlassian: PLG DNA While Expanding Enterprise Footprint",
        company: "Atlassian",
        year: 2019,
        domain: "Dev Collaboration SaaS",
        context:
          "Atlassian resisted traditional high-touch sales while customer deal sizes and enterprise security demands were growing.",
        keyDecision:
          "Retain PLG core motion and add enterprise readiness layers instead of shifting to a pure sales-led model.",
        result:
          "The company preserved efficient growth while increasing enterprise credibility through cloud and governance investments.",
        primaryCitation: {
          sourceTitle: "Atlassian shareholder letters",
          url: "https://investors.atlassian.com/financials/quarterly-results/default.aspx",
          sourceType: "shareholder_letter",
          publishedAt: "2019-10-31",
          confidence: 0.78
        },
        tags: ["plg", "enterprise", "sales-model"]
      },
      {
        slug: "zoom-security-reset",
        title: "Zoom: Security Reset While Preserving Growth",
        company: "Zoom",
        year: 2020,
        domain: "Communications SaaS",
        context:
          "Explosive adoption exposed security and trust gaps that threatened enterprise expansion despite massive usage growth.",
        keyDecision:
          "Pause feature velocity to run a 90-day security and privacy program led by product and engineering leadership.",
        result:
          "Trust recovery enabled stronger enterprise adoption and reduced strategic risk in regulated segments.",
        primaryCitation: {
          sourceTitle: "Zoom 90-day security plan",
          url: "https://blog.zoom.us/90-day-security-plan-progress-report-april-22/",
          sourceType: "official_blog",
          publishedAt: "2020-04-22",
          confidence: 0.86
        },
        tags: ["trust", "risk", "enterprise-security"]
      },
      {
        slug: "datadog-land-expand",
        title: "Datadog: Multi-Product Land-and-Expand",
        company: "Datadog",
        year: 2021,
        domain: "Observability",
        context:
          "Datadog saw strong initial footholds with infrastructure monitoring and had to choose how aggressively to add adjacent products.",
        keyDecision:
          "Use a shared platform and unified data model to drive module attach rather than building isolated point features.",
        result:
          "Cross-sell and net retention improved as multi-product adoption became a core growth driver.",
        primaryCitation: {
          sourceTitle: "Datadog annual shareholder letter",
          url: "https://investors.datadoghq.com/financials/default.aspx",
          sourceType: "shareholder_letter",
          publishedAt: "2021-12-31",
          confidence: 0.75
        },
        tags: ["land-expand", "platform", "retention"]
      },
      {
        slug: "snowflake-consumption-architecture",
        title: "Snowflake: Compute/Storage Separation as Strategic Wedge",
        company: "Snowflake",
        year: 2020,
        domain: "Data Cloud",
        context:
          "Snowflake needed to prove a differentiated enterprise value proposition against incumbent data warehouse models.",
        keyDecision:
          "Commit to an architecture and pricing model that separated compute and storage with consumption-based economics.",
        result:
          "The model supported broad workload expansion and became a foundation for durable enterprise growth.",
        primaryCitation: {
          sourceTitle: "Snowflake S-1 filing",
          url: "https://www.sec.gov/ixviewer/ix.html?doc=/Archives/edgar/data/1640147/000119312520220774/d32881ds1.htm",
          sourceType: "regulatory_filing",
          publishedAt: "2020-08-24",
          confidence: 0.9
        },
        tags: ["pricing", "architecture", "boss-case"]
      }
    ]
  },
  {
    week: 2,
    title: "Segmentation and Positioning Under Competitive Pressure",
    competencyFocus: ["segmentation", "positioning", "customer-jobs", "gtm"],
    knowns: [
      "Different segments are buying the product for materially different jobs-to-be-done.",
      "Messaging consistency is breaking as product surface area expands.",
      "Win/loss data shows performance varies significantly by segment and use case."
    ],
    unknowns: [
      "Whether tighter segmentation will increase CAC in lower-value segments.",
      "How far packaging should diverge before product complexity hurts usability.",
      "What positioning narrative can scale across sales, marketing, and product."
    ],
    constraints: [
      "No headcount increase this quarter for GTM enablement.",
      "Positioning changes must be reflected in pricing and onboarding quickly.",
      "Existing enterprise customers cannot lose critical capability."
    ],
    cases: [
      {
        slug: "hubspot-multi-hub-segmentation",
        title: "HubSpot: Multi-Hub Segmentation Strategy",
        company: "HubSpot",
        year: 2021,
        domain: "CRM and Marketing SaaS",
        context:
          "HubSpot evolved from marketing automation into a multi-product platform serving SMB and increasingly mid-market customers.",
        keyDecision:
          "Position distinct hubs around team-specific value while preserving a unified CRM core for cross-sell.",
        result:
          "The model improved expansion pathways while protecting clarity for first-time buyers.",
        primaryCitation: {
          sourceTitle: "HubSpot investor updates",
          url: "https://ir.hubspot.com/financials/quarterly-results/default.aspx",
          sourceType: "investor_relations",
          publishedAt: "2021-11-03",
          confidence: 0.76
        },
        tags: ["platform-positioning", "cross-sell"]
      },
      {
        slug: "notion-enterprise-controls",
        title: "Notion: Positioning Beyond Individual Productivity",
        company: "Notion",
        year: 2023,
        domain: "Knowledge Work SaaS",
        context:
          "Notion's bottom-up adoption was strong, but enterprise buyers required admin, security, and integration maturity.",
        keyDecision:
          "Reposition as a company-wide operating workspace with explicit enterprise governance and reliability commitments.",
        result:
          "Enterprise adoption improved as procurement concerns were addressed without abandoning product simplicity.",
        primaryCitation: {
          sourceTitle: "Notion enterprise product updates",
          url: "https://www.notion.so/releases",
          sourceType: "official_blog",
          publishedAt: "2023-09-01",
          confidence: 0.71
        },
        tags: ["upmarket", "positioning", "security"]
      },
      {
        slug: "figma-enterprise-design-system",
        title: "Figma: Enterprise Design System Positioning",
        company: "Figma",
        year: 2022,
        domain: "Design Collaboration",
        context:
          "Figma's collaborative workflow resonated broadly, but enterprise buyers needed control over design system governance and access.",
        keyDecision:
          "Elevate enterprise positioning around cross-functional design operations and governance, not only designer productivity.",
        result:
          "Larger accounts expanded usage into product, engineering, and brand operations.",
        primaryCitation: {
          sourceTitle: "Figma enterprise offering",
          url: "https://www.figma.com/enterprise",
          sourceType: "official_blog",
          publishedAt: "2022-06-01",
          confidence: 0.73
        },
        tags: ["design-ops", "segmentation"]
      },
      {
        slug: "canva-teams-enterprise-positioning",
        title: "Canva: Team-to-Enterprise Positioning Shift",
        company: "Canva",
        year: 2023,
        domain: "Visual Collaboration",
        context:
          "Canva needed to move from creator-led adoption to business-critical workflow adoption in marketing and communications orgs.",
        keyDecision:
          "Position Teams and Enterprise around brand governance, approvals, and scale rather than low-friction creation alone.",
        result:
          "Commercial traction improved in larger organizations where governance had blocked expansion.",
        primaryCitation: {
          sourceTitle: "Canva enterprise overview",
          url: "https://www.canva.com/canva-enterprise",
          sourceType: "official_blog",
          publishedAt: "2023-10-04",
          confidence: 0.68
        },
        tags: ["brand-governance", "enterprise"]
      },
      {
        slug: "salesforce-industry-clouds",
        title: "Salesforce: Industry Clouds as Segment Strategy",
        company: "Salesforce",
        year: 2021,
        domain: "Enterprise CRM",
        context:
          "Salesforce faced a question of vertical depth versus horizontal scale as enterprise buying shifted toward industry-specific requirements.",
        keyDecision:
          "Invest in industry cloud variants with tailored workflows, data models, and compliance narratives for priority verticals.",
        result:
          "Vertical relevance improved deal quality in regulated industries and reinforced platform defensibility.",
        primaryCitation: {
          sourceTitle: "Salesforce industry clouds",
          url: "https://www.salesforce.com/solutions/industries/overview",
          sourceType: "official_blog",
          publishedAt: "2021-09-22",
          confidence: 0.79
        },
        tags: ["verticalization", "boss-case"]
      }
    ]
  },
  {
    week: 3,
    title: "Pricing Architecture and Monetization Design",
    competencyFocus: ["pricing", "unit-economics", "packaging", "retention"],
    knowns: [
      "Acquisition efficiency is healthy, but monetization quality is uneven by cohort.",
      "Current packaging creates friction between perceived value and pricing metric.",
      "Competitive alternatives use different pricing models, affecting procurement comparisons."
    ],
    unknowns: [
      "How a pricing shift will impact retention in long-tail customer cohorts.",
      "Which metric best aligns price with realized customer value over time.",
      "How sales compensation should adjust to new packaging."
    ],
    constraints: [
      "Revenue predictability cannot deteriorate materially over the next two quarters.",
      "Grandfathering policy must be explicit for existing customers.",
      "Billing and invoicing systems cannot be fully rebuilt in this cycle."
    ],
    cases: [
      {
        slug: "adobe-creative-cloud-subscription",
        title: "Adobe: Perpetual License to Subscription",
        company: "Adobe",
        year: 2013,
        domain: "Creative Software",
        context:
          "Adobe had a successful perpetual license model but needed a stronger recurring revenue base and faster product delivery cadence.",
        keyDecision:
          "Transition flagship products to Creative Cloud subscriptions despite near-term revenue and customer sentiment risk.",
        result:
          "The recurring model improved long-term growth and operating leverage after a difficult transition period.",
        primaryCitation: {
          sourceTitle: "Adobe annual report",
          url: "https://investor.adobe.com/financial-reports/annual-reports/default.aspx",
          sourceType: "shareholder_letter",
          publishedAt: "2013-12-01",
          confidence: 0.88
        },
        tags: ["subscription", "transformation"]
      },
      {
        slug: "twilio-committed-use-pricing",
        title: "Twilio: Usage Pricing with Commitment Upside",
        company: "Twilio",
        year: 2022,
        domain: "Communications API",
        context:
          "Twilio's pure consumption model gave flexibility but made revenue planning and enterprise procurement conversations harder.",
        keyDecision:
          "Layer enterprise commitments and strategic pricing structures on top of usage economics to improve predictability.",
        result:
          "Enterprise deal quality improved while preserving developer-friendly entry points.",
        primaryCitation: {
          sourceTitle: "Twilio investor materials",
          url: "https://investors.twilio.com/financial-information/quarterly-results",
          sourceType: "investor_relations",
          publishedAt: "2022-11-03",
          confidence: 0.72
        },
        tags: ["consumption", "enterprise-pricing"]
      },
      {
        slug: "mongodb-atlas-consumption",
        title: "MongoDB Atlas: Value-Aligned Consumption Monetization",
        company: "MongoDB",
        year: 2021,
        domain: "Database Platform",
        context:
          "MongoDB needed Atlas pricing to scale from developer experimentation to enterprise production workloads without value leakage.",
        keyDecision:
          "Double down on a consumption-led cloud model with better controls for commitment pathways and enterprise governance.",
        result:
          "Atlas became a central growth engine with strong expansion behavior.",
        primaryCitation: {
          sourceTitle: "MongoDB annual report",
          url: "https://investors.mongodb.com/financial-information/annual-reports",
          sourceType: "shareholder_letter",
          publishedAt: "2021-03-31",
          confidence: 0.77
        },
        tags: ["atlas", "expansion", "cloud"]
      },
      {
        slug: "gitlab-tier-packaging",
        title: "GitLab: Tier and Packaging Simplification",
        company: "GitLab",
        year: 2020,
        domain: "DevOps Platform",
        context:
          "GitLab's broad feature set created packaging complexity and difficulty communicating differentiated enterprise value.",
        keyDecision:
          "Simplify tiers and package enterprise-critical controls to reduce sales friction and improve conversion quality.",
        result:
          "Clearer packaging improved buyer comprehension and reduced negotiation complexity.",
        primaryCitation: {
          sourceTitle: "GitLab pricing direction",
          url: "https://about.gitlab.com/pricing/",
          sourceType: "official_blog",
          publishedAt: "2020-10-01",
          confidence: 0.68
        },
        tags: ["packaging", "simplicity"]
      },
      {
        slug: "aws-savings-plans",
        title: "AWS: Commitment Pricing via Savings Plans",
        company: "AWS",
        year: 2019,
        domain: "Cloud Infrastructure",
        context:
          "Customers wanted simpler commitment economics than Reserved Instances while AWS needed predictable long-term consumption.",
        keyDecision:
          "Launch Savings Plans to align flexibility with commitment-based discounting across workloads.",
        result:
          "AWS improved enterprise commitment adoption while reducing pricing-model complexity for buyers.",
        primaryCitation: {
          sourceTitle: "Introducing AWS Savings Plans",
          url: "https://aws.amazon.com/blogs/aws/new-for-aws-savings-plans",
          sourceType: "official_blog",
          publishedAt: "2019-11-04",
          confidence: 0.87
        },
        tags: ["commitments", "boss-case", "pricing-architecture"]
      }
    ]
  },
  {
    week: 4,
    title: "Metrics, Instrumentation, and Decision Loops",
    competencyFocus: ["metrics", "analytics", "experimentation", "decision-quality"],
    knowns: [
      "Core growth metrics are trending, but causality behind movement is unclear.",
      "Teams optimize for different local metrics that may conflict with enterprise value.",
      "Instrumentation quality varies and weakens confidence in strategic decisions."
    ],
    unknowns: [
      "Which metrics best proxy long-term account value and retention quality.",
      "Whether observed improvements are due to product changes or external demand shifts.",
      "How to align product, sales, and CS on one metrics hierarchy."
    ],
    constraints: [
      "Leadership expects a measurable lift within a quarter.",
      "Data platform bandwidth is limited for net-new instrumentation.",
      "Metrics changes must remain interpretable by GTM teams."
    ],
    cases: [
      {
        slug: "amplitude-north-star",
        title: "Amplitude: Operationalizing North Star Metrics",
        company: "Amplitude",
        year: 2021,
        domain: "Product Analytics",
        context:
          "Amplitude needed to help enterprises move from dashboard reporting to behavior-driven product decisions tied to outcomes.",
        keyDecision:
          "Anchor go-to-market and product narratives around a North Star framework and measurable behavior loops.",
        result:
          "Customer value realization improved as teams connected product work to business outcomes.",
        primaryCitation: {
          sourceTitle: "Amplitude North Star framework",
          url: "https://amplitude.com/blog/north-star-metric",
          sourceType: "official_blog",
          publishedAt: "2021-05-20",
          confidence: 0.74
        },
        tags: ["north-star", "product-analytics"]
      },
      {
        slug: "stripe-checkout-experimentation",
        title: "Stripe: Experimentation Around Checkout Conversion",
        company: "Stripe",
        year: 2022,
        domain: "Payments Infrastructure",
        context:
          "Stripe needed to balance conversion gains, fraud risk, and integration complexity while improving checkout performance.",
        keyDecision:
          "Prioritize a metrics-led experimentation system for checkout flow improvements with explicit guardrails on risk.",
        result:
          "Conversion improvements were achieved while maintaining reliability and risk controls.",
        primaryCitation: {
          sourceTitle: "Stripe Checkout documentation",
          url: "https://docs.stripe.com/payments/checkout",
          sourceType: "official_blog",
          publishedAt: "2022-01-10",
          confidence: 0.69
        },
        tags: ["experimentation", "conversion", "risk"]
      },
      {
        slug: "cloudflare-conversion-metrics",
        title: "Cloudflare: Self-Serve to Enterprise Conversion Metrics",
        company: "Cloudflare",
        year: 2023,
        domain: "Network and Security Platform",
        context:
          "Cloudflare's self-serve funnel generated broad adoption, but enterprise conversion quality varied by product family and segment.",
        keyDecision:
          "Rebuild funnel instrumentation and account-scoring signals to prioritize high-potential enterprise pathways.",
        result:
          "Sales efficiency improved as product-qualified signals became more reliable.",
        primaryCitation: {
          sourceTitle: "Cloudflare annual report",
          url: "https://ir.cloudflare.com/financials/sec-filings/default.aspx",
          sourceType: "regulatory_filing",
          publishedAt: "2023-12-31",
          confidence: 0.72
        },
        tags: ["pql", "funnel-metrics"]
      },
      {
        slug: "intercom-fin-metrics",
        title: "Intercom: AI Support Metrics That Matter",
        company: "Intercom",
        year: 2024,
        domain: "Customer Support SaaS",
        context:
          "Intercom's AI support capabilities needed clear outcome metrics beyond novelty adoption to prove durable customer value.",
        keyDecision:
          "Define success around resolution quality, deflection value, and handoff reliability rather than top-line usage alone.",
        result:
          "Customers adopted AI workflows with stronger confidence in business impact.",
        primaryCitation: {
          sourceTitle: "Intercom Fin updates",
          url: "https://www.intercom.com/fin",
          sourceType: "official_blog",
          publishedAt: "2024-04-01",
          confidence: 0.67
        },
        tags: ["ai-metrics", "support"]
      },
      {
        slug: "microsoft-teams-activation-metrics",
        title: "Microsoft Teams: Activation Over Vanity Growth",
        company: "Microsoft",
        year: 2020,
        domain: "Collaboration Platform",
        context:
          "Teams scaled rapidly and leadership needed metrics that represented durable collaboration behavior, not transient spikes.",
        keyDecision:
          "Prioritize activation and multi-surface collaboration metrics to guide roadmap and enterprise adoption bets.",
        result:
          "Teams strengthened enterprise usage depth and expanded strategic role within Microsoft 365.",
        primaryCitation: {
          sourceTitle: "Microsoft earnings transcripts",
          url: "https://www.microsoft.com/en-us/Investor/earnings/default.aspx",
          sourceType: "earnings_call",
          publishedAt: "2020-07-22",
          confidence: 0.76
        },
        tags: ["boss-case", "activation", "engagement"]
      }
    ]
  },
  {
    week: 5,
    title: "Enterprise Discovery and Customer-Centric Roadmapping",
    competencyFocus: ["customer-discovery", "roadmapping", "stakeholder-management", "execution"],
    knowns: [
      "Top enterprise prospects request custom capabilities that may not generalize.",
      "Customer requests conflict across segments and use cases.",
      "Discovery signal quality differs between champions, admins, and economic buyers."
    ],
    unknowns: [
      "Which customer asks represent strategic patterns versus one-off needs.",
      "How fast roadmap changes must land to influence renewal outcomes.",
      "What discovery mechanism produces the highest signal-to-noise ratio."
    ],
    constraints: [
      "Engineering allocation for net-new features is capped this cycle.",
      "Sales commitments already made cannot be fully reversed.",
      "Platform reliability objectives remain non-negotiable."
    ],
    cases: [
      {
        slug: "servicenow-customer-councils",
        title: "ServiceNow: Customer Councils to Prioritize Workflow Expansion",
        company: "ServiceNow",
        year: 2022,
        domain: "Enterprise Workflow Platform",
        context:
          "ServiceNow had broad platform demand but needed sharper enterprise discovery to prioritize which workflows to scale next.",
        keyDecision:
          "Institutionalize executive customer councils and outcome-based prioritization for roadmap sequencing.",
        result:
          "Roadmap focus improved and enterprise expansion became more repeatable across verticals.",
        primaryCitation: {
          sourceTitle: "ServiceNow investor presentations",
          url: "https://investors.servicenow.com/financial-information/presentations/default.aspx",
          sourceType: "investor_relations",
          publishedAt: "2022-11-10",
          confidence: 0.71
        },
        tags: ["customer-councils", "workflow"]
      },
      {
        slug: "shopify-plus-b2b-features",
        title: "Shopify Plus: B2B Feature Prioritization",
        company: "Shopify",
        year: 2023,
        domain: "Commerce Platform",
        context:
          "Shopify needed to serve larger merchants with B2B procurement workflows while preserving ease-of-use for core segments.",
        keyDecision:
          "Prioritize native B2B capabilities informed by merchant workflow research rather than bespoke enterprise customizations.",
        result:
          "Shopify improved enterprise merchant relevance without abandoning core product velocity.",
        primaryCitation: {
          sourceTitle: "Shopify B2B on Shopify",
          url: "https://www.shopify.com/enterprise/b2b",
          sourceType: "official_blog",
          publishedAt: "2023-09-01",
          confidence: 0.74
        },
        tags: ["merchant-discovery", "b2b-commerce"]
      },
      {
        slug: "miro-enterprise-governance",
        title: "Miro: Governance Requests from Regulated Enterprises",
        company: "Miro",
        year: 2022,
        domain: "Visual Collaboration",
        context:
          "Miro's adoption in large accounts surfaced demands for governance, data control, and admin workflows beyond collaboration canvas features.",
        keyDecision:
          "Sequence enterprise governance capabilities based on repeatable pain patterns across regulated design partners.",
        result:
          "Enterprise readiness improved and expansion risk in sensitive sectors declined.",
        primaryCitation: {
          sourceTitle: "Miro enterprise page",
          url: "https://miro.com/enterprise",
          sourceType: "official_blog",
          publishedAt: "2022-08-15",
          confidence: 0.66
        },
        tags: ["governance", "regulated-markets"]
      },
      {
        slug: "asana-work-graph-discovery",
        title: "Asana: Discovery for Work Graph Expansion",
        company: "Asana",
        year: 2021,
        domain: "Work Management",
        context:
          "Asana sought deeper enterprise value by connecting project coordination to broader cross-functional execution outcomes.",
        keyDecision:
          "Use structured enterprise discovery programs to prioritize capabilities that strengthened work graph adoption.",
        result:
          "Larger customers increased adoption depth as features mapped to executive planning needs.",
        primaryCitation: {
          sourceTitle: "Asana investor updates",
          url: "https://investors.asana.com/financial-information/quarterly-results",
          sourceType: "investor_relations",
          publishedAt: "2021-12-02",
          confidence: 0.7
        },
        tags: ["discovery", "work-graph"]
      },
      {
        slug: "atlassian-cloud-migration-discovery",
        title: "Atlassian: Cloud Migration Discovery at Scale",
        company: "Atlassian",
        year: 2022,
        domain: "Dev Collaboration SaaS",
        context:
          "Atlassian needed to move a large installed base from server/data center to cloud while reducing enterprise migration risk.",
        keyDecision:
          "Run structured discovery and migration pathways to align cloud roadmap decisions with highest-friction enterprise blockers.",
        result:
          "Cloud transition accelerated with better customer confidence and fewer critical migration failures.",
        primaryCitation: {
          sourceTitle: "Atlassian cloud migration resources",
          url: "https://www.atlassian.com/migration",
          sourceType: "official_blog",
          publishedAt: "2022-02-15",
          confidence: 0.78
        },
        tags: ["boss-case", "migration", "installed-base"]
      }
    ]
  },
  {
    week: 6,
    title: "GTM and Product Alignment for Durable Growth",
    competencyFocus: ["gtm", "sales-alignment", "customer-success", "execution"],
    knowns: [
      "Product usage signals and sales qualification criteria are not fully aligned.",
      "Expansion revenue depends on post-sale adoption quality.",
      "Roadmap decisions are creating unpredictable GTM messaging changes."
    ],
    unknowns: [
      "Which product signals should trigger sales and CS interventions.",
      "How to trade off near-term pipeline with long-term product credibility.",
      "Whether GTM specialization should be by segment, use case, or product line."
    ],
    constraints: [
      "Current quarter targets require maintaining close-rate performance.",
      "CS headcount cannot scale proportionally with account growth.",
      "Any pricing or packaging changes require field enablement within 30 days."
    ],
    cases: [
      {
        slug: "crowdstrike-module-attach",
        title: "CrowdStrike: Module Attach as GTM-Product System",
        company: "CrowdStrike",
        year: 2022,
        domain: "Cybersecurity Platform",
        context:
          "CrowdStrike's platform breadth created strong attach opportunity, but product, sales, and CS motions needed tighter orchestration.",
        keyDecision:
          "Operationalize a shared attach strategy with product sequencing and GTM plays tied to adoption milestones.",
        result:
          "Module penetration and net retention remained strong as the platform expanded.",
        primaryCitation: {
          sourceTitle: "CrowdStrike investor presentations",
          url: "https://ir.crowdstrike.com/financial-information/presentations",
          sourceType: "investor_relations",
          publishedAt: "2022-09-20",
          confidence: 0.76
        },
        tags: ["attach-rate", "platform-gtm"]
      },
      {
        slug: "okta-expand-identity-cloud",
        title: "Okta: Aligning Identity Expansion with Product Readiness",
        company: "Okta",
        year: 2021,
        domain: "Identity and Access Management",
        context:
          "Okta had broad identity demand but needed to align segmentation and product maturity to avoid overpromising in expansion motions.",
        keyDecision:
          "Coordinate GTM positioning with product readiness milestones across workforce and customer identity offerings.",
        result:
          "Expansion quality improved where use-case fit and deployment support were explicitly matched.",
        primaryCitation: {
          sourceTitle: "Okta investor materials",
          url: "https://investor.okta.com/financials/quarterly-results/default.aspx",
          sourceType: "investor_relations",
          publishedAt: "2021-12-01",
          confidence: 0.69
        },
        tags: ["identity", "expansion"]
      },
      {
        slug: "monday-upmarket-packaging",
        title: "monday.com: Upmarket Motion with Product Packaging",
        company: "monday.com",
        year: 2023,
        domain: "Work OS",
        context:
          "monday.com needed to preserve self-serve efficiency while adding enterprise-grade controls and GTM specialization.",
        keyDecision:
          "Introduce enterprise packaging and field alignment that preserved product-led entry while enabling sales-led expansion.",
        result:
          "Enterprise adoption increased without collapsing bottom-up growth efficiency.",
        primaryCitation: {
          sourceTitle: "monday.com investor releases",
          url: "https://ir.monday.com/news-events/press-releases/default.aspx",
          sourceType: "investor_relations",
          publishedAt: "2023-08-14",
          confidence: 0.7
        },
        tags: ["plg-slg-hybrid", "upmarket"]
      },
      {
        slug: "zoom-phone-channel-strategy",
        title: "Zoom Phone: Product Expansion and Channel Strategy",
        company: "Zoom",
        year: 2022,
        domain: "Communications SaaS",
        context:
          "Zoom needed to extend beyond meetings into phone and contact-center opportunities where channel partners were influential.",
        keyDecision:
          "Build GTM-product alignment for Zoom Phone with partner channels and enterprise reliability requirements.",
        result:
          "Product line expansion gained traction in larger accounts through clearer solution positioning.",
        primaryCitation: {
          sourceTitle: "Zoom investor presentations",
          url: "https://investors.zoom.us/financial-information/quarterly-results/default.aspx",
          sourceType: "investor_relations",
          publishedAt: "2022-11-21",
          confidence: 0.72
        },
        tags: ["channels", "adjacent-expansion"]
      },
      {
        slug: "salesforce-slack-bundle",
        title: "Salesforce + Slack: Bundle Integration Strategy",
        company: "Salesforce",
        year: 2023,
        domain: "Enterprise SaaS Platform",
        context:
          "After acquiring Slack, Salesforce had to decide how tightly to bundle collaboration into CRM-led enterprise accounts.",
        keyDecision:
          "Align product roadmap and enterprise GTM messaging around workflow integration instead of loose portfolio coexistence.",
        result:
          "Integrated positioning improved strategic account narratives and strengthened expansion plays.",
        primaryCitation: {
          sourceTitle: "Salesforce and Slack strategy updates",
          url: "https://investor.salesforce.com/financials/quarterly-results/default.aspx",
          sourceType: "earnings_call",
          publishedAt: "2023-03-01",
          confidence: 0.75
        },
        tags: ["boss-case", "integration", "platform-portfolio"]
      }
    ]
  },
  {
    week: 7,
    title: "Platform and Ecosystem Strategy",
    competencyFocus: ["platform", "ecosystem", "moat", "governance"],
    knowns: [
      "Third-party developers can expand product value faster than internal roadmap alone.",
      "Ecosystem quality and trust are uneven across partners.",
      "Platform economics need incentives that balance partner success with core product differentiation."
    ],
    unknowns: [
      "How open the platform should be without sacrificing security and product coherence.",
      "Which partner categories most increase retention and expansion.",
      "What governance model avoids ecosystem fragmentation."
    ],
    constraints: [
      "Platform APIs and policy changes must preserve backward compatibility.",
      "Security and compliance reviews for partners are mandatory.",
      "Internal teams cannot support unlimited partner exception requests."
    ],
    cases: [
      {
        slug: "shopify-app-store-governance",
        title: "Shopify: App Store Governance vs Ecosystem Growth",
        company: "Shopify",
        year: 2022,
        domain: "Commerce Platform",
        context:
          "Shopify's app ecosystem drove merchant value, but quality and fairness concerns required stronger governance choices.",
        keyDecision:
          "Tighten ecosystem policies and platform standards while preserving developer incentives for innovation.",
        result:
          "Merchant trust and platform durability improved, though governance changes required careful partner management.",
        primaryCitation: {
          sourceTitle: "Shopify app ecosystem updates",
          url: "https://www.shopify.com/partners/blog",
          sourceType: "official_blog",
          publishedAt: "2022-06-15",
          confidence: 0.67
        },
        tags: ["ecosystem-governance", "trust"]
      },
      {
        slug: "stripe-connect-ecosystem",
        title: "Stripe Connect: Platform Expansion Through Ecosystem",
        company: "Stripe",
        year: 2023,
        domain: "Payments Infrastructure",
        context:
          "Stripe needed to scale platform use cases for marketplaces and SaaS platforms while handling compliance and payout complexity.",
        keyDecision:
          "Invest in Connect capabilities and partner workflows to become core infrastructure for multi-sided platforms.",
        result:
          "Platform stickiness increased as customers embedded Stripe deeper into their business operations.",
        primaryCitation: {
          sourceTitle: "Stripe Connect docs",
          url: "https://docs.stripe.com/connect",
          sourceType: "official_blog",
          publishedAt: "2023-04-01",
          confidence: 0.73
        },
        tags: ["platform-economics", "integration-depth"]
      },
      {
        slug: "atlassian-marketplace-cloud-incentives",
        title: "Atlassian Marketplace: Cloud-First Partner Incentives",
        company: "Atlassian",
        year: 2021,
        domain: "Dev Collaboration SaaS",
        context:
          "Atlassian's cloud migration required ecosystem participation, but partner economics were tuned for legacy deployment patterns.",
        keyDecision:
          "Shift marketplace incentives and technical guidance toward cloud-native extensions.",
        result:
          "Marketplace momentum aligned better with strategic cloud transition goals.",
        primaryCitation: {
          sourceTitle: "Atlassian marketplace cloud resources",
          url: "https://developer.atlassian.com/platform/marketplace",
          sourceType: "official_blog",
          publishedAt: "2021-08-25",
          confidence: 0.7
        },
        tags: ["marketplace", "cloud-migration"]
      },
      {
        slug: "salesforce-appexchange-governance",
        title: "Salesforce AppExchange: Ecosystem Scale and Trust",
        company: "Salesforce",
        year: 2020,
        domain: "Enterprise CRM",
        context:
          "Salesforce's ecosystem scale created moat value, but enterprise buyers expected consistent security and quality standards across apps.",
        keyDecision:
          "Increase AppExchange governance rigor while keeping partner innovation velocity high.",
        result:
          "Platform trust stayed high in enterprise deals where ecosystem breadth was a buying factor.",
        primaryCitation: {
          sourceTitle: "Salesforce AppExchange overview",
          url: "https://appexchange.salesforce.com",
          sourceType: "official_blog",
          publishedAt: "2020-09-10",
          confidence: 0.69
        },
        tags: ["platform-trust", "enterprise-buying"]
      },
      {
        slug: "azure-oss-marketplace",
        title: "Azure: Open Source Strategy with Commercial Platform Goals",
        company: "Microsoft",
        year: 2022,
        domain: "Cloud Platform",
        context:
          "Azure's enterprise growth required balancing openness to developer ecosystems with strong commercial platform outcomes.",
        keyDecision:
          "Deepen open-source compatibility and marketplace pathways to expand workload adoption without diluting platform economics.",
        result:
          "Azure strengthened developer goodwill while improving enterprise workload capture.",
        primaryCitation: {
          sourceTitle: "Microsoft Build and Azure updates",
          url: "https://azure.microsoft.com/en-us/updates",
          sourceType: "official_blog",
          publishedAt: "2022-05-24",
          confidence: 0.72
        },
        tags: ["boss-case", "open-source", "ecosystem-moat"]
      }
    ]
  },
  {
    week: 8,
    title: "Competitive Strategy and Defensible Positioning",
    competencyFocus: ["competition", "positioning", "defensibility", "resource-allocation"],
    knowns: [
      "Competitors are converging on similar feature narratives.",
      "Procurement leverage from incumbents affects win rates in strategic accounts.",
      "Feature parity races are consuming roadmap capacity with unclear strategic payoff."
    ],
    unknowns: [
      "Which differentiation is durable versus quickly copyable.",
      "How to respond to bundling pressure without destroying pricing power.",
      "Where to invest for moat expansion versus tactical deal defense."
    ],
    constraints: [
      "Quarterly bookings pressure limits long-horizon experimentation.",
      "Any competitive response must remain consistent with product identity.",
      "R&D allocation must balance core reliability and differentiation bets."
    ],
    cases: [
      {
        slug: "teams-bundling-competition",
        title: "Slack vs Teams: Responding to Bundled Competition",
        company: "Microsoft",
        year: 2019,
        domain: "Collaboration Platform",
        context:
          "Microsoft bundled Teams into Microsoft 365, creating pricing and distribution pressure on standalone collaboration products.",
        keyDecision:
          "Compete on depth, ecosystem openness, and workflow quality instead of entering a direct price war.",
        result:
          "Differentiated positioning retained high-value segments despite distribution disadvantages.",
        primaryCitation: {
          sourceTitle: "Microsoft Teams growth updates",
          url: "https://www.microsoft.com/en-us/microsoft-365/blog",
          sourceType: "official_blog",
          publishedAt: "2019-07-11",
          confidence: 0.74
        },
        tags: ["bundling", "distribution-advantage"]
      },
      {
        slug: "cloudflare-platform-consolidation",
        title: "Cloudflare: Platform Consolidation vs Point Solutions",
        company: "Cloudflare",
        year: 2023,
        domain: "Network and Security",
        context:
          "Cloudflare had to decide whether to emphasize broad platform consolidation or narrow best-of-breed narratives in enterprise security.",
        keyDecision:
          "Push integrated platform positioning that reduced tool sprawl and operational complexity for enterprise buyers.",
        result:
          "Cloudflare improved strategic relevance in consolidation-oriented enterprise deals.",
        primaryCitation: {
          sourceTitle: "Cloudflare platform strategy",
          url: "https://www.cloudflare.com/the-net/platform-week",
          sourceType: "official_blog",
          publishedAt: "2023-09-26",
          confidence: 0.68
        },
        tags: ["consolidation", "platform-narrative"]
      },
      {
        slug: "databricks-lakehouse-positioning",
        title: "Databricks: Lakehouse Positioning Against Warehouse Incumbents",
        company: "Databricks",
        year: 2021,
        domain: "Data and AI Platform",
        context:
          "Databricks needed a clear strategic narrative against established data warehouse paradigms while expanding enterprise adoption.",
        keyDecision:
          "Position the lakehouse architecture as a unifying approach for analytics, data engineering, and AI workloads.",
        result:
          "The narrative strengthened enterprise differentiation and influenced category framing.",
        primaryCitation: {
          sourceTitle: "Databricks lakehouse messaging",
          url: "https://www.databricks.com/product/data-lakehouse",
          sourceType: "official_blog",
          publishedAt: "2021-06-29",
          confidence: 0.79
        },
        tags: ["category-design", "architecture-strategy"]
      },
      {
        slug: "google-workspace-security-positioning",
        title: "Google Workspace: Security and AI Positioning in Enterprise",
        company: "Google",
        year: 2024,
        domain: "Productivity SaaS",
        context:
          "Google Workspace needed stronger enterprise differentiation beyond collaboration usability as AI and security became board-level concerns.",
        keyDecision:
          "Position around secure-by-design collaboration and AI assistance integrated with enterprise controls.",
        result:
          "Workspace improved competitive posture in security-conscious enterprise evaluations.",
        primaryCitation: {
          sourceTitle: "Google Workspace updates",
          url: "https://workspace.google.com/blog",
          sourceType: "official_blog",
          publishedAt: "2024-04-09",
          confidence: 0.66
        },
        tags: ["security-positioning", "ai-differentiation"]
      },
      {
        slug: "servicenow-platform-consolidation",
        title: "ServiceNow: Platform Consolidation Against Point IT Tools",
        company: "ServiceNow",
        year: 2023,
        domain: "Enterprise Workflow Platform",
        context:
          "ServiceNow faced point-solution competition and had to justify platform breadth with measurable business outcomes.",
        keyDecision:
          "Double down on consolidation narrative tied to workflow integration and executive-level ROI language.",
        result:
          "ServiceNow reinforced strategic positioning in large transformation programs.",
        primaryCitation: {
          sourceTitle: "ServiceNow annual report",
          url: "https://investors.servicenow.com/financial-information/sec-filings/default.aspx",
          sourceType: "regulatory_filing",
          publishedAt: "2023-12-31",
          confidence: 0.75
        },
        tags: ["boss-case", "competitive-moat", "platform-roi"]
      }
    ]
  },
  {
    week: 9,
    title: "AI Product Strategy, Packaging, and Trust",
    competencyFocus: ["ai-strategy", "pricing", "trust", "adoption"],
    knowns: [
      "Customer demand for AI capabilities is high, but willingness-to-pay is uneven.",
      "Quality and trust thresholds vary by workflow criticality.",
      "Competitors are launching AI features rapidly, increasing roadmap pressure."
    ],
    unknowns: [
      "Which AI jobs create durable willingness-to-pay beyond novelty.",
      "How to price AI usage without creating adoption fear or margin collapse.",
      "What governance controls are required for enterprise rollout at scale."
    ],
    constraints: [
      "Model costs are volatile and directly affect gross margin outcomes.",
      "Legal and security teams require clear data handling controls.",
      "AI quality incidents could damage enterprise trust quickly."
    ],
    cases: [
      {
        slug: "github-copilot-business-pricing",
        title: "GitHub Copilot: Business Tier Pricing and Value Narrative",
        company: "GitHub",
        year: 2023,
        domain: "Developer Productivity",
        context:
          "GitHub had to package Copilot for individual developers and enterprise buyers with different ROI expectations and governance needs.",
        keyDecision:
          "Launch business and enterprise tiers with policy controls, telemetry, and team management features.",
        result:
          "Copilot adoption scaled into organizations where governance and procurement controls were mandatory.",
        primaryCitation: {
          sourceTitle: "GitHub Copilot for Business",
          url: "https://github.blog/2023-02-14-github-copilot-for-business-is-now-available",
          sourceType: "official_blog",
          publishedAt: "2023-02-14",
          confidence: 0.86
        },
        tags: ["ai-pricing", "developer-tools"]
      },
      {
        slug: "notion-ai-default-rollout",
        title: "Notion AI: Default Experience vs Add-On Strategy",
        company: "Notion",
        year: 2024,
        domain: "Knowledge Work SaaS",
        context:
          "Notion needed to decide how AI should appear in user workflows without overwhelming users or creating pricing confusion.",
        keyDecision:
          "Integrate AI into core workflows while refining packaging and limits to balance adoption and economics.",
        result:
          "AI usage expanded as it became part of everyday workflows rather than a separate novelty layer.",
        primaryCitation: {
          sourceTitle: "Notion AI updates",
          url: "https://www.notion.so/product/ai",
          sourceType: "official_blog",
          publishedAt: "2024-03-12",
          confidence: 0.68
        },
        tags: ["ux-integration", "ai-adoption"]
      },
      {
        slug: "intercom-fin-packaging",
        title: "Intercom Fin: Value-Based AI Support Packaging",
        company: "Intercom",
        year: 2024,
        domain: "Support SaaS",
        context:
          "Intercom needed an AI pricing and product model that reflected support outcomes, not only feature usage.",
        keyDecision:
          "Package Fin around measurable resolution value and operational reliability for support teams.",
        result:
          "Customers tied AI spend to support economics with clearer confidence in ROI.",
        primaryCitation: {
          sourceTitle: "Intercom Fin product page",
          url: "https://www.intercom.com/fin",
          sourceType: "official_blog",
          publishedAt: "2024-05-01",
          confidence: 0.7
        },
        tags: ["support-ai", "value-pricing"]
      },
      {
        slug: "zendesk-ai-agent-assist",
        title: "Zendesk: AI Agent Assist in Enterprise Support",
        company: "Zendesk",
        year: 2024,
        domain: "Customer Service Platform",
        context:
          "Zendesk needed to sequence AI automation and human-assist capabilities while protecting service quality expectations.",
        keyDecision:
          "Integrate AI agents and copilots with governance controls and clear escalation pathways.",
        result:
          "Adoption improved where AI was positioned as quality-enhancing rather than cost-only automation.",
        primaryCitation: {
          sourceTitle: "Zendesk AI announcements",
          url: "https://www.zendesk.com/blog/category/ai",
          sourceType: "official_blog",
          publishedAt: "2024-06-10",
          confidence: 0.64
        },
        tags: ["service-quality", "ai-governance"]
      },
      {
        slug: "microsoft-365-copilot-pricing",
        title: "Microsoft 365 Copilot: Pricing and Enterprise Governance",
        company: "Microsoft",
        year: 2023,
        domain: "Productivity Platform",
        context:
          "Microsoft had to commercialize Copilot at enterprise scale with clear ROI positioning and strong administrative controls.",
        keyDecision:
          "Price Copilot as an enterprise add-on while emphasizing security, compliance, and workflow-level productivity outcomes.",
        result:
          "The strategy accelerated enterprise pilots and anchored AI monetization narrative in business productivity.",
        primaryCitation: {
          sourceTitle: "Microsoft 365 Copilot pricing announcement",
          url: "https://blogs.microsoft.com/blog/2023/07/18/introducing-microsoft-365-copilot-pricing-for-commercial-customers",
          sourceType: "official_blog",
          publishedAt: "2023-07-18",
          confidence: 0.88
        },
        tags: ["boss-case", "ai-monetization", "enterprise-controls"]
      }
    ]
  },
  {
    week: 10,
    title: "Portfolio Strategy and Roadmap Tradeoffs",
    competencyFocus: ["portfolio", "roadmap", "sunsetting", "capital-allocation"],
    knowns: [
      "The portfolio contains mature products with declining strategic leverage.",
      "New bets require resources currently tied to legacy support obligations.",
      "Customer trust can erode if transitions are forced without clear pathways."
    ],
    unknowns: [
      "How aggressively to retire legacy offerings versus phased migration.",
      "Which roadmap bets maximize long-term strategic compounding.",
      "How to sequence communication to reduce churn during transitions."
    ],
    constraints: [
      "Revenue continuity must be protected during portfolio shifts.",
      "Migration tooling capacity is limited and must be prioritized.",
      "Executive and board expectations require a clear capital allocation thesis."
    ],
    cases: [
      {
        slug: "atlassian-server-eol-cloud",
        title: "Atlassian: Server End-of-Support Portfolio Move",
        company: "Atlassian",
        year: 2021,
        domain: "Dev Collaboration SaaS",
        context:
          "Atlassian had to decide whether to continue investing in server deployments or force strategic focus on cloud offerings.",
        keyDecision:
          "Announce server end-of-support and focus portfolio investment on cloud and data center migration pathways.",
        result:
          "The shift concentrated roadmap power on cloud, with short-term friction offset by stronger long-term strategy alignment.",
        primaryCitation: {
          sourceTitle: "Atlassian server end of support announcement",
          url: "https://www.atlassian.com/migration/journey-to-cloud",
          sourceType: "official_blog",
          publishedAt: "2021-02-02",
          confidence: 0.85
        },
        tags: ["sunset", "portfolio-focus"]
      },
      {
        slug: "adobe-firefly-portfolio",
        title: "Adobe: Integrating Firefly Across Product Portfolio",
        company: "Adobe",
        year: 2023,
        domain: "Creative Software",
        context:
          "Adobe needed to decide whether generative AI should launch as a standalone bet or embed deeply across established product lines.",
        keyDecision:
          "Embed Firefly into flagship workflows to strengthen portfolio cohesion and enterprise value realization.",
        result:
          "AI adoption benefited from existing product distribution and trust infrastructure.",
        primaryCitation: {
          sourceTitle: "Adobe Firefly updates",
          url: "https://blog.adobe.com/en/topics/firefly",
          sourceType: "official_blog",
          publishedAt: "2023-09-12",
          confidence: 0.75
        },
        tags: ["portfolio-integration", "ai"]
      },
      {
        slug: "dropbox-product-focus-reset",
        title: "Dropbox: Product Focus Reset for B2B Value",
        company: "Dropbox",
        year: 2022,
        domain: "Collaboration and Content",
        context:
          "Dropbox had to balance broad product experimentation against sharper focus on workflows with stronger enterprise willingness-to-pay.",
        keyDecision:
          "Reallocate portfolio effort toward core collaboration and content workflows with higher strategic leverage.",
        result:
          "Portfolio clarity improved execution focus and messaging consistency for business buyers.",
        primaryCitation: {
          sourceTitle: "Dropbox investor updates",
          url: "https://investors.dropbox.com/financial-information/quarterly-results/default.aspx",
          sourceType: "investor_relations",
          publishedAt: "2022-11-03",
          confidence: 0.66
        },
        tags: ["focus", "capital-allocation"]
      },
      {
        slug: "hubspot-enterprise-addons",
        title: "HubSpot: Add-On Strategy for Enterprise Depth",
        company: "HubSpot",
        year: 2024,
        domain: "CRM and Marketing SaaS",
        context:
          "HubSpot needed to increase enterprise depth without complicating entry-level product adoption for core SMB segments.",
        keyDecision:
          "Package advanced enterprise capabilities as focused add-ons while preserving core hub simplicity.",
        result:
          "Enterprise monetization improved with lower disruption to broader customer onboarding.",
        primaryCitation: {
          sourceTitle: "HubSpot product and pricing updates",
          url: "https://www.hubspot.com/products",
          sourceType: "official_blog",
          publishedAt: "2024-06-01",
          confidence: 0.65
        },
        tags: ["add-ons", "portfolio-layering"]
      },
      {
        slug: "google-workspace-gemini-packaging",
        title: "Google Workspace + Gemini: Bundle vs Add-On Decisions",
        company: "Google",
        year: 2024,
        domain: "Productivity Platform",
        context:
          "Google had to determine how AI capability should map into Workspace pricing tiers and enterprise packaging narratives.",
        keyDecision:
          "Refine Gemini-for-Workspace packaging to balance broad adoption, perceived value, and enterprise procurement simplicity.",
        result:
          "Packaging changes improved strategic clarity in enterprise AI purchasing discussions.",
        primaryCitation: {
          sourceTitle: "Google Workspace Gemini announcements",
          url: "https://workspace.google.com/blog/product-announcements",
          sourceType: "official_blog",
          publishedAt: "2024-04-09",
          confidence: 0.7
        },
        tags: ["boss-case", "ai-packaging", "portfolio-pricing"]
      }
    ]
  },
  {
    week: 11,
    title: "Operating Model, Org Design, and Decision Velocity",
    competencyFocus: ["org-design", "operating-model", "governance", "execution"],
    knowns: [
      "Decision latency is increasing as product scope and team count grow.",
      "Cross-functional ownership boundaries are unclear in strategic initiatives.",
      "Execution quality varies by team due to inconsistent operating cadence."
    ],
    unknowns: [
      "Which governance mechanisms increase speed without reducing accountability.",
      "How to structure teams around customer problems versus product components.",
      "What decision rights should stay centralized versus delegated."
    ],
    constraints: [
      "Major reorg disruption must be minimized during active delivery cycles.",
      "Executive leadership requires clearer portfolio accountability.",
      "Hiring plans are constrained; structure must improve through design, not scale alone."
    ],
    cases: [
      {
        slug: "aws-prfaq-operating-model",
        title: "AWS: PR/FAQ as Product Decision Operating System",
        company: "AWS",
        year: 2020,
        domain: "Cloud Infrastructure",
        context:
          "AWS used narrative-driven mechanisms to evaluate product bets before large investment, supporting autonomous but aligned teams.",
        keyDecision:
          "Institutionalize PR/FAQ-style mechanisms to improve decision quality and speed for major product initiatives.",
        result:
          "Teams maintained high decision velocity with clearer customer-outcome framing.",
        primaryCitation: {
          sourceTitle: "Working backwards at AWS",
          url: "https://www.aboutamazon.com/news/workplace/working-backwards-press-release-faq",
          sourceType: "leadership_interview",
          publishedAt: "2020-02-01",
          confidence: 0.78
        },
        tags: ["operating-system", "decision-quality"]
      },
      {
        slug: "stripe-docs-product-org",
        title: "Stripe: Docs as a Strategic Product Surface",
        company: "Stripe",
        year: 2021,
        domain: "Developer Infrastructure",
        context:
          "Stripe's growth depended on developer time-to-value, making documentation and DX integral to product outcomes.",
        keyDecision:
          "Treat developer documentation as a first-class product and align org ownership accordingly.",
        result:
          "Developer activation and integration success improved with tighter product-docs coupling.",
        primaryCitation: {
          sourceTitle: "Stripe docs and API design resources",
          url: "https://stripe.com/docs",
          sourceType: "official_blog",
          publishedAt: "2021-07-01",
          confidence: 0.64
        },
        tags: ["developer-experience", "org-design"]
      },
      {
        slug: "figma-crossfunctional-pods",
        title: "Figma: Cross-Functional Pod Model for Product Velocity",
        company: "Figma",
        year: 2022,
        domain: "Design Collaboration",
        context:
          "Figma needed to scale feature velocity while keeping product coherence and strong collaboration across disciplines.",
        keyDecision:
          "Use cross-functional pods with clear problem ownership and shared outcome metrics.",
        result:
          "Execution speed remained strong while product quality and consistency were maintained.",
        primaryCitation: {
          sourceTitle: "Figma product engineering stories",
          url: "https://www.figma.com/blog",
          sourceType: "leadership_interview",
          publishedAt: "2022-10-01",
          confidence: 0.61
        },
        tags: ["pod-model", "execution"]
      },
      {
        slug: "hubspot-product-cs-loop",
        title: "HubSpot: Product and Customer Success Feedback Loop",
        company: "HubSpot",
        year: 2023,
        domain: "CRM and Marketing SaaS",
        context:
          "HubSpot's expansion outcomes depended on strong handoffs between product design decisions and customer success execution.",
        keyDecision:
          "Formalize product-CS operating loops to translate adoption friction into roadmap and enablement priorities.",
        result:
          "Adoption quality and renewal outcomes improved through tighter execution feedback cycles.",
        primaryCitation: {
          sourceTitle: "HubSpot customer success resources",
          url: "https://www.hubspot.com/customer-success",
          sourceType: "official_blog",
          publishedAt: "2023-08-15",
          confidence: 0.63
        },
        tags: ["cs-loop", "adoption"]
      },
      {
        slug: "microsoft-cloud-ai-reorg",
        title: "Microsoft: Org Realignment for Cloud + AI Priority",
        company: "Microsoft",
        year: 2023,
        domain: "Platform and Productivity",
        context:
          "Microsoft faced strategic urgency in AI and cloud, requiring tighter alignment between research, platform, and product organizations.",
        keyDecision:
          "Re-align leadership structures around cloud and AI priorities with clear execution accountability.",
        result:
          "Strategic focus improved and cross-org execution accelerated for priority initiatives.",
        primaryCitation: {
          sourceTitle: "Microsoft leadership and strategy updates",
          url: "https://blogs.microsoft.com/blog",
          sourceType: "official_blog",
          publishedAt: "2023-03-16",
          confidence: 0.72
        },
        tags: ["boss-case", "reorg", "strategy-execution"]
      }
    ]
  },
  {
    week: 12,
    title: "Capstone: Integrated Product Leadership Under Ambiguity",
    competencyFocus: ["capstone", "strategy", "pricing", "analytics", "execution"],
    knowns: [
      "Multiple strategic paths are plausible, and each has significant tradeoffs.",
      "Stakeholders disagree on risk appetite, monetization timing, and resource allocation.",
      "Decision quality depends on integrating customer, product, and business signals."
    ],
    unknowns: [
      "How quickly market conditions will shift after the chosen strategy.",
      "Whether organizational readiness can match strategic ambition.",
      "Which leading indicators will most reliably validate the decision."
    ],
    constraints: [
      "Board and executive expectations require a defensible decision memo.",
      "The decision must include measurable 90-day and 12-month success criteria.",
      "Failure modes and mitigation plans must be explicit."
    ],
    cases: [
      {
        slug: "snowflake-ai-data-cloud-capstone",
        title: "Snowflake: AI Data Cloud Expansion Bet",
        company: "Snowflake",
        year: 2024,
        domain: "Data and AI Platform",
        context:
          "Snowflake needed to decide how aggressively to expand platform capabilities for AI workloads while preserving core performance and economics.",
        keyDecision:
          "Expand AI-native platform capabilities and partnerships while keeping core data platform reliability and governance central.",
        result:
          "Snowflake strengthened strategic narrative for enterprise AI workloads and long-term platform relevance.",
        primaryCitation: {
          sourceTitle: "Snowflake investor presentations",
          url: "https://investors.snowflake.com/financial-information/presentations",
          sourceType: "investor_relations",
          publishedAt: "2024-06-01",
          confidence: 0.69
        },
        tags: ["capstone", "ai-platform"]
      },
      {
        slug: "servicenow-now-assist-scaling",
        title: "ServiceNow: Scaling Now Assist Across Workflow Portfolio",
        company: "ServiceNow",
        year: 2024,
        domain: "Enterprise Workflow Platform",
        context:
          "ServiceNow had to scale AI assistance across workflows while balancing trust, pricing, and operational complexity for large enterprises.",
        keyDecision:
          "Roll out AI assistance by workflow priority with explicit governance, value proof points, and GTM enablement.",
        result:
          "Enterprise adoption grew where AI value was tied directly to workflow outcomes.",
        primaryCitation: {
          sourceTitle: "ServiceNow AI product updates",
          url: "https://www.servicenow.com/products/now-assist.html",
          sourceType: "official_blog",
          publishedAt: "2024-05-07",
          confidence: 0.67
        },
        tags: ["ai-rollout", "workflow-value"]
      },
      {
        slug: "shopify-enterprise-b2b-tradeoff",
        title: "Shopify: Enterprise B2B Expansion vs Core SMB Velocity",
        company: "Shopify",
        year: 2024,
        domain: "Commerce Platform",
        context:
          "Shopify needed to push deeper into enterprise B2B while protecting product speed and simplicity for the broader merchant base.",
        keyDecision:
          "Prioritize platform primitives that serve both enterprise B2B complexity and core merchant usability where possible.",
        result:
          "Strategic flexibility improved as the product roadmap balanced scale and specialization.",
        primaryCitation: {
          sourceTitle: "Shopify Editions and enterprise updates",
          url: "https://www.shopify.com/editions",
          sourceType: "official_blog",
          publishedAt: "2024-06-01",
          confidence: 0.64
        },
        tags: ["portfolio-balance", "platform-primitives"]
      },
      {
        slug: "datadog-depth-vs-breadth",
        title: "Datadog: Platform Breadth vs Product Depth",
        company: "Datadog",
        year: 2024,
        domain: "Observability Platform",
        context:
          "Datadog's rapid product expansion created a strategic choice between adding more adjacencies or deepening existing products for enterprise maturity.",
        keyDecision:
          "Sequence roadmap with explicit depth thresholds while maintaining a coherent platform expansion thesis.",
        result:
          "The business sustained expansion quality while reducing product sprawl risk.",
        primaryCitation: {
          sourceTitle: "Datadog investor day materials",
          url: "https://investors.datadoghq.com/financial-information/presentations",
          sourceType: "investor_relations",
          publishedAt: "2024-06-13",
          confidence: 0.66
        },
        tags: ["roadmap-tradeoff", "platform-depth"]
      },
      {
        slug: "salesforce-einstein-copilot-capstone",
        title: "Salesforce: AI CRM Monetization and Trust Capstone",
        company: "Salesforce",
        year: 2024,
        domain: "Enterprise CRM Platform",
        context:
          "Salesforce had to integrate generative AI deeply into CRM workflows while ensuring enterprise trust, governance, and measurable business value.",
        keyDecision:
          "Commercialize AI capabilities with governance-first architecture and role-specific workflow outcomes tied to revenue and productivity.",
        result:
          "AI strategy reinforced Salesforce's platform positioning and enterprise account expansion narrative.",
        primaryCitation: {
          sourceTitle: "Salesforce Einstein and AI announcements",
          url: "https://www.salesforce.com/news/stories/einstein-copilot",
          sourceType: "official_blog",
          publishedAt: "2024-03-01",
          confidence: 0.7
        },
        tags: ["boss-case", "final-capstone", "ai-crm"]
      }
    ]
  }
];

const expandedBriefsBySlug = buildExpandedBriefsBySlug(WEEK_TEMPLATES);
const totalSeedCount = WEEK_TEMPLATES.reduce((count, week) => count + week.cases.length, 0);

if (Object.keys(expandedBriefsBySlug).length !== totalSeedCount) {
  throw new Error(
    `Expanded brief coverage mismatch: expected ${totalSeedCount}, found ${Object.keys(expandedBriefsBySlug).length}`
  );
}

function caseTypeFromSequence(sequence: number): "standard" | "deep-dive" | "boss" {
  if (sequence === 4) {
    return "deep-dive";
  }

  if (sequence === 5) {
    return "boss";
  }

  return "standard";
}

function clampDifficulty(value: number): number {
  return Math.max(1, Math.min(10, value));
}

function secondaryCitation(seed: CaseSeed): CitationRecord {
  const reference = COMPANY_REFERENCE[seed.company];

  if (!reference) {
    return {
      sourceTitle: `${seed.company} official resources`,
      url: "https://www.google.com",
      sourceType: "other",
      publishedAt: `${seed.year}-01-01`,
      confidence: 0.5
    };
  }

  return {
    sourceTitle: reference.sourceTitle,
    url: reference.url,
    sourceType: "investor_relations",
    publishedAt: `${seed.year}-01-01`,
    confidence: 0.58
  };
}

function buildCounterfactuals(seed: CaseSeed): string[] {
  return [
    `Delay structural changes and optimize short-term revenue around ${seed.company}'s legacy motion.`,
    `Over-index on one segment and ignore cross-functional adoption signals tied to ${seed.title}.`,
    `Ship broad feature volume without a measurable business-outcome model for ${seed.company}.`
  ];
}

function buildTags(template: WeekTemplate, seed: CaseSeed): string[] {
  const base = [...template.competencyFocus];
  const tagged = seed.tags ?? [];
  return Array.from(new Set([...base, ...tagged]));
}

function buildCase(template: WeekTemplate, seed: CaseSeed, sequence: number): CaseScenario {
  const caseType = caseTypeFromSequence(sequence);
  const difficulty = clampDifficulty(2 + Math.ceil(template.week / 2) + sequence);
  const expandedBrief = expandedBriefsBySlug[seed.slug];

  if (!expandedBrief) {
    throw new Error(`Missing expanded brief for slug: ${seed.slug}`);
  }

  const knowns = [
    ...template.knowns,
    `Market signal: ${seed.context}`
  ];

  const scenario = `${seed.context} Strategic debate centered on whether to ${seed.keyDecision.toLowerCase()}`;

  const decisionPrompt = `You are the product leader at ${seed.company} in ${seed.year}. Make a decision memo for ${seed.title}. Include: (1) target segment and positioning, (2) business model and pricing implications, (3) metrics/experiment plan, (4) GTM and customer rollout plan, and (5) top failure modes with mitigation.`;

  const citations: CitationRecord[] = [seed.primaryCitation, secondaryCitation(seed)];

  const built: CaseScenario = {
    id: `w${template.week}-${sequence}-${seed.slug}`,
    week: template.week,
    sequence,
    caseType,
    title: seed.title,
    company: seed.company,
    year: seed.year,
    domain: seed.domain,
    topicTags: buildTags(template, seed),
    difficulty,
    scenario,
    decisionPrompt,
    knowns,
    unknowns: template.unknowns,
    constraints: template.constraints,
    actualDecision: seed.keyDecision,
    outcome: seed.result,
    counterfactuals: buildCounterfactuals(seed),
    citations,
    expandedBrief
  };

  return CaseScenarioSchema.parse(built);
}

const curriculumWeeksInternal: CurriculumWeek[] = WEEK_TEMPLATES.map((template) => {
  const cases = template.cases.map((seed, idx) => buildCase(template, seed, idx + 1));

  return CurriculumWeekSchema.parse({
    week: template.week,
    title: template.title,
    competencyFocus: template.competencyFocus,
    cases
  });
});

export const curriculumWeeks: CurriculumWeek[] = curriculumWeeksInternal;
export const allCases: CaseScenario[] = curriculumWeeks.flatMap((week) => week.cases);

if (allCases.length !== 60) {
  throw new Error(`Expected 60 cases, found ${allCases.length}`);
}

export function getCurriculum(): CurriculumWeek[] {
  return curriculumWeeks;
}

export function getAllCases(): CaseScenario[] {
  return allCases;
}

export function getCaseById(caseId: string): CaseScenario {
  const found = allCases.find((candidate) => candidate.id === caseId);

  if (!found) {
    throw new Error(`Case not found: ${caseId}`);
  }

  return found;
}

export function getWeek(week: number): CurriculumWeek {
  const found = curriculumWeeks.find((candidate) => candidate.week === week);

  if (!found) {
    throw new Error(`Week not found: ${week}`);
  }

  return found;
}

export function getWeekCases(week: number): CaseScenario[] {
  return getWeek(week).cases;
}

const AXIS_TO_TOPIC: Record<RubricAxis, string> = {
  problemFraming: "strategy",
  customerUnderstanding: "customer-discovery",
  businessEconomics: "pricing",
  metricsExperimentation: "metrics",
  strategicCoherence: "positioning",
  riskHandling: "trust",
  executionRealism: "execution",
  communicationClarity: "decision-quality"
};

export function recommendCaseId(
  completedCaseIds: Set<string>,
  weaknessAxes: RubricAxis[] = []
): { caseId: string; reason: string } {
  const prioritizedTopics = weaknessAxes.map((axis) => AXIS_TO_TOPIC[axis]);

  for (const topic of prioritizedTopics) {
    const match = allCases.find(
      (candidate) => !completedCaseIds.has(candidate.id) && candidate.topicTags.includes(topic)
    );

    if (match) {
      return {
        caseId: match.id,
        reason: `Recommended because it targets your weakness in ${topic}.`
      };
    }
  }

  const earliestOpen = allCases.find((candidate) => !completedCaseIds.has(candidate.id));

  if (earliestOpen) {
    return {
      caseId: earliestOpen.id,
      reason: "Recommended as the next structured progression case."
    };
  }

  return {
    caseId: allCases[allCases.length - 1].id,
    reason: "All cases completed; replaying your hardest capstone case."
  };
}

export function listWeaknessAxesFromTags(tags: string[]): RubricAxis[] {
  const axes: RubricAxis[] = [];

  for (const axis of RUBRIC_AXES) {
    const mappedTopic = AXIS_TO_TOPIC[axis];
    if (tags.includes(mappedTopic)) {
      axes.push(axis);
    }
  }

  return axes;
}
