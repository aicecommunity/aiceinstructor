"use client";

import Link from "next/link";
import { useAuthStore } from "../store/useAuthStore";
import { AUTH_APP_URL, COMMUNITY_APP_URL, LEARN_APP_URL } from "../utils/MyConstants";

const crossLinks = [
  { label: "Community", url: COMMUNITY_APP_URL },
  { label: "Learn", url: LEARN_APP_URL },
  { label: "Auth", url: AUTH_APP_URL },
];

export default function Navbar() {
  const { user, profile } = useAuthStore();

  const displayName = profile?.full_name || user?.full_name || user?.email || "Instructor";
  const authUrl = AUTH_APP_URL ? `${AUTH_APP_URL.replace(/\/$/, "")}/?redirect=instructor` : "/";

  return (
    <nav className="bg-[#195C49] text-white h-20 flex items-center justify-between px-5 md:px-9">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-semibold text-lg">
          AiCE Instructor
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2">
          {crossLinks.map((link) =>
            link.url ? (
              <a
                key={link.label}
                href={link.url.replace(/\/$/, "")}
                className="rounded-md px-2.5 py-1 text-xs hover:bg-white/10"
              >
                {link.label}
              </a>
            ) : null
          )}
        </div>
        <span className="mx-2 hidden h-6 w-px bg-white/25 sm:block" />
        {user ? (
          <span className="text-sm">{displayName}</span>
        ) : (
          <Link href={authUrl} className="text-sm hover:opacity-80">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
