// Helper filter/sort/count untuk section list (Program, Testimonial) di homepage.
// Dipakai bersama oleh ProgramUnggulanSection & TestimoniSection.

export interface ListConfigItem {
  featured?: boolean;
  createdAt: string | Date;
}

export function applyListConfig<T extends ListConfigItem>(
  items: T[],
  count: string | undefined,
  filter: string | undefined,
): T[] {
  let list = [...items];

  if (filter === "featured") {
    const featured = list.filter((i) => i.featured);
    // Fallback ke semua item jika tidak ada yang featured (section tidak kosong)
    if (featured.length > 0) list = featured;
  } else if (filter === "newest") {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (filter === "oldest") {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  // filter "all" / undefined: pertahankan urutan `order` dari DB

  if (count && count !== "all") {
    const n = parseInt(count, 10);
    if (!Number.isNaN(n) && n > 0) list = list.slice(0, n);
  }

  return list;
}
