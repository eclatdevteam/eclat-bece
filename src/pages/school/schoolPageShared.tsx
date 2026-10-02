import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
}) {
  const toneStyles: Record<string, string> = {
    primary: "bg-sky-50 text-sky-700 dark:bg-[#1e3857] dark:text-[#66d7ff]",
    success: "bg-emerald-50 text-emerald-700 dark:bg-[#102f2b] dark:text-[#48d7b7]",
    accent: "bg-purple-50 text-purple-700 dark:bg-[#2b2145] dark:text-[#c4a9ff]",
    warning: "bg-amber-50 text-amber-700 dark:bg-[#352813] dark:text-[#ffca6a]",
  };

  return (
    <Card className="border border-border bg-card text-card-foreground shadow-sm min-w-0">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground truncate">
              {label}
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-foreground truncate">
              {value}
            </p>
            <p className="mt-1 text-[11px] text-sky-600 dark:text-[#58c4e8] font-medium truncate">{hint}</p>
          </div>
          <div className={`rounded-xl p-2.5 sm:p-3 flex-shrink-0 ${toneStyles[tone] || toneStyles.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground dark:text-[#71c9ed] truncate">{title}</h2>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
