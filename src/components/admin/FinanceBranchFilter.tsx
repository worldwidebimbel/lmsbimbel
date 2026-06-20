"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Building2 } from "lucide-react";

interface Branch { id: string; name: string; code: string }

export default function FinanceBranchFilter({ branches, currentBranch }: { branches: Branch[]; currentBranch: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("branch");
    else params.set("branch", value);
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  if (branches.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
      <Building2 className="w-4 h-4 text-gray-500" />
      <select value={currentBranch} onChange={(e) => onChange(e.target.value)} className="text-sm bg-transparent outline-none">
        <option value="all">Semua Cabang</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
  );
}
