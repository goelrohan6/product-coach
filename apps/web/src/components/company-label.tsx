import { getCompanyIconPath } from "@/lib/company-icons";
import { cn } from "@/components/ui/utils";

export type CompanyLabelProps = {
  company: string;
  meta?: string;
  className?: string;
};

export function CompanyLabel({ company, meta, className }: CompanyLabelProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <img
        src={getCompanyIconPath(company)}
        alt=""
        aria-hidden="true"
        className="h-4 w-4 shrink-0 rounded-sm object-contain"
        loading="lazy"
        decoding="async"
      />
      <span className="min-w-0 truncate">
        {company}
        {meta ? ` ${meta}` : ""}
      </span>
    </span>
  );
}
