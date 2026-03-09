"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import {
  Search, BookOpen, Sparkles, Zap, BarChart2, Layout, Brain,
  ChevronRight, ChevronDown, ArrowLeft, MessageSquare,
  Globe, Shield, Settings, Users, Star, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    icon: BookOpen, color: "bg-blue-50 text-blue-600", title: "Getting started",
    articles: [
      { q: "What is Intake?", a: "Intake is an AI-powered form builder. You can create forms from scratch, use templates, or generate an entire form from a single text prompt using Gemini AI. Collect responses, view analytics, and sync data to Notion or Google Sheets." },
      { q: "How do I create my first form?", a: "Start by creating a workspace from your dashboard. Inside the workspace, click '+ New form'. You'll enter the editor where you can add blocks, use AI generation, or pick a template. When you're ready, hit 'Publish' in the top-right corner." },
      { q: "What are workspaces?", a: "Workspaces are containers for your forms. Think of them like folders — one workspace per project, team, or client. You can create as many as you need and each one has its own set of forms and members." },
      { q: "How do I share my form?", a: "Click the 'Publish' button in the editor toolbar, then use the share icon to copy your form's public URL. The format is /f/your-slug. You can share this link anywhere — no login required for respondents." },
    ]
  },
  {
    icon: Sparkles, color: "bg-violet-50 text-violet-600", title: "AI features",
    articles: [
      { q: "How does AI form generation work?", a: "In the editor, click '✨ Generate with AI' and type a description of the form you want. Gemini reads your prompt and creates a complete form with the right block types, labels, and options. You can edit anything afterwards." },
      { q: "What is the Response Analyser?", a: "The Response Analyser lets you ask natural language questions about your form data — for example 'What is the most common complaint?' or 'Summarise feedback from last week'. Navigate to Responses → AI Insights → Ask Anything." },
      { q: "What are Smart Insights?", a: "Smart Insights automatically analyses all your responses and surfaces trends, anomalies, sentiment shifts, and recommendations without you having to ask. Go to Responses → AI Insights → Smart Insights and click Generate." },
      { q: "How does Auto-translate work?", a: "In the editor toolbar, click the globe/translate icon. Choose a target language, preview the translation side-by-side with the original, then click Apply to save. All labels, options, placeholders, and the submit button are translated." },
      { q: "What is AI Block Suggestions?", a: "While building, an AI Suggestions panel appears below your blocks. It analyses your form and suggests the 4-6 most relevant next questions. Click the + button on any suggestion to instantly add it." },
    ]
  },
  {
    icon: Layers, color: "bg-green-50 text-green-600", title: "Building forms",
    articles: [
      { q: "What block types are available?", a: "Intake has 19 block types: Short answer, Long answer, Multiple choice, Checkboxes, Dropdown, Email, Phone, Number, Link/URL, Date, Time, Rating (stars), Linear scale, File upload, Heading 1, Heading 2, Text paragraph, Divider, and Page break." },
      { q: "How do I add a page break?", a: "Go to Settings tab → Pages. Click 'Add page break at end', or go to the Build tab and use the + button between blocks and select 'Page break' from the picker. The form will show Next/Back buttons to respondents." },
      { q: "How does conditional logic work?", a: "In the Logic tab of the editor, click '+ Add rule'. Choose a source block, an operator (equals, contains, is empty, etc.), a value, and then choose whether to Show or Hide a target block when the condition is met." },
      { q: "Can I customise how my form looks?", a: "Yes — in the Themes tab you can choose from 8 presets or fully customise the primary color, background, text color, font family (15 Google Fonts), border radius, and toggle the progress bar. You can also add a cover image and logo." },
    ]
  },
  {
    icon: Zap, color: "bg-amber-50 text-amber-600", title: "Integrations",
    articles: [
      { q: "How do I connect Notion?", a: "Go to your form's Responses page and click Integrations. Click 'Connect Notion', authorise with your Notion account, then choose which database to sync to. Every future response is automatically pushed to that database." },
      { q: "How do I connect Google Sheets?", a: "Same flow as Notion. Click Integrations → Connect Google Sheets → authorise with Google → Intake creates a spreadsheet with your form's headers automatically. Responses stream in as they arrive." },
      { q: "Are existing responses synced when I first connect?", a: "Yes. When you connect an integration for the first time, Intake runs a bulk sync of all existing responses in the background (with a small delay between each to respect rate limits). You'll see a syncing indicator during this process." },
      { q: "What happens if a sync fails?", a: "Intake logs the last error on each integration and retries automatically. You can view the error in the Integrations panel. Common causes are token expiry (reconnect) and missing Notion properties (Intake auto-adds them now)." },
    ]
  },
  {
    icon: BarChart2, color: "bg-pink-50 text-pink-600", title: "Responses & analytics",
    articles: [
      { q: "Where do I see my responses?", a: "In the editor, click the chart icon in the toolbar, or navigate to /forms/[formId]/responses. You'll find three views: Summary (aggregate charts), Table (all responses in a grid), and Individual (one response at a time)." },
      { q: "What does the Analytics page show?", a: "The Analytics page has stat cards (total responses, completion rate, avg per day), a submission volume bar chart grouped by day/week/month, a cumulative growth line chart, and per-question breakdowns with pie/bar charts." },
      { q: "Can I export responses?", a: "Yes. On the Responses page, click Export → CSV or Export → JSON. CSV is useful for spreadsheet tools; JSON gives you the full structured data. Both include all visible responses up to 1,000 records." },
      { q: "How do I delete responses?", a: "In the Individual view, click the trash icon on any response. Or use the 'Clear all' button in the header to remove all responses at once. Both actions are permanent." },
    ]
  },
  {
    icon: Settings, color: "bg-indigo-50 text-indigo-600", title: "Form settings",
    articles: [
      { q: "Can I limit the number of responses?", a: "Yes. In Settings → Limits → Max responses. Once the limit is reached the form closes automatically and shows a 'Form closed' message to new visitors." },
      { q: "Can I close a form at a specific date?", a: "Yes. Settings → Limits → Close form at. Set any future date and time; the form closes automatically at that moment." },
      { q: "Can I password-protect a form?", a: "Yes. In Settings, enable password protection and set a password. Respondents will see a password prompt before accessing the form." },
      { q: "What is the redirect URL setting?", a: "Instead of showing the default 'Thank you' screen after submission, you can redirect respondents to any URL — your website, a calendar booking page, a payment page, etc." },
    ]
  },
];

