"use client";

import { MiniSparkline } from "./MiniSparkline";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { GOLD, NAVY } from "../ui/tokens";
import { useTranslations } from "next-intl";

export type ProjectStatus = "ready" | "generating" | "draft";

export interface Project {
  name: string;
  file: string;
  time: string;
  status: ProjectStatus;
  data: number[];
}

/**
 * Статус проекта — цветной semantic Badge из кита (решение миграции на кит):
 * ready → success, draft → warning, generating → info.
 */
const STATUS_BADGE: Record<ProjectStatus, { variant: "success" | "warning" | "info"; label: string }> = {
  ready:      { variant: "success", label: "ready"      },
  draft:      { variant: "warning", label: "draft"      },
  generating: { variant: "info",    label: "generating" },
};

export function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const t = useTranslations("Landing");
  const s = STATUS_BADGE[project.status];
  const sparkColor = project.status === "generating" ? GOLD : NAVY;
  return (
    <Card variant="interactive" onClick={onClick} className="p-7">
      <div className="flex items-start justify-between mb-5">
        <div className="text-[15px] font-medium text-t1 leading-[1.4] max-w-[70%]">{project.name}</div>
        <Badge variant={s.variant} size="sm">{t(`status.${project.status}`)}</Badge>
      </div>
      <div className="mb-4">
        <MiniSparkline data={project.data} color={sparkColor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-t3">{project.file}</span>
        <span className="font-mono text-[10.5px] text-t3">{project.time}</span>
      </div>
    </Card>
  );
}

/** Mock project list shown on the landing page. */
export const PROJECTS: Project[] = [
  { name:"Q3 Revenue Review",          file:"stripe_prod.sql",   time:"2 hours ago",  status:"ready",      data:[820,870,920,890,780,810,760,820,870,900,940,910] },
  { name:"Churn Cohort Analysis",       file:"analytics_dw.sql",  time:"Yesterday",    status:"ready",      data:[340,360,310,290,270,250,280,310,330,290,260,240] },
  { name:"Pricing Experiment Readout",  file:"experiments.sql",   time:"3 days ago",   status:"draft",      data:[500,510,520,540,558,572,580,595,610,625,640,658] },
  { name:"User Activation Funnel",      file:"events_log.db",     time:"4 days ago",   status:"generating", data:[900,920,880,860,910,940,900,870,850,880,920,950] },
  { name:"Subscription Forecast 2026",  file:"subscriptions.sql", time:"1 week ago",   status:"ready",      data:[1200,1240,1280,1310,1290,1340,1380,1420,1400,1460,1510,1560] },
  { name:"Marketing Attribution Q4",    file:"marketing_q4.sql",  time:"2 weeks ago",  status:"draft",      data:[200,220,210,240,260,250,270,290,280,310,320,340] },
];
