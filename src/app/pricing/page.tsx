export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 text-white">
      <h1 className="text-4xl font-extrabold">Pricing</h1>
      <p className="mt-2 text-slate-300">Simple, transparent plans that scale with you.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold">Starter</h2>
          <p className="mt-1 text-sm text-slate-400">For small teams starting out</p>
          <div className="mt-4 text-3xl font-bold">
            $0 <span className="text-base font-normal text-slate-400">/ mo</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>• 1 organization</li>
            <li>• 200 documents</li>
            <li>• Community MiniLM embeddings</li>
            <li>• Groq Llama-3.1 (rate-limited)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-6">
          <h2 className="text-xl font-semibold">Growth</h2>
          <p className="mt-1 text-sm text-slate-400">Best for growing teams</p>
          <div className="mt-4 text-3xl font-bold">
            $49 <span className="text-base font-normal text-slate-400">/ mo</span>
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>• 5 organizations</li>
            <li>• 5,000 documents</li>
            <li>• Priority vector search</li>
            <li>• Groq Llama-3.1 with higher limits</li>
            <li>• Email support</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6">
          <h2 className="text-xl font-semibold">Enterprise</h2>
          <p className="mt-1 text-sm text-slate-400">For compliance-heavy orgs</p>
          <div className="mt-4 text-3xl font-bold">
            Custom
          </div>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            <li>• Unlimited organizations</li>
            <li>• SSO, audit logs, DPA</li>
            <li>• Dedicated vector infrastructure</li>
            <li>• Dedicated models & adapters</li>
            <li>• SLA & priority support</li>
          </ul>
        </div>
      </div>
    </main>
  );
}


