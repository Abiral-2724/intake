"use client";
import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Brain, Sparkles, Send, Loader2, TrendingUp, AlertTriangle,
  Star, Lightbulb, ArrowLeft, RefreshCw, MessageSquare,
  BarChart2, ChevronRight, Zap, CheckCircle2, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type InsightType = "trend" | "anomaly" | "sentiment" | "popular" | "suggestion";
type Severity    = "positive" | "neutral" | "warning";

interface Insight {
  type: InsightType;
  title: string;
  description: string;
  severity: Severity;
  metric?: string;
}

interface InsightsData {
  summary: string;
  insights: Insight[];
  topFindings: string[];
  recommendations: string[];
  responseCount: number;
  totalResponses: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

const INSIGHT_ICONS: Record<InsightType, any> = {
  trend: TrendingUp, anomaly: AlertTriangle, sentiment: Star,
  popular: BarChart2, suggestion: Lightbulb,
};
const SEVERITY_STYLES: Record<Severity, string> = {
  positive: "border-green-200 bg-green-50",
  neutral:  "border-gray-200 bg-gray-50",
  warning:  "border-amber-200 bg-amber-50",
};
const SEVERITY_ICON_STYLES: Record<Severity, string> = {
  positive: "bg-green-100 text-green-700",
  neutral:  "bg-gray-100 text-gray-600",
  warning:  "bg-amber-100 text-amber-700",
};
const SEVERITY_METRIC_STYLES: Record<Severity, string> = {
  positive: "bg-green-100 text-green-700",
  neutral:  "bg-gray-100 text-gray-600",
  warning:  "bg-amber-100 text-amber-700",
};

const STARTER_QUESTIONS = [
  "What's the most common answer across all questions?",
  "What percentage of responses are complete?",
  "Summarise the overall sentiment of the responses.",
  "Are there any unusual or unexpected patterns?",
  "Which question has the most varied responses?",
  "What are the top 3 takeaways from this data?",
];

export default function AIInsightsPage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();

  const [tab, setTab]               = useState<"insights" | "analyser">("insights");
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [formTitle, setFormTitle]   = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    // Load form title
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      axios.get(`${API}/forms/${formId}/responses?limit=1`, { headers: { "x-user-id": session.user.id } })
        .catch(() => {});
    });
  }, [formId]);

  async function loadInsights() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setInsightsLoading(true);
    try {
      const res = await axios.post(`${API}/forms/${formId}/ai/insights`, {}, {
        headers: { "x-user-id": session.user.id },
      });
      setInsightsData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate insights");
    } finally {
      setInsightsLoading(false);
    }
  }

  async function sendQuestion(question?: string) {
    const q = question || inputValue.trim();
    if (!q) return;
    setInputValue("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setMessages(prev => [...prev, { role: "user", content: q }, { role: "assistant", content: "", loading: true }]);
    setChatLoading(true);

    try {
      const res = await axios.post(`${API}/forms/${formId}/ai/analyse`, { question: q }, {
        headers: { "x-user-id": session.user.id },
      });
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: res.data.answer, loading: false };
        return updated;
      });
    } catch (err: any) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: "Sorry, I couldn't analyse the responses. Please try again.", loading: false };
        return updated;
      });
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 flex flex-col px-7 py-6 max-w-5xl mx-auto w-full">

            {/* Header */}
            <div className="mb-6">
              <button onClick={() => router.push(`/forms/${formId}/responses`)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to responses
              </button>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl flex items-center justify-center shadow-sm">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>
                    <p className="text-sm text-gray-500">Powered by Gemini — understands your response data</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
                  {([
                    { id: "insights", label: "Smart Insights", icon: Sparkles },
                    { id: "analyser", label: "Ask Anything", icon: MessageSquare },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        tab === id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-800")}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SMART INSIGHTS TAB ── */}
            {tab === "insights" && (
              <div className="flex-1">
                {!insightsData && !insightsLoading && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-violet-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Auto-generate insights</h2>
                    <p className="text-sm text-gray-500 max-w-sm mb-6">
                      Gemini analyses all your responses and surfaces trends, anomalies, sentiment, and actionable recommendations — automatically.
                    </p>
                    <button onClick={loadInsights}
                      className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                      <Sparkles className="w-4 h-4" /> Generate insights
                    </button>
                  </div>
                )}

                {insightsLoading && (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900">Analysing your responses…</p>
                      <p className="text-xs text-gray-400 mt-1">Gemini is reading through all submissions</p>
                    </div>
                  </div>
                )}

                {insightsData && !insightsLoading && (
                  <div className="space-y-6">
                    {/* Stats bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Responses analysed", value: insightsData.responseCount },
                        { label: "Insights found", value: insightsData.insights?.length || 0 },
                        { label: "Top findings", value: insightsData.topFindings?.length || 0 },
                        { label: "Recommendations", value: insightsData.recommendations?.length || 0 },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
                          <p className="text-xl font-bold text-gray-900">{value}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    {insightsData.summary && (
                      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                            <Brain className="w-4 h-4 text-violet-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">Executive Summary</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{insightsData.summary}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Insight cards */}
                    {insightsData.insights?.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Insights</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {insightsData.insights.map((insight, i) => {
                            const Icon = INSIGHT_ICONS[insight.type] || Info;
                            return (
                              <div key={i} className={cn("rounded-xl border p-5", SEVERITY_STYLES[insight.severity])}>
                                <div className="flex items-start justify-between mb-3">
                                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", SEVERITY_ICON_STYLES[insight.severity])}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  {insight.metric && (
                                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", SEVERITY_METRIC_STYLES[insight.severity])}>
                                      {insight.metric}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{insight.title}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">{insight.description}</p>
                                <span className="inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{insight.type}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Top findings + Recommendations */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {insightsData.topFindings?.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <h3 className="text-sm font-bold text-gray-900">Top Findings</h3>
                          </div>
                          <ul className="space-y-2">
                            {insightsData.topFindings.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {insightsData.recommendations?.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-bold text-gray-900">Recommendations</h3>
                          </div>
                          <ul className="space-y-2">
                            {insightsData.recommendations.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Regenerate */}
                    <div className="flex justify-center pt-2">
                      <button onClick={loadInsights}
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors">
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate insights
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── ANALYSER TAB ── */}
            {tab === "analyser" && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pb-4" style={{ maxHeight: "calc(100vh - 320px)" }}>
                  {messages.length === 0 && (
                    <div className="py-8">
                      <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <MessageSquare className="w-6 h-6 text-violet-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">Ask anything about your responses</p>
                        <p className="text-xs text-gray-400">Gemini reads all your form data and answers in plain English</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {STARTER_QUESTIONS.map(q => (
                          <button key={q} onClick={() => sendQuestion(q)}
                            className="text-left text-xs text-gray-600 bg-white border border-gray-200 hover:border-violet-300 hover:bg-violet-50 rounded-xl px-4 py-3 transition-all">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-1">
                          <Brain className="w-3.5 h-3.5 text-violet-600" />
                        </div>
                      )}
                      <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-gray-900 text-white rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                      )}>
                        {msg.loading ? (
                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analysing responses…
                          </div>
                        ) : msg.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex gap-2">
                    <input
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendQuestion()}
                      placeholder="Ask a question about your responses…"
                      disabled={chatLoading}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      onClick={() => sendQuestion()}
                      disabled={chatLoading || !inputValue.trim()}
                      className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0">
                      {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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