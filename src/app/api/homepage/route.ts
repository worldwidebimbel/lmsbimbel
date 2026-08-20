import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [
    config,
    socialLinks,
    menus,
    banners,
    quickActions,
    programs,
    videos,
    videoHighlights,
    testimonials,
  ] = await Promise.all([
    db.siteConfig.findMany(),
    db.siteSocialLink.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteMenu.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteBanner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteQuickAction.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteProgram.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteVideo.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteVideoHighlight.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    db.siteTestimonial.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  const configMap = Object.fromEntries(config.map((c) => [c.key, c.value]));

  const menuTree = buildMenuTree(menus);

  return NextResponse.json({
    config: configMap,
    socialLinks,
    menus: menuTree,
    banners,
    quickActions,
    programs,
    videos,
    videoHighlights,
    testimonials,
  });
}

function buildMenuTree(
  menus: { id: string; label: string; href: string | null; parentId: string | null; order: number; openInNewTab: boolean }[]
) {
  const map = new Map(menus.map((m) => [m.id, { ...m, children: [] as typeof menus }]));
  const roots: typeof menus[] = [];
  for (const m of menus) {
    if (m.parentId) {
      const parent = map.get(m.parentId);
      if (parent) parent.children.push(map.get(m.id)!);
    } else {
      roots.push(map.get(m.id)!);
    }
  }
  return roots;
}
