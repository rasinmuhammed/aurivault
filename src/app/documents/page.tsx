"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function DocumentsPage() {
  const { data, refetch, isFetching } = api.documents.list.useQuery();
  const [file, setFile] = useState<File | null>(null);

  const onUpload = async () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    await fetch("/api/documents/upload", { method: "POST", body: fd });
    setFile(null);
    refetch();
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <SignedOut>
        <div className="rounded border p-4">Please <Link href="/sign-in" className="underline">sign in</Link>.</div>
      </SignedOut>
      <SignedIn>
        <div className="mb-4 flex items-center gap-2">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button className="rounded bg-white/10 px-4 py-2 hover:bg-white/20" onClick={onUpload} disabled={!file}>
            Upload
          </button>
        </div>
        <h2 className="mb-2 text-xl font-semibold">Documents</h2>
        {isFetching && <div>Loading…</div>}
        <ul className="space-y-2">
          {data?.map((d) => (
            <li key={d.id} className="rounded border p-3">
              <div className="font-medium">{d.title}</div>
              <div className="text-sm opacity-70">{d.filename}</div>
            </li>
          ))}
        </ul>
      </SignedIn>
    </main>
  );
}


