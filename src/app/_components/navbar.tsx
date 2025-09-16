"use client";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, OrganizationSwitcher } from "@clerk/nextjs";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/40 bg-[#0a0f1a]/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gold-gradient glow-gold" />
          <span className="text-lg font-semibold tracking-wide">AuriVault</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/chat" className="text-sm opacity-90 hover:opacity-100">Chat</Link>
          <Link href="/documents" className="text-sm opacity-90 hover:opacity-100">Documents</Link>
          <SignedIn>
            <OrganizationSwitcher afterLeaveOrganizationUrl="/" afterCreateOrganizationUrl="/" appearance={{ elements: { organizationSwitcherTrigger: "bg-white/5 hover:bg-white/10 rounded px-2 py-1" } }} />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="rounded bg-white/10 px-3 py-1 text-sm hover:bg-white/20">Sign in</Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}


