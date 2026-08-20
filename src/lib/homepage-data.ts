import { db } from "@/lib/db";
import { getSiteConfig } from "@/lib/site-config";

export async function getHomepageData() {
  const cfg = await getSiteConfig();
  const [
    socialLinks,
    menus,
    banners,
    quickActions,
    programs,
    videos,
    videoHighlights,
    testimonials,
  ] = await Promise.all([
    db.siteSocialLink.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteMenu.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteBanner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteQuickAction.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteProgram.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteVideo.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteVideoHighlight.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
    db.siteTestimonial.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }).catch(() => []),
  ]);

  const menuTree = buildMenuTree(menus);

  return {
    config: cfg,
    socialLinks,
    menus: menuTree,
    banners,
    quickActions,
    programs,
    videos,
    videoHighlights,
    testimonials,
  };
}

type MenuItem = {
  id: string;
  label: string;
  href: string | null;
  parentId: string | null;
  order: number;
  openInNewTab: boolean;
  children: MenuItem[];
};

function buildMenuTree(
  menus: { id: string; label: string; href: string | null; parentId: string | null; order: number; openInNewTab: boolean }[]
): MenuItem[] {
  const map = new Map<string, MenuItem>();
  for (const m of menus) {
    map.set(m.id, { ...m, children: [] });
  }
  const roots: MenuItem[] = [];
  for (const m of menus) {
    const node = map.get(m.id)!;
    if (m.parentId && map.has(m.parentId)) {
      map.get(m.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
