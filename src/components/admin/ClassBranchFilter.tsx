"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";

interface Branch { id: string; name: string; code: string }

export function ClassBranchFilter({ branches, currentBranchId }: { branches: Branch[]; currentBranchId: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("branchId");
    } else {
      params.set("branchId", value);
    }
    router.push(`/admin/classes?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white">
      <Building2 className="w-4 h-4 text-gray-500" />
      <select
        value={currentBranchId ?? "all"}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-transparent outline-none cursor-pointer"
      >
        <option value="all">Semua Cabang</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}
