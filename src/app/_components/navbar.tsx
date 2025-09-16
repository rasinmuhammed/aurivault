"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { Lock } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/5 border-b border-white/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-slate-900" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 blur-lg opacity-50 animate-pulse" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
            AuriVault
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/#features" className="text-slate-300 hover:text-white transition-colors">Features</Link>
          <Link href="/#security" className="text-slate-300 hover:text-white transition-colors">Security</Link>
          <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
          <Link href="/chat" className="text-slate-300 hover:text-white transition-colors">Chat</Link>
          <Link href="/documents" className="text-slate-300 hover:text-white transition-colors">Documents</Link>
          <SignedIn>
            <OrganizationSwitcher afterLeaveOrganizationUrl="/" afterCreateOrganizationUrl="/" appearance={{ elements: { organizationSwitcherTrigger: "bg-white/5 hover:bg-white/10 rounded px-2 py-1" } }} />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 font-semibold hover:shadow-lg hover:shadow-amber-500/25 transform hover:scale-105 transition-all">
              Get Started
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}


