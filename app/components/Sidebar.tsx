"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  ChartPie,
  ClipboardList,
  FileStack,
  GraduationCap,
  Landmark,
  ListChecks,
  Library,
  MessageSquare,
  PenSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { AUTH_APP_URL, COMMUNITY_APP_URL, LEARN_APP_URL } from "../utils/MyConstants";

const INSTRUCTOR_ROLES = ["instructor", "administrator"];

// People who can use the instructor app: superusers, users bound to an
// instructor OR administrator byline (Instructor/Administrator registries), and
// profiles whose role is instructor/administrator.
function canUseInstructorApp(
  user: { is_superuser?: boolean } | null,
  profile: { is_instructor_byline?: boolean; is_administrator_byline?: boolean; role?: string | null } | null
): boolean {
  if (!user) return false;
  return (
    user.is_superuser ||
    Boolean(profile?.is_instructor_byline) ||
    Boolean(profile?.is_administrator_byline) ||
    (profile?.role != null && INSTRUCTOR_ROLES.includes(profile.role))
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: typeof BookOpen;
  match: (path: string) => boolean;
  superuserOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    title: "Manage",
    items: [
      { href: "/", label: "Courses", icon: BookOpen, match: (p) => p === "/" },
      {
        href: "/certificates",
        label: "Certificate",
        icon: Award,
        match: (p) => p.startsWith("/certificates"),
        superuserOnly: true,
      },
      {
        href: "/instructors",
        label: "Instructors",
        icon: Users,
        match: (p) => p.startsWith("/instructors"),
        superuserOnly: true,
      },
      {
        href: "/administrators",
        label: "Administrators",
        icon: ShieldCheck,
        match: (p) => p.startsWith("/administrators"),
        superuserOnly: true,
      },
      {
        href: "/titles",
        label: "Titles",
        icon: ClipboardList,
        match: (p) => p.startsWith("/titles"),
        superuserOnly: true,
      },
    ],
  },
  {
    title: "Programs",
    items: [
      { href: "/enrollments", label: "Enrollments", icon: ClipboardList, match: (p) => p.startsWith("/enrollments") },
      { href: "/cohorts", label: "Cohorts", icon: ListChecks, match: (p) => p.startsWith("/cohorts") },
    ],
  },
  {
    title: "Authoring",
    items: [
      { href: "/units", label: "Unit & Content", icon: FileStack, match: (p) => p.startsWith("/units") },
      { href: "/assessments", label: "Assessments", icon: PenSquare, match: (p) => p.startsWith("/assessments") },
    ],
  },
  {
    title: "Learners",
    items: [
      { href: "/records", label: "Students & Records", icon: GraduationCap, match: (p) => p.startsWith("/records") },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/finance", label: "Finance", icon: Landmark, match: (p) => p === "/finance" },
      {
        href: "/finance/analysis",
        label: "Financial Analysis",
        icon: ChartPie,
        match: (p) => p.startsWith("/finance/analysis"),
        superuserOnly: true,
      },
    ],
  },
];

const OTHER_APPS = [
  { label: "Community", url: COMMUNITY_APP_URL, icon: MessageSquare },
  { label: "Learn", url: LEARN_APP_URL, icon: Library },
  { label: "Auth / Account", url: AUTH_APP_URL, icon: Users },
];

function clearUrl(url?: string): string {
  if (!url) return "";
  return url.replace(/\/$/, "");
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuthStore();

  // Self-gate: only render the nav to an authorized role, an instructor-byline
  // user, or a superuser. The AuthGate around page content already enforces
  // this; this mirrors it for the shell.
  if (!user || !canUseInstructorApp(user, profile)) return null;

  const linkClasses = (item: NavItem) => {
    const active = item.match(pathname);
    return [
      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active
        ? "bg-[#195C49] text-white"
        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
    ].join(" ");
  };

  const renderLinks = () =>
    GROUPS.map((group) => (
      <div key={group.title} className="mb-5">
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {group.title}
        </p>
        <div className="space-y-0.5">
          {group.items
            .filter((item) => !item.superuserOnly || user.is_superuser)
            .map((item) => (
              <Link key={`${group.title}-${item.label}`} href={item.href} className={linkClasses(item)}>
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            ))}
        </div>
      </div>
    ));

  const renderOtherApps = () => (
    <div className="mb-5">
      <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        Other apps
      </p>
      <div className="space-y-0.5">
        {OTHER_APPS.map((app) => {
          const url = clearUrl(app.url);
          if (!url) return null;
          return (
            <a
              key={app.label}
              href={url}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <app.icon className="size-4 shrink-0" />
              {app.label}
              <span className="ml-auto text-[10px] text-gray-400">↗</span>
            </a>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white px-3 py-6 md:block">
        <nav className="sticky top-6">{renderLinks()}</nav>
        {/* <div className="mt-6 border-t border-gray-200 pt-4">
          {renderOtherApps()}
        </div> */}
      </aside>

      {/* Mobile horizontal nav */}
      <div className="border-b border-gray-200 bg-white md:hidden">
        <div className="flex gap-1 overflow-x-auto px-4 py-2">
          {GROUPS.flatMap((g) => g.items)
            .filter((item) => !item.superuserOnly || user.is_superuser)
            .map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
                  active ? "bg-[#195C49] text-white" : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
