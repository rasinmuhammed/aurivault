"use client";
import { useState } from "react";
import { api } from "~/trpc/react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const ask = api.rag.ask.useMutation();
  return (
    <main className="mx-auto max-w-2xl p-6">
      <SignedOut>
        <div className="rounded border p-4">Please <Link href="/sign-in" className="underline">sign in</Link>.</div>
      </SignedOut>
      <SignedIn>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim()) ask.mutate({ question });
          }}
          className="flex gap-2"
        >
          <input
            className="flex-1 rounded border px-3 py-2 text-black"
            placeholder="Ask a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button className="rounded bg-white/10 px-4 py-2 hover:bg-white/20" disabled={ask.isPending}>
            Ask
          </button>
        </form>
        {ask.data && (
          <div className="mt-4 whitespace-pre-wrap">
            <h3 className="mb-2 text-lg font-semibold">Answer</h3>
            <div>{ask.data.answer}</div>
          </div>
        )}
      </SignedIn>
    </main>
  );
}


