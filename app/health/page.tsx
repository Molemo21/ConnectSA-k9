"use client"

import { useEffect, useRef, useState } from "react"

export default function HealthPage() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [swOk, setSwOk] = useState<boolean | null>(null)
  const [emailTo, setEmailTo] = useState("")
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string>("")
  const swChecked = useRef(false)

  useEffect(() => {
    // Check API health
    fetch("/api/health").then(r => setApiOk(r.ok)).catch(() => setApiOk(false))

    // Check Service Worker
    if (!swChecked.current && "serviceWorker" in navigator) {
      swChecked.current = true
      navigator.serviceWorker.getRegistration().then(reg => setSwOk(!!reg))
    }
  }, [])

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setSendResult("")
    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emailTo, subject: "Health Test", message: "This is a health test email." })
      })
      const data = await res.json()
      setSendResult(res.ok ? "Email sent" : (data?.error || "Failed"))
    } catch (err) {
      setSendResult("Failed")
    } finally {
      setSending(false)
    }
  }

  const Badge = ({ ok }: { ok: boolean | null }) => (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${ok==null?"bg-gray-200 text-gray-700": ok?"bg-green-100 text-green-800":"bg-red-100 text-red-800"}`}>
      {ok==null ? "checking" : ok ? "ok" : "fail"}
    </span>
  )

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">System Health</h1>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span>API /api/health</span>
          <Badge ok={apiOk} />
        </div>
        <div className="flex items-center justify-between">
          <span>Service Worker (/sw.js)</span>
          <Badge ok={swOk} />
        </div>
      </div>

      <form onSubmit={onSend} className="space-y-3 border rounded-md p-4">
        <div>
          <label className="block text-sm mb-1">Send Test Email To</label>
          <input
            type="email"
            value={emailTo}
            onChange={(e)=>setEmailTo(e.target.value)}
            placeholder="you@example.com"
            className="w-full border rounded-md px-3 py-2"
            required
          />
        </div>
        <button disabled={sending} className="px-3 py-2 rounded-md bg-black text-white disabled:opacity-60">
          {sending ? "Sending..." : "Send Test Email"}
        </button>
        {sendResult && (
          <div className="text-sm text-gray-700">{sendResult}</div>
        )}
      </form>

      <div className="text-sm text-gray-600">
        Need API requests? Import the Postman/Thunder collections in the <code>collections/</code> folder.
      </div>
    </div>
  )
}





