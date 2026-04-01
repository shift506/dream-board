"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/boardroom", label: "Boardroom" },
  { href: "/decisions", label: "Decisions" },
  { href: "/advisors", label: "Advisors" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-galaxy/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center">
          <img
            src="/brand/logo/ShiftFlow-Logo-Landscape-FullColour-DarkBackground-2500x930px-72dpi.png"
            alt="ShiftFlow"
            className="h-8 sm:h-[46px] w-auto"
          />
        </Link>

        <div className="hidden sm:flex items-center gap-0.5">
          {links.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-sub tracking-wide transition-colors duration-150 ${
                  active
                    ? "bg-new-leaf/15 text-new-leaf"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
