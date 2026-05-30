/**
 * MobileNav Component
 * 
 * Responsive navigation drawer for mobile viewports (< 768px).
 * Features:
 * - Hamburger menu button that toggles a full-height side drawer
 * - Smooth slide-in/out animation with backdrop
 * - Closes on route change, outside click, or Escape key
 * - Prevents body scroll when drawer is open
 * - Full keyboard accessibility (Tab, Escape)
 * - Respects prefers-reduced-motion
 * 
 * @example
 * ```tsx
 * <MobileNav />
 * ```
 */

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/merchant",  label: "Merchant"  },
  { href: "/analytics", label: "Analytics" },
  { href: "/profile",   label: "Profile"   },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close drawer on outside click (backdrop or outside drawer)
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      // Close if clicking backdrop or outside drawer
      if (backdropRef.current?.contains(target) || 
          (drawerRef.current && !drawerRef.current.contains(target))) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close drawer on Escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Hamburger button — visible only on mobile (< 768px) */}
      <button
        className="hamburger"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`hamburger-bar ${open ? "bar-top-open" : ""}`} aria-hidden="true" />
        <span className={`hamburger-bar ${open ? "bar-mid-open" : ""}`} aria-hidden="true" />
        <span className={`hamburger-bar ${open ? "bar-bot-open" : ""}`} aria-hidden="true" />
      </button>

      {/* Backdrop — semi-transparent overlay behind drawer */}
      {open && (
        <div
          ref={backdropRef}
          className="drawer-backdrop"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in drawer with navigation links */}
      <div
        id="mobile-drawer"
        ref={drawerRef}
        className={`mobile-drawer ${open ? "drawer-open" : ""}`}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        <nav>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`drawer-link ${pathname === href ? "drawer-link-active" : ""}`}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
