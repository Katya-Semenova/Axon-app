"use client";

import { MiniSparkline } from "./MiniSparkline";
import { GOLD, NAVY } from "../ui/tokens";

export type ProjectStatus = "ready" | "generating" | "draft";

export interface Project {
  name: string;
  file: string;
  time: string;
  status: ProjectStatus;
  data: number[];
}

/**
 * Tone-on-tone status indicators — no red/green/yellow, palette-strict.
 * Picked to stay legible on the warm canvas without resorting to alert hues.
 */
const STATUS_MAP: Record<ProjectStatus, { dotCls: string; label: string }> = {
  ready:      { dotCls: "bg-[#1B2840]", label: "ready"      },
  generating: { dotCls: "bg-[#B89548]", label: "generating" },
  draft:      { dotCls: "bg-[#8A8B87]", label: "draft"      },
};

export function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const s = STATUS_MAP[project.status];
  const sparkColor = project.status === "generating" ? GOLD : NAVY;
  return (
    <div onClick={onClick}
      className="bg-card border border-border rounded-none p-7 cursor-pointer transition-colors duration-200 hover:border-[rgba(27,40,64,0.25)]">
      <div className="flex items-start justify-between mb-5">
        <div className="text-[15px] font-medium text-t1 leading-[1.4] max-w-[70%]">{project.name}</div>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-t2">
          <span className={`w-[5px] h-[5px] rounded-full shrink-0 ${s.dotCls}`} />
          {s.label}
        </span>
      </div>
      <div className="mb-4">
        <MiniSparkline data={project.data} color={sparkColor} />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] text-t3">{project.file}</span>
        <span className="font-mono text-[10.5px] text-t3">{project.time}</span>
      </div>
    </div>
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