function ArticleAccordion({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border-b border-gray-100 last:border-0 transition-colors", open && "bg-blue-50/30")}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-start justify-between gap-4 py-4 text-left">
        <span className={cn("text-sm font-medium transition-colors", open ? "text-blue-700" : "text-gray-900")}>{q}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 mt-0.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="text-sm text-gray-600 leading-relaxed pb-4 pr-8">{a}</p>}
    </div>
  );
}

export default function HelpCentre() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const searchResults = search.trim().length > 1
    ? CATEGORIES.flatMap(c => c.articles.filter(a => a.q.toLowerCase().includes(search.toLowerCase()) || a.a.toLowerCase().includes(search.toLowerCase())).map(a => ({ ...a, category: c.title })))
    : [];

  const displayCategories = activeCategory
    ? CATEGORIES.filter(c => c.title === activeCategory)
    : CATEGORIES;

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

            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-3xl px-8 py-10 mb-8 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Help Centre</h1>
              <p className="text-blue-100 mb-6">Find answers to common questions about Intake</p>
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search} onChange={e => { setSearch(e.target.value); setActiveCategory(null); }}
                  placeholder="Search help articles…"
                  className="w-full pl-11 pr-4 py-3 bg-white rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
                />
              </div>
            </div>

            {/* Search results */}
            {search.trim().length > 1 && (
              <div className="mb-8">
                <p className="text-sm font-semibold text-gray-500 mb-3">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{search}"</p>
                {searchResults.length === 0
                  ? <p className="text-sm text-gray-400 text-center py-8">No articles found. Try different keywords or <button onClick={() => router.push("/support")} className="text-blue-600 underline">contact support</button>.</p>
                  : <div className="bg-white border border-gray-200 rounded-2xl px-5 divide-y divide-gray-100">
                      {searchResults.map((r, i) => (
                        <div key={i} className="py-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{r.category}</p>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{r.q}</p>
                          <p className="text-xs text-gray-500 leading-relaxed">{r.a}</p>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}

            {/* Category filter */}
            {!search.trim() && (
              <div className="flex gap-2 flex-wrap mb-6">
                <button onClick={() => setActiveCategory(null)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                    !activeCategory ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
                  All topics
                </button>
                {CATEGORIES.map(c => (
                  <button key={c.title} onClick={() => setActiveCategory(c.title === activeCategory ? null : c.title)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                      activeCategory === c.title ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300")}>
                    {c.title}
                  </button>
                ))}
              </div>
            )}

            {/* Categories */}
            {!search.trim() && (
              <div className="space-y-4">
                {displayCategories.map(cat => (
                  <div key={cat.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", cat.color.split(" ")[0])}>
                        <cat.icon className={cn("w-4 h-4", cat.color.split(" ")[1])} />
                      </div>
                      <h2 className="text-sm font-bold text-gray-900">{cat.title}</h2>
                      <span className="text-xs text-gray-400 ml-auto">{cat.articles.length} articles</span>
                    </div>
                    <div className="px-5">
                      {cat.articles.map((a, i) => <ArticleAccordion key={i} q={a.q} a={a.a} />)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Contact CTA */}
            <div className="mt-8 bg-gray-900 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-white font-semibold">Still need help?</p>
                <p className="text-gray-400 text-sm mt-0.5">Our support team is here for you</p>
              </div>
              <button onClick={() => router.push("/support")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
                <MessageSquare className="w-4 h-4" /> Contact support
              </button>
            </div>

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}