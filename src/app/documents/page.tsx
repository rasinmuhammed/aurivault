"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { SignedIn, SignedOut, useOrganization } from "@clerk/nextjs";
import Link from "next/link";

export default function DocumentsPage() {
  const { data, refetch, isFetching } = api.documents.list.useQuery();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const org = useOrganization();

  const onUpload = async () => {
    setError(null);
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        throw new Error(data.error ?? "Upload failed");
      }
      setFile(null);
      refetch();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-6">
      <SignedOut>
        <div className="rounded border p-4">Please <Link href="/sign-in" className="underline">sign in</Link>.</div>
      </SignedOut>
      <SignedIn>
        {!org.organization && (
          <div className="mb-4 rounded border border-yellow-500/40 bg-yellow-500/10 p-3 text-yellow-300">
            No organization selected. Use the organization switcher in the navbar before uploading.
          </div>
        )}
        <div className="mb-4 flex items-center gap-2">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button
            className="rounded bg-white/10 px-4 py-2 hover:bg-white/20 disabled:opacity-50"
            onClick={onUpload}
            disabled={!file || uploading || !org.organization}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {error && <div className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-red-300">{error}</div>}
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


