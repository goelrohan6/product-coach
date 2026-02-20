const FALLBACK_ICON = "/company-icons/fallback-company.svg";

export const COMPANY_ICON_MAP: Record<string, string> = {
  AWS: "/company-icons/aws.svg",
  Adobe: "/company-icons/adobe.svg",
  Amplitude: "/company-icons/amplitude.svg",
  Asana: "/company-icons/asana.svg",
  Atlassian: "/company-icons/atlassian.svg",
  Canva: "/company-icons/canva.svg",
  Cloudflare: "/company-icons/cloudflare.svg",
  CrowdStrike: "/company-icons/crowdstrike.svg",
  Databricks: "/company-icons/databricks.svg",
  Datadog: "/company-icons/datadog.svg",
  Dropbox: "/company-icons/dropbox.svg",
  Figma: "/company-icons/figma.svg",
  GitHub: "/company-icons/github.svg",
  GitLab: "/company-icons/gitlab.svg",
  Google: "/company-icons/google.svg",
  HubSpot: "/company-icons/hubspot.svg",
  Intercom: "/company-icons/intercom.svg",
  Microsoft: "/company-icons/microsoft.svg",
  Miro: "/company-icons/miro.svg",
  MongoDB: "/company-icons/mongodb.svg",
  Notion: "/company-icons/notion.svg",
  Okta: "/company-icons/okta.svg",
  Salesforce: "/company-icons/salesforce.svg",
  ServiceNow: "/company-icons/servicenow.svg",
  Shopify: "/company-icons/shopify.svg",
  Slack: "/company-icons/slack.svg",
  Snowflake: "/company-icons/snowflake.svg",
  Stripe: "/company-icons/stripe.svg",
  Twilio: "/company-icons/twilio.svg",
  Zendesk: "/company-icons/zendesk.svg",
  Zoom: "/company-icons/zoom.svg",
  "monday.com": "/company-icons/monday.svg"
};

export function getCompanyIconPath(company: string): string {
  return COMPANY_ICON_MAP[company] ?? FALLBACK_ICON;
}
