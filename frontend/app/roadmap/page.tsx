"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  CheckCircle2, Clock, Sparkles, Zap, Globe, BarChart2,
  Brain, Mail, Layers, Users, Star, Shield, ArrowLeft,
  Rocket, Layout, Languages, MessageSquare, TrendingUp,
  ChevronRight, Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "live" | "building" | "planned" | "idea";

interface RoadmapItem {
  title: string;
  desc: string;
  status: Status;
  icon: any;
  tag: string;
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string; border: string; dot: string }> = {
  live:     { label: "Live",      color: "text-green-700",  bg: "bg-green-50",  border: "border-green-200", dot: "bg-green-500"  },
  building: { label: "Building",  color: "text-blue-700",   bg: "bg-blue-50",   border: "border-blue-200",  dot: "bg-blue-500"   },
  planned:  { label: "Planned",   color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-200", dot: "bg-amber-400"  },
  idea:     { label: "Idea",      color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-200",  dot: "bg-gray-300"   },
};

const ITEMS: RoadmapItem[] = [
  // Live
  { title: "AI Form Generation",       desc: "Generate complete forms from a text prompt using Gemini AI.",                                  status: "live",     icon: Sparkles,       tag: "AI"           },
  { title: "Multi-page Forms",         desc: "Split forms into pages with progress bar and per-page validation.",                            status: "live",     icon: Layout,         tag: "Forms"        },
  { title: "Notion Integration",       desc: "Auto-sync every response to a Notion database in real time.",                                  status: "live",     icon: Zap,            tag: "Integration"  },
  { title: "Google Sheets Sync",       desc: "Push responses directly into a Google Sheets spreadsheet.",                                    status: "live",     icon: Zap,            tag: "Integration"  },
  { title: "Conditional Logic",        desc: "Show, hide, or jump to blocks based on previous answers.",                                     status: "live",     icon: Layers,         tag: "Forms"        },
  { title: "Custom Themes",            desc: "8 presets and full custom color, font, and branding control.",                                 status: "live",     icon: Star,           tag: "Design"       },
  { title: "Form Analytics",           desc: "Charts, submission volume over time, per-question breakdowns.",                                status: "live",     icon: BarChart2,      tag: "Analytics"    },
  { title: "Response Analyser",        desc: "Ask questions about your response data in plain English.",                                     status: "live",     icon: Brain,          tag: "AI"           },
  { title: "Smart Insights",           desc: "Auto-generated trends, anomalies, and recommendations.",                                      status: "live",     icon: TrendingUp,     tag: "AI"           },
  { title: "AI Block Suggestions",     desc: "AI suggests the next most relevant questions as you build.",                                   status: "live",     icon: Sparkles,       tag: "AI"           },
  { title: "Auto-translate",           desc: "Translate your entire form to 15+ languages in one click.",                                   status: "live",     icon: Languages,      tag: "AI"           },
  // Building
  { title: "Email Notifications",      desc: "Send confirmation emails to respondents and alerts to form owners.",                          status: "building", icon: Mail,           tag: "Notifications"},
  { title: "Form Duplication",         desc: "One-click duplicate any form with all its blocks and settings.",                              status: "building", icon: Layout,         tag: "Forms"        },
  // Planned
  { title: "Response Status Pipeline", desc: "Tag responses as New, In Review, Contacted, Closed — a lightweight CRM.",                    status: "planned",  icon: CheckCircle2,   tag: "Responses"    },
  { title: "Team Comments",            desc: "Leave notes on individual responses for team collaboration.",                                 status: "planned",  icon: MessageSquare,  tag: "Collaboration"},
  { title: "Partial Response Saving",  desc: "Respondents can save progress and resume later.",                                             status: "planned",  icon: Clock,          tag: "Forms"        },
  { title: "AI Quiz Scoring",          desc: "Assign point values to answers; Gemini calculates score and gives a personalised result.",   status: "planned",  icon: Brain,          tag: "AI"           },
  { title: "Slack Integration",        desc: "Get a Slack message for every new form response.",                                            status: "planned",  icon: Zap,            tag: "Integration"  },
  { title: "Zapier / Webhook",         desc: "Trigger any external workflow when a form is submitted.",                                     status: "planned",  icon: Zap,            tag: "Integration"  },
  { title: "Response PDF Export",      desc: "Export a single response as a formatted PDF document.",                                       status: "planned",  icon: Globe,          tag: "Export"       },
  // Ideas
  { title: "Custom Domain",            desc: "Host forms on your own domain instead of intake.io/f/...",                                   status: "idea",     icon: Globe,          tag: "Enterprise"   },
  { title: "Spam Detection",           desc: "AI flags bot submissions and gibberish before they hit your inbox.",                          status: "idea",     icon: Shield,         tag: "AI"           },
  { title: "AI Personalised Thank You",desc: "Gemini writes a unique thank-you message based on each respondent's answers.",               status: "idea",     icon: Brain,          tag: "AI"           },
  { title: "SAML / SSO",               desc: "Enterprise single sign-on via SAML for team accounts.",                                      status: "idea",     icon: Users,          tag: "Enterprise"   },
];

const FILTERS: { label: string; value: Status | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Building", value: "building" },
  { label: "Planned", value: "planned" },
  { label: "Ideas", value: "idea" },
];

export default function RoadmapPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Status | "all">("all");

  const filtered = filter === "all" ? ITEMS : ITEMS.filter(i => i.status === filter);
  const counts = { live: ITEMS.filter(i=>i.status==="live").length, building: ITEMS.filter(i=>i.status==="building").length, planned: ITEMS.filter(i=>i.status==="planned").length, idea: ITEMS.filter(i=>i.status==="idea").length };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 max-w-5xl mx-auto w-full px-7 py-8">

            {/* Header */}
            <div className="mb-10">
              <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to dashboard
              </button>
              <div className="flex items-start gap-4 flex-wrap justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center">
                      <Rocket className="w-4.5 h-4.5 text-white" style={{width:18,height:18}} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Roadmap</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">What we're building</h1>
                  <p className="text-gray-500 max-w-xl">A transparent look at every feature — shipped, in progress, planned, and on the horizon. Updated as we build.</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {(Object.entries(counts) as [Status, number][]).map(([s, n]) => {
                    const m = STATUS_META[s];
                    return (
                      <div key={s} className={cn("rounded-xl border px-4 py-3 text-center min-w-[72px]", m.bg, m.border)}>
                        <p className={cn("text-xl font-bold", m.color)}>{n}</p>
                        <p className={cn("text-[10px] font-semibold uppercase tracking-wide mt-0.5", m.color)}>{m.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-7 flex-wrap">
              {FILTERS.map(f => (
                <button key={f.value} onClick={() => setFilter(f.value)}
                  className={cn("px-4 py-1.5 rounded-full text-sm font-semibold transition-all border",
                    filter === f.value ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
                  {f.label}
                  <span className={cn("ml-1.5 text-xs", filter===f.value?"opacity-70":"opacity-50")}>
                    {f.value === "all" ? ITEMS.length : counts[f.value as Status]}
                  </span>
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((item, i) => {
                const m = STATUS_META[item.status];
                return (
                  <div key={i} className={cn("bg-white border rounded-2xl p-5 transition-all hover:shadow-sm group", item.status === "live" ? "border-green-100" : "border-gray-200")}>
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        item.status === "live" ? "bg-green-50" :
                        item.status === "building" ? "bg-blue-50" :
                        item.status === "planned" ? "bg-amber-50" : "bg-gray-50")}>
                        <item.icon className={cn("w-4.5 h-4.5", item.status==="live"?"text-green-600":item.status==="building"?"text-blue-600":item.status==="planned"?"text-amber-600":"text-gray-400")} style={{width:18,height:18}} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", m.bg, m.color, m.border)}>
                            {m.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                        <span className="inline-block mt-2 text-[10px] font-semibold text-gray-300 uppercase tracking-wider">{item.tag}</span>
                      </div>
                      {item.status === "live" && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-1" />}
                      {item.status === "building" && <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0 mt-1" />}
                      {item.status === "planned" && <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-1" />}
                      {item.status === "idea" && <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-1" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer CTA */}
            <div className="mt-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl p-7 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white font-bold text-lg mb-1">Have a feature idea?</p>
                <p className="text-blue-100 text-sm">We'd love to hear what you'd like to see in Intake.</p>
              </div>
              <button onClick={() => router.push("/support")}
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2">
                Share feedback <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}