import { getCompanyIconPath } from "@/lib/company-icons";
import { cn } from "@/components/ui/utils";

export type CompanyLabelProps = {
  company: string;
  meta?: string;
  className?: string;
  iconSize?: number;
  showCompanyText?: boolean;
};

export function CompanyLabel({
  company,
  meta,
  className,
  iconSize = 16,
  showCompanyText = true
}: CompanyLabelProps) {
  const text = showCompanyText ? `${company}${meta ? ` ${meta}` : ""}` : meta ?? "";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <img
        src={getCompanyIconPath(company)}
        alt=""
        aria-hidden="true"
        className="shrink-0 rounded-sm object-contain"
        style={{ width: iconSize, height: iconSize }}
        loading="lazy"
        decoding="async"
      />
      {text ? <span className="min-w-0 truncate">{text}</span> : null}
    </span>
  );
}
