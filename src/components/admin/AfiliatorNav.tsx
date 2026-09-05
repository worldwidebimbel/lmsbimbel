import Link from "next/link";

const TABS: { key: string; href: string; label: string }[] = [
  { key: "kelola", href: "/admin/afiliator", label: "Kelola Afiliator" },
  { key: "referral", href: "/admin/afiliator/referral", label: "Referral" },
  { key: "pencairan", href: "/admin/afiliator/pencairan", label: "Pencairan" },
  { key: "aturan", href: "/admin/afiliator/aturan-komisi", label: "Aturan Komisi" },
];

export function AfiliatorNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap gap-2 mb-6" aria-label="Navigasi afiliator">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? "page" : undefined}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            t.key === active
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
