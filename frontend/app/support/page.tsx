"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  MessageSquare, Mail, ArrowLeft, CheckCircle2,
  Clock, Zap, BookOpen, ChevronRight, Loader2, Bug, Lightbulb, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", label: "Bug report", icon: Bug, color: "text-red-600 bg-red-50 border-red-200" },
  { value: "feature", label: "Feature request", icon: Lightbulb, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "question", label: "General question", icon: HelpCircle, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "billing", label: "Billing", icon: Zap, color: "text-violet-600 bg-violet-50 border-violet-200" },
];

export default function SupportPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 max-w-4xl mx-auto w-full px-7 py-8">

            <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to dashboard
            </button>

            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Message sent!</h2>
                <p className="text-gray-500 mb-1">Thanks for reaching out. We typically reply within 24 hours.</p>
                <p className="text-sm text-gray-400 mb-7">Check your inbox at <strong>{email}</strong></p>
                <div className="flex gap-3">
                  <button onClick={() => router.push("/dashboard")} className="bg-gray-900 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">Back to dashboard</button>
                  <button onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); setCategory(""); }} className="border border-gray-200 text-gray-600 font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">Send another</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: info */}
                <div className="lg:col-span-1 space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Contact support</h1>
                    <p className="text-sm text-gray-500">We're here to help. Send us a message and we'll get back to you.</p>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                    {[
                      { icon: Clock, title: "Response time", desc: "Within 24 hours on business days", color: "text-blue-600 bg-blue-50" },
                      { icon: Mail, title: "Email support", desc: "support@intake.io", color: "text-violet-600 bg-violet-50" },
                    ].map(item => (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.color)}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-blue-900 mb-2">Looking for quick answers?</p>
                    <button onClick={() => router.push("/help")} className="text-xs text-blue-700 font-medium flex items-center gap-1 hover:underline">
                      <BookOpen className="w-3.5 h-3.5" /> Browse the Help Centre <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Right: form */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-5">Send a message</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Your name <span className="text-red-400">*</span></label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Aarav Singh"
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email address <span className="text-red-400">*</span></label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                          className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-2 block">Category</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CATEGORIES.map(c => {
                          const [tc, bgc, bc] = c.color.split(" ");
                          return (
                            <button key={c.value} onClick={() => setCategory(c.value)}
                              className={cn("flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all",
                                category === c.value ? `${bgc} ${tc} ${bc} ring-2 ring-offset-1` : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300")}>
                              <c.icon className="w-4 h-4" />
                              {c.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Message <span className="text-red-400">*</span></label>
                      <textarea value={message} onChange={e => setMessage(e.target.value)}
                        placeholder="Describe your issue, question, or idea in as much detail as possible…"
                        rows={5}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
                      <p className="text-[11px] text-gray-400 mt-1 text-right">{message.length}/2000</p>
                    </div>

                    <button onClick={handleSubmit}
                      disabled={sending || !name.trim() || !email.trim() || !message.trim()}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                      {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <><MessageSquare className="w-4 h-4" /> Send message</>}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}