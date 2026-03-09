"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  ArrowLeft, TrendingUp, Users, CheckCircle2, Clock,
  BarChart2, Star, Activity, FileText, RefreshCw, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const CHART_COLORS = ["#2563eb","#7c3aed","#059669","#d97706","#dc2626","#0891b2","#7c2d12","#1d4ed8"];

type BlockSummary = {
  blockId: string; type: string; label: string; totalAnswers: number;
  distribution?: Record<string, number>;
  average?: number;
  samples?: any[];
};
type Summary = { totalResponses: number; blocks: BlockSummary[] };
type Resp = { id: string; submittedAt: string; isComplete: boolean };

// ── Helpers ───────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Submission volume over time ───────────────────────────────────
function buildTimeSeries(responses: Resp[], groupBy: "day"|"week"|"month") {
  const counts: Record<string, number> = {};
  responses.forEach(r => {
    const d = new Date(r.submittedAt);
    let key: string;
    if (groupBy === "day") {
      key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (groupBy === "week") {
      const start = new Date(d); start.setDate(d.getDate() - d.getDay());
      key = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

// ── Distribution chart ────────────────────────────────────────────
function DistributionChart({ block }: { block: BlockSummary }) {
  const data = Object.entries(block.distribution || {})
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) return <p className="text-sm text-gray-400 py-4">No data yet</p>;

  // Pie for ≤5 options, bar for more
  if (data.length <= 5) {
    return (
      <div className="flex gap-6 items-center">
        <div style={{ width: 160, height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val: any) => [`${val} (${Math.round(val/total*100)}%)`, "Responses"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="flex-1 text-gray-700 truncate">{d.name}</span>
              <span className="font-semibold text-gray-900">{d.value}</span>
              <span className="text-gray-400 text-xs w-9 text-right">{Math.round(d.value/total*100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(val: any) => [`${val} (${Math.round(val/total*100)}%)`, "Responses"]} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Rating/Scale chart ────────────────────────────────────────────
function RatingChart({ block }: { block: BlockSummary }) {
  const max = block.type === "RATING" ? 5 : 10;
  const dist = block.distribution || {};
  const data = Array.from({ length: max }, (_, i) => ({
    label: String(i + 1),
    count: dist[String(i + 1)] || 0,
  }));
  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-gray-900">{block.average?.toFixed(1)}</div>
        <div>
          {block.type === "RATING" && (
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(n => (
                <Star key={n} className={cn("w-5 h-5", n <= Math.round(block.average || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
              ))}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-0.5">avg · {block.totalAnswers} responses</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Block analytics card ──────────────────────────────────────────
function BlockCard({ block }: { block: BlockSummary }) {
  const typeLabel = block.type.replace(/_/g, " ").toLowerCase();
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-semibold text-gray-900 text-sm leading-snug">{block.label || "(no label)"}</p>
          <p className="text-xs text-gray-400 mt-0.5">{block.totalAnswers} answer{block.totalAnswers !== 1 ? "s" : ""}</p>
        </div>
        <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-100 rounded-md px-2 py-0.5 shrink-0">{typeLabel}</span>
      </div>

      {block.distribution && (["RATING","LINEAR_SCALE","NUMBER"].includes(block.type)
        ? <RatingChart block={block} />
        : <DistributionChart block={block} />
      )}

      {block.average !== undefined && block.average !== null && !block.distribution && (
        <RatingChart block={block} />
      )}

      {block.samples && (
        <div className="space-y-2">
          {block.samples.length === 0
            ? <p className="text-sm text-gray-400">No responses yet</p>
            : block.samples.map((s: any, i: number) => (
                <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 line-clamp-2">
                  {String(s)}
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();

  const [summary, setSummary]     = useState<Summary | null>(null);
  const [allResponses, setAll]    = useState<Resp[]>([]);
  const [formTitle, setFormTitle] = useState("Form Analytics");
  const [loading, setLoading]     = useState(true);
  const [timeGroup, setTimeGroup] = useState<"day"|"week"|"month">("day");
  const [user, setUser]           = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUser(session.user);
      loadAll(session.user.id);
    });
  }, [formId]);

  async function loadAll(uid: string) {
    setLoading(true);
    try {
      const [titleRes, summaryRes, allRes] = await Promise.all([
        axios.get(`${API}/forms/${formId}`, { headers: { "x-user-id": uid } }),
        axios.get(`${API}/forms/${formId}/responses/summary`, { headers: { "x-user-id": uid } }),
        axios.get(`${API}/forms/${formId}/responses?page=1&limit=1000`, { headers: { "x-user-id": uid } }),
      ]);
      setFormTitle(titleRes.data.data?.title || "Form Analytics");
      setSummary(summaryRes.data.data);
      setAll(allRes.data.data || []);
    } catch { toast.error("Failed to load analytics"); }
    finally { setLoading(false); }
  }

  // ── Derived stats ─────────────────────────────────────────────
  const completionRate = useMemo(() => {
    if (!allResponses.length) return 0;
    return Math.round(allResponses.filter(r => r.isComplete).length / allResponses.length * 100);
  }, [allResponses]);

  const avgPerDay = useMemo(() => {
    if (!allResponses.length) return 0;
    const dates = allResponses.map(r => new Date(r.submittedAt).toDateString());
    const uniqueDays = new Set(dates).size;
    return (allResponses.length / uniqueDays).toFixed(1);
  }, [allResponses]);

  const recentCount = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    return allResponses.filter(r => new Date(r.submittedAt) > cutoff).length;
  }, [allResponses]);

  const timeSeries = useMemo(() => buildTimeSeries(allResponses, timeGroup), [allResponses, timeGroup]);

  // ── Completion over time (cumulative) ─────────────────────────
  const cumulativeSeries = useMemo(() => {
    const sorted = [...allResponses].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    let count = 0;
    return sorted.map(r => {
      count++;
      return {
        date: new Date(r.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total: count,
      };
    });
  }, [allResponses]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-7 py-6 max-w-6xl mx-auto w-full">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <button onClick={() => router.push(`/forms/${formId}/responses`)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-2 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to responses
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                    <BarChart2 className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-400">{formTitle}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => user && loadAll(user.id)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors border border-gray-200 px-3 py-1.5 rounded-lg bg-white">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-6">

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard icon={Users}        label="Total responses"  value={summary?.totalResponses ?? 0}  color="bg-blue-500"   sub={`${recentCount} in last 7 days`} />
                  <StatCard icon={CheckCircle2} label="Completion rate"  value={`${completionRate}%`}           color="bg-green-500"  sub={`${allResponses.filter(r=>r.isComplete).length} complete`} />
                  <StatCard icon={Activity}     label="Avg per day"      value={avgPerDay}                      color="bg-violet-500" sub="submissions/day" />
                  <StatCard icon={FileText}     label="Questions"        value={summary?.blocks.length ?? 0}    color="bg-amber-500"  sub="tracked fields" />
                </div>

                {/* ── Volume over time ── */}
                {timeSeries.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <div>
                        <h2 className="text-sm font-bold text-gray-900">Submission volume</h2>
                        <p className="text-xs text-gray-400">Number of responses over time</p>
                      </div>
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                        {(["day","week","month"] as const).map(g => (
                          <button key={g} onClick={() => setTimeGroup(g)}
                            className={cn("text-xs px-3 py-1 rounded-md font-medium capitalize transition-all",
                              timeGroup === g ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-700")}>
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={timeSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="count" name="Responses" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ── Cumulative growth ── */}
                {cumulativeSeries.length > 1 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <h2 className="text-sm font-bold text-gray-900 mb-1">Cumulative responses</h2>
                    <p className="text-xs text-gray-400 mb-4">Total responses over time</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={cumulativeSeries} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip />
                        <Line type="monotone" dataKey="total" name="Total" stroke="#7c3aed" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* ── Per-question analytics ── */}
                {summary && summary.blocks.length > 0 && (
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Question breakdown</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {summary.blocks.map(block => (
                        <BlockCard key={block.blockId} block={block} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!summary || summary.blocks.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                      <BarChart2 className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">No data yet</p>
                    <p className="text-xs text-gray-400">Share your form to start collecting responses</p>
                  </div>
                )}

              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}