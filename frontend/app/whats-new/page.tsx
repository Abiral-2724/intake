"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  ArrowLeft, BookOpen, Sheet, Sparkles, Zap, Brain, BarChart2,
  Globe, Mail, MessageSquare, ChevronRight, Star, Clock, Check,
  Table2, Download, GitMerge, Wand2, Eye, Bell, Languages,
  FileSearch, Bot, TrendingUp, Lock, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Data ─────────────────────────────────────────────────────────

const RELEASES = [
  {
    version: "v1.4.0",
    date: "March 2026",
    badge: "Latest",
    badgeColor: "bg-blue-600 text-white",
    title: "One-Click Integrations",
    subtitle: "Connect your form responses to Notion and Google Sheets instantly.",
    highlights: [
      {
        icon: "https://res.cloudinary.com/dci6nuwrm/image/upload/v1773051092/icons8-notion-64_gb39hv.png",
        color: "text-gray-900",
        bg: "bg-gray-100",
        title: "Notion Integration",
        description: "Connect any form to a Notion database with one click. Authenticate via OAuth, pick your database, and every new response auto-creates a row. Existing responses are bulk-synced on first connect — no manual exports ever again.",
        tags: ["OAuth 2.0", "Auto-sync", "Bulk import", "Live"],
      },
      {
        icon: "https://res.cloudinary.com/dci6nuwrm/image/upload/v1773051290/icons8-google-sheets-48_gcqjeh.png",
        color: "text-green-700",
        bg: "bg-green-100",
        title: "Google Sheets Integration",
        description: "Authorize once and Intake auto-creates a perfectly formatted spreadsheet with bold column headers matching your form fields. Every submission instantly appends a new row. Existing responses are synced immediately on setup.",
        tags: ["OAuth 2.0", "Auto-create sheet", "Real-time rows", "Live"],
      },
      {
        icon: "https://res.cloudinary.com/dci6nuwrm/image/upload/v1773071657/icons8-merge-git-32_lutt2j.png",
        color: "text-violet-700",
        bg: "bg-violet-100",
        title: "Bulk historical sync",
        description: "When you first connect an integration, all your existing responses are automatically pushed in the background — oldest first, with rate-limit-safe delays. You'll see the count in your terminal and the integration panel shows last sync time.",
        tags: ["Background sync", "Rate-limit safe", "Live"],
      },
    ],
  },
  {
    version: "v1.3.0",
    date: "February 2026",
    badge: "Previous",
    badgeColor: "bg-gray-200 text-gray-600",
    title: "Responses Overhaul",
    subtitle: "Table view, CSV/JSON exports, and a richer analytics dashboard.",
    highlights: [
      {
        icon: Table2,
        color: "text-blue-700",
        bg: "bg-blue-100",
        title: "Table view",
        description: "Browse all responses in a sortable, searchable spreadsheet-style table. Click any row to see the full response detail. Sort by any column — submitted date, name, rating, anything.",
        tags: ["Sortable", "Searchable", "Live"],
      },
      {
        icon: Download,
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        title: "CSV & JSON export",
        description: "Download all responses as a properly formatted CSV (opens in Excel/Numbers instantly) or structured JSON for developers. All columns, all rows, one click.",
        tags: ["CSV", "JSON", "Live"],
      },
      {
        icon: BarChart2,
        color: "text-amber-700",
        bg: "bg-amber-100",
        title: "Completion rate stats",
        description: "The responses header now shows Total responses, Questions tracked, and Completion rate at a glance — so you immediately know how engaged your respondents are.",
        tags: ["Analytics", "Live"],
      },
    ],
  },
  {
    version: "v1.2.0",
    date: "January 2026",
    badge: "Previous",
    badgeColor: "bg-gray-200 text-gray-600",
    title: "Themes & AI Assistant",
    subtitle: "Full visual customization and a Gemini-powered chat assistant.",
    highlights: [
      {
        icon: Palette,
        color: "text-pink-700",
        bg: "bg-pink-100",
        title: "Form Themes",
        description: "8 preset themes, custom primary/bg/text colors, 15 Google Fonts, cover images, logos, border radius controls, and a live mini-preview in the editor.",
        tags: ["Themes", "Live"],
      },
      {
        icon: Bot,
        color: "text-blue-700",
        bg: "bg-blue-100",
        title: "AI Assistant",
        description: "A floating Gemini-powered chat assistant that knows your form builder. Ask it how to set up conditional logic, what block types are available, or how to configure themes.",
        tags: ["Gemini", "Live"],
      },
      {
        icon: Wand2,
        color: "text-violet-700",
        bg: "bg-violet-100",
        title: "AI Form Generation",
        description: "Describe your form in plain English and Intake generates all the blocks, labels, and settings automatically. Edit, regenerate, or tweak afterwards.",
        tags: ["AI", "Live"],
      },
    ],
  },
];

const ROADMAP = [
  {
    category: "AI Features",
    color: "from-violet-500 to-purple-600",
    icon: Brain,
    items: [
      {
        icon: FileSearch,
        title: "AI Response Analyser",
        description: "Ask questions about your responses in plain English. \"What's the most common complaint?\" or \"Summarise all the feedback from last week.\" Powered by Gemini with full context of your response data.",
        effort: "High impact",
        effortColor: "text-violet-600 bg-violet-50",
      },
      {
        icon: TrendingUp,
        title: "Smart Insights",
        description: "Intake automatically surfaces trends, anomalies, and patterns in your responses — drop-off points, surprising answer distributions, sentiment shifts over time — without you having to ask.",
        effort: "High impact",
        effortColor: "text-violet-600 bg-violet-50",
      },
      {
        icon: Wand2,
        title: "AI Block Suggestions",
        description: "As you build a form, AI analyses what you've added and suggests the next most relevant question — based on form type, industry, and what other successful forms use.",
        effort: "Medium",
        effortColor: "text-blue-600 bg-blue-50",
      },
      {
        icon: Languages,
        title: "Auto-translate Forms",
        description: "One click to translate your entire form into any language. AI generates translated versions of all labels, options, and placeholder text while keeping your original intact.",
        effort: "Medium",
        effortColor: "text-blue-600 bg-blue-50",
      },
    ],
  },
  {
    category: "Integrations",
    color: "from-green-500 to-emerald-600",
    icon: Zap,
    items: [
      {
        icon: Mail,
        title: "Email notifications",
        description: "Send a custom confirmation email to respondents instantly after submission. Fully templated with your form branding, a summary of their answers, and a custom thank-you message.",
        effort: "High impact",
        effortColor: "text-violet-600 bg-violet-50",
      },
      {
        icon: MessageSquare,
        title: "Slack notifications",
        description: "Get a Slack message in any channel every time a form is submitted. Shows respondent name, key answers, and a link to the full response in Intake.",
        effort: "Medium",
        effortColor: "text-blue-600 bg-blue-50",
      },
      {
        icon: Globe,
        title: "Zapier & Make webhooks",
        description: "Send responses to any app — HubSpot, Airtable, Salesforce, Jira — via Zapier or Make. Configure the webhook URL once and Intake pushes every submission automatically.",
        effort: "Medium",
        effortColor: "text-blue-600 bg-blue-50",
      },
    ],
  },
  {
    category: "Forms & UX",
    color: "from-blue-500 to-cyan-600",
    icon: Sparkles,
    items: [
      {
        icon: Eye,
        title: "Partial response saving",
        description: "Respondents can save their progress mid-form and return later — great for long intake forms or applications. Answers are stored locally and restored automatically.",
        effort: "High impact",
        effortColor: "text-violet-600 bg-violet-50",
      },
      {
        icon: Bell,
        title: "Response alerts",
        description: "Get notified in-app (and optionally by email) when a new response comes in. Set thresholds — \"alert me when I hit 100 responses\" or \"alert me for every new submission.\"",
        effort: "Easy",
        effortColor: "text-green-600 bg-green-50",
      },
      {
        icon: Lock,
        title: "Team collaboration",
        description: "Leave comments on individual responses, tag teammates for review, and mark responses as reviewed/actioned. Makes Intake work as a lightweight triage tool for support and HR teams.",
        effort: "High impact",
        effortColor: "text-violet-600 bg-violet-50",
      },
      {
        icon: Star,
        title: "Form scoring & quizzes",
        description: "Assign point values to answers and calculate a total score automatically. Show respondents their score at the end. Perfect for assessments, tests, and personality quizzes.",
        effort: "Medium",
        effortColor: "text-blue-600 bg-blue-50",
      },
    ],
  },
];

// ── Components ───────────────────────────────────────────────────

function ReleaseCard({ release, isFirst }: { release: typeof RELEASES[0]; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(isFirst);

  return (
    <div className={cn(
      "border rounded-2xl overflow-hidden transition-all",
      isFirst ? "border-blue-200 shadow-sm shadow-blue-100" : "border-gray-200"
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex-1 flex items-center gap-3 flex-wrap">
          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", release.badgeColor)}>
            {release.badge}
          </span>
          <span className="text-xs font-mono text-gray-400 border border-gray-200 px-2 py-0.5 rounded-md">
            {release.version}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />{release.date}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{release.title}</p>
            <p className="text-xs text-gray-400">{release.subtitle}</p>
          </div>
          <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform shrink-0", expanded && "rotate-90")} />
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="sm:hidden mb-4 pt-4">
            <p className="text-base font-semibold text-gray-900">{release.title}</p>
            <p className="text-sm text-gray-400">{release.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
            {release.highlights.map((h) => (
              <div key={h.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", h.bg)}>
                  <img src={h.icon} alt="" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{h.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{h.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {h.tags.map(tag => (
                    <span key={tag} className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      tag === "Live" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                    )}>
                      {tag === "Live" ? "✓ Live" : tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RoadmapSection({ section }: { section: typeof ROADMAP[0] }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center", section.color)}>
          <section.icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-bold text-gray-900">{section.category}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {section.items.map((item) => (
          <div key={item.title}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                <item.icon className="w-4.5 h-4.5 text-gray-600" style={{ width: 18, height: 18 }} />
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", item.effortColor)}>
                {item.effort}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1.5">{item.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function WhatsNewPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"releases" | "roadmap">("releases");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-7 py-8 max-w-5xl mx-auto w-full">

            {/* ── Hero ── */}
            <div className="mb-8">
              <button onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl px-8 py-10 overflow-hidden">
                {/* decorative dots */}
                <div className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                {/* glow */}
                <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Changelog</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">What's new in Intake</h1>
                    <p className="text-sm text-white/50 max-w-lg">
                      New features, improvements, and what's coming next. We ship fast — check back often.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 text-right">
                    <div className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-medium text-white">v1.4.0 is live</span>
                    </div>
                    <span className="text-xs text-white/40">March 2026</span>
                  </div>
                </div>

                {/* stat pills */}
                <div className="relative z-10 flex items-center gap-3 mt-7 flex-wrap">
                  {[
                    { label: "Features shipped", value: "24+" },
                    { label: "Integrations", value: "2 live" },
                    { label: "AI features", value: "3 live" },
                    { label: "On roadmap", value: "11 more" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                      <p className="text-base font-bold text-white">{value}</p>
                      <p className="text-[10px] text-white/50">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-1 mb-7 bg-white border border-gray-200 rounded-xl p-1 w-fit">
              {([
                { id: "releases", label: "Release notes", icon: Clock },
                { id: "roadmap", label: "What's coming", icon: TrendingUp },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all",
                    tab === id ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                  )}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            {/* ── Release Notes ── */}
            {tab === "releases" && (
              <div className="space-y-4">
                {RELEASES.map((release, i) => (
                  <ReleaseCard key={release.version} release={release} isFirst={i === 0} />
                ))}

                {/* bottom CTA */}
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-sm text-gray-400 mb-1">Want to suggest a feature?</p>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="text-sm text-blue-600 hover:underline font-medium">
                    Submit a feature request →
                  </button>
                </div>
              </div>
            )}

            {/* ── Roadmap ── */}
            {tab === "roadmap" && (
              <div className="space-y-10">
                {/* legend */}
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span className="font-semibold text-gray-700">Priority:</span>
                  {[
                    { label: "High impact", color: "text-violet-600 bg-violet-50" },
                    { label: "Medium", color: "text-blue-600 bg-blue-50" },
                    { label: "Easy win", color: "text-green-600 bg-green-50" },
                  ].map(({ label, color }) => (
                    <span key={label} className={cn("px-2.5 py-1 rounded-full font-semibold", color)}>{label}</span>
                  ))}
                  <span className="ml-auto text-gray-400 italic">None of these have ship dates yet — just what we're excited about.</span>
                </div>

                {ROADMAP.map(section => (
                  <RoadmapSection key={section.category} section={section} />
                ))}

                {/* bottom note */}
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 rounded-2xl px-6 py-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                      <Brain className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-1">Our AI vision for Intake</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Every form tool collects data. We want Intake to be the first that <em>understands</em> it. The roadmap above represents our bet that the most valuable thing we can build is an AI layer that turns raw responses into clear decisions — automatically surfacing what matters, translating it into action, and learning from every form you run.
                      </p>
                    </div>
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