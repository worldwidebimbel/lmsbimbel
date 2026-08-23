"use client";

import Link from "next/link";
import { ArrowRight, Download, Phone, Award, FileText, CheckCircle } from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  theme: string;
  linkUrl: string | null;
  fileUrl: string | null;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Phone,
  Download,
  Award,
  FileText,
  CheckCircle,
};

export default function QuickActionCards({ actions }: { actions: QuickAction[] }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="relative z-20 -mt-16 sm:-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3">
          {actions.slice(0, 3).map((action) => {
            const Icon = ICON_MAP[action.icon ?? "CheckCircle"] ?? CheckCircle;
            const isYellow = action.theme === "yellow";
            const content = (
              <div className={`group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 shadow-lg transition-transform hover:-translate-y-1 ${isYellow ? "bg-yellow-400 text-blue-950" : "bg-blue-900 text-white"}`}>
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isYellow ? "bg-blue-950 text-yellow-400" : "bg-yellow-400 text-blue-950"}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isYellow ? "bg-blue-950/10" : "bg-white/10"} transition-colors group-hover:${isYellow ? "bg-blue-950/20" : "bg-white/20"}`}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-bold">{action.title}</h3>
                {action.description && <p className={`mt-1 text-sm ${isYellow ? "text-blue-950/70" : "text-white/70"}`}>{action.description}</p>}
                <div className="flex-1" />
              </div>
            );

            if (action.fileUrl) {
              return (
                <a key={action.id} href={action.fileUrl} target="_blank" rel="noopener noreferrer" download className="h-full">
                  {content}
                </a>
              );
            }
            if (action.linkUrl) {
              return (
                <Link key={action.id} href={action.linkUrl} className="h-full">
                  {content}
                </Link>
              );
            }
            return <div key={action.id} className="h-full">{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
