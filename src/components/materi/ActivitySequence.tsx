"use client";

import Link from "next/link";
import { PlayCircle, FileText, PencilLine, Lightbulb, ClipboardCheck, CheckCircle2 } from "lucide-react";

export type ActivityStep = {
  id: string;
  href: string;
  label: string;
  kind: "VIDEO" | "ARTICLE" | "PRACTICE" | "DISCUSSION" | "EVALUATION";
  status: "DONE" | "CURRENT" | "TODO";
  isCurrent: boolean;
};

const KIND_ICON: Record<ActivityStep["kind"], React.ElementType> = {
  VIDEO: PlayCircle,
  ARTICLE: FileText,
  PRACTICE: PencilLine,
  DISCUSSION: Lightbulb,
  EVALUATION: ClipboardCheck,
};

const KIND_COLOR: Record<ActivityStep["kind"], string> = {
  VIDEO: "bg-blue-500",
  ARTICLE: "bg-amber-500",
  PRACTICE: "bg-indigo-500",
  DISCUSSION: "bg-green-500",
  EVALUATION: "bg-purple-500",
};

const STATUS_LABEL: Record<ActivityStep["status"], string> = {
  DONE: "Selesai",
  CURRENT: "Sedang Dipelajari",
  TODO: "Belum Dimulai",
};

export function ActivitySequence({ steps }: { steps: ActivityStep[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Rangkaian Aktivitas</h3>
      <div className="relative space-y-4">
        {steps.map((step, i) => {
          const Icon = KIND_ICON[step.kind];
          const isLast = i === steps.length - 1;
          return (
            <div key={step.id} className="relative flex gap-3">
              {!isLast && (
                <span className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-gray-200" />
              )}
              <Link
                href={step.href}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-transform ${
                  step.status === "TODO" ? "bg-gray-200 text-gray-500" : KIND_COLOR[step.kind]
                } ${step.isCurrent ? "ring-2 ring-offset-2 ring-blue-300" : ""}`}
              >
                <Icon className="h-4 w-4" />
              </Link>
              <Link href={step.href} className="min-w-0 flex-1 pt-1 group">
                <p className={`text-sm font-medium truncate ${step.isCurrent ? "text-blue-700" : "text-gray-800 group-hover:text-blue-600"}`}>
                  {step.label}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {step.status === "DONE" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                  <span className={`text-xs ${step.status === "DONE" ? "text-green-600" : step.status === "CURRENT" ? "text-blue-600" : "text-gray-500"}`}>
                    {STATUS_LABEL[step.status]}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
