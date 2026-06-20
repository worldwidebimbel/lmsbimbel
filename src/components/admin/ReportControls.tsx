"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Building2, Calendar } from "lucide-react";

interface Branch { id: string; name: string; code: string }

export default function ReportControls({ branches, currentBranch, currentPeriod }: { branches: Branch[]; currentBranch: string; currentPeriod: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback((name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {branches.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <select
            value={currentBranch}
            onChange={(e) => router.push(`${pathname}?${createQueryString("branch", e.target.value)}`)}
            className="bg-transparent text-sm outline-none"
          >
            <option value="all">Semua Cabang</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <select
          value={currentPeriod}
          onChange={(e) => router.push(`${pathname}?${createQueryString("period", e.target.value)}`)}
          className="bg-transparent text-sm outline-none"
        >
          <option value="daily">Harian</option>
          <option value="weekly">Mingguan</option>
          <option value="monthly">Bulanan</option>
          <option value="yearly">Tahunan</option>
        </select>
      </div>
    </div>
  );
}
