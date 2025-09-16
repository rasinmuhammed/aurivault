import Link from "next/link";

import { auth } from "@clerk/nextjs/server";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const { userId } = await auth();
  

  return (
    <HydrateClient>
      <main className="relative min-h-[80vh] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        >
          <source src="/hero-dark.mp4" type="video/mp4" />
        </video>
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-24">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Where Knowledge Glows, <span className="bg-gold-gradient bg-clip-text text-transparent">Securely</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg opacity-90">
            AuriVault turns hidden documents into living, cited insights. Multi-tenant by design, encrypted at rest,
            and illuminated by AI—so your teams can unlock the gold in your data.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/chat" className="rounded bg-gold-gradient px-6 py-3 font-semibold text-black glow-gold">Open the Assistant</Link>
            <Link href="/documents" className="rounded border border-gold px-6 py-3 font-semibold">Upload Documents</Link>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
