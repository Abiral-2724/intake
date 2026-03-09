"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Plus, Palette, Share2, BarChart2, Sparkles, GitBranch, Settings,
  ChevronRight, CheckCircle2, Play, BookOpen, Zap, ArrowRight,
  FileText, Layout, Type, AlignLeft, List, Hash, Mail, ToggleLeft,
  Star, SlidersHorizontal, ChevronDown, ExternalLink,
} from "lucide-react";

// ── Step data ────────────────────────────────────────────────────
const STEPS = [
  {
    id: "create",
    number: "01",
    title: "Create your first form",
    icon: Plus,
    color: "#2563eb",
    bg: "#eff6ff",
    duration: "2 min",
    summary: "Start from scratch or use a template to build your form in seconds.",
    content: [
      {
        heading: "Option A — Start from scratch",
        body: "Go to your workspace and click \"+ New form\". A blank form is created instantly and opened in the editor. You'll see the Build, Settings, Logic, and Themes tabs.",
        tip: "Your form auto-saves as you edit — you never need to hit a save button.",
      },
      {
        heading: "Option B — Use a template",
        body: "Visit the Templates page from the sidebar. Browse 9+ ready-made templates across Feedback, HR, Education, Events, and more. Click \"Use template\" to instantly scaffold a complete form you can then customise.",
        tip: "Templates copy all blocks and settings — nothing is shared, it's fully yours to edit.",
      },
      {
        heading: "Option C — Generate with AI",
        body: "Inside the editor, click the ✨ AI generate button in the top-right. Describe your form in plain English (e.g. \"A job application for a senior engineer\") and the AI will create a full form with the right fields.",
        tip: "You can also insert a few AI-generated blocks anywhere in an existing form using the inline AI option in the block picker.",
      },
    ],
  },
  {
    id: "blocks",
    number: "02",
    title: "Add and configure blocks",
    icon: Layout,
    color: "#7c3aed",
    bg: "#f5f3ff",
    duration: "3 min",
    summary: "Forms are made of blocks — questions, headings, images, dividers. Here's how to work with them.",
    content: [
      {
        heading: "Adding a block",
        body: "Hover between any two blocks to reveal the + button in the left gutter — click it to open the block picker. You can also use the \"+ Add a block\" button at the bottom of the canvas. Search for the block type you want.",
        tip: "The block picker has Layout blocks (Heading, Text, Divider, Image) and 14 Question types.",
      },
      {
        heading: "Block types at a glance",
        isList: true,
        items: [
          "Short answer — single line text input",
          "Long answer — multi-line textarea",
          "Multiple choice — pick exactly one option",
          "Checkboxes — pick one or more options",
          "Dropdown — select from a list",
          "Email / Phone / Number / URL — validated inputs",
          "Date / Time — date and time pickers",
          "Rating — 1–5 star rating",
          "Linear scale — 0–10 or custom range slider",
          "File upload — let respondents attach files",
          "Heading 1 / Heading 2 / Text / Divider — layout blocks",
        ],
      },
      {
        heading: "Configuring a block",
        body: "Click any block to select it. You'll see inline editing for the label, and a toolbar with Required/Optional toggle, Duplicate, and Delete options. For choice blocks (MC, Checkboxes, Dropdown) you can edit options inline.",
        tip: "Mark a block as Required to prevent form submission until it's answered.",
      },
      {
        heading: "Reordering blocks",
        body: "Drag the ⠿ grip handle on the left side of any block up or down to reorder it. Changes are saved automatically.",
      },
    ],
  },
  {
    id: "settings",
    number: "03",
    title: "Configure form settings",
    icon: Settings,
    color: "#059669",
    bg: "#ecfdf5",
    duration: "2 min",
    summary: "Control how your form behaves — submissions, notifications, limits, and branding.",
    content: [
      {
        heading: "Behaviour settings",
        body: "In the Settings tab of the editor, you can set: Submit button label, Thank you message (shown after submission), Redirect URL (send respondents to a custom URL), Allow multiple submissions, Require login to submit.",
      },
      {
        heading: "Limits",
        body: "Set a maximum number of responses to automatically close the form when the cap is reached. Set a scheduled close date to stop accepting responses at a specific time.",
        tip: "Useful for event registrations or giveaways with limited spots.",
      },
      {
        heading: "Security",
        body: "Enable password protection to require a password before viewing the form. This is great for internal forms or invite-only surveys.",
      },
      {
        heading: "Notifications",
        body: "Enable \"Notify me by email\" to receive an email notification for each new response. Add additional notification emails to loop in your team.",
      },
    ],
  },
  {
    id: "themes",
    number: "04",
    title: "Apply a theme",
    icon: Palette,
    color: "#ea580c",
    bg: "#fff7ed",
    duration: "1 min",
    summary: "Make your form match your brand with custom colors, fonts, and backgrounds.",
    content: [
      {
        heading: "Using presets",
        body: "Open the Themes tab in the editor. You'll see 8 built-in theme presets — Default, Midnight, Rose, Forest, Sunset, Lavender, Ocean, Minimal. Click any to instantly apply the color scheme and font.",
      },
      {
        heading: "Custom colors",
        body: "Use the color pickers under \"Colors\" to set your exact primary color (buttons, accents), background color, and text color. Enter a hex code or use the visual picker.",
        tip: "The live mini-preview at the bottom of the Themes tab shows exactly what respondents will see.",
      },
      {
        heading: "Fonts",
        body: "Choose from 15 Google Fonts including Inter, Poppins, Playfair Display, Space Grotesk, and more. The font is loaded automatically and applied to all form text.",
      },
      {
        heading: "Cover image & Logo",
        body: "Paste a URL for a cover image (full-width banner at the top) and/or logo (small image above the title). Great for branded company forms.",
      },
    ],
  },
  {
    id: "logic",
    number: "05",
    title: "Add conditional logic",
    icon: GitBranch,
    color: "#0891b2",
    bg: "#ecfeff",
    duration: "3 min",
    summary: "Show or hide fields based on previous answers to create dynamic, personalised forms.",
    content: [
      {
        heading: "What is conditional logic?",
        body: "Logic rules let you show or hide blocks based on what a respondent previously answered. For example: show a \"Explain further\" text box only if someone selects \"Other\" in a multiple choice question.",
      },
      {
        heading: "Setting up a rule",
        body: "Go to the Logic tab in the editor. Each block can have its own rule. Click \"+ Add rule\" under a block. Choose: When [block] [operator] [value] → Then [show/hide/jump to] [block].",
        tip: "Supported operators: equals, not equals, contains, is empty, is not empty, greater than, less than.",
      },
      {
        heading: "Actions",
        isList: true,
        items: [
          "Show block — make a hidden block visible when condition is met",
          "Hide block — hide a visible block when condition is met",
          "Jump to block — skip to a specific block (great for branching flows)",
        ],
      },
      {
        heading: "How it works on the public form",
        body: "Conditional logic is evaluated in real-time as respondents fill out the form. Hidden blocks are never submitted — so required fields that are hidden won't block submission.",
      },
    ],
  },
  {
    id: "publish",
    number: "06",
    title: "Publish and share",
    icon: Share2,
    color: "#16a34a",
    bg: "#f0fdf4",
    duration: "1 min",
    summary: "Make your form live and share it with the world.",
    content: [
      {
        heading: "Publishing your form",
        body: "Click the \"Publish\" button in the editor top-right. Your form status changes from Draft to Published and is now accessible at its public URL. Unpublish at any time by clicking the same button.",
        tip: "You can continue editing a published form — changes go live immediately.",
      },
      {
        heading: "Sharing",
        body: "Once published, click the Share icon (🔗) in the editor toolbar. The Share modal shows your form's public URL in the format: yourdomain.com/f/[slug]. Click Copy to copy the link.",
      },
      {
        heading: "Your form URL",
        body: "The form URL uses the slug that was auto-generated when you created the form. You can change the slug in Settings (the form must be unpublished first to change the slug).",
      },
    ],
  },
  {
    id: "responses",
    number: "07",
    title: "View and manage responses",
    icon: BarChart2,
    color: "#7c3aed",
    bg: "#f5f3ff",
    duration: "2 min",
    summary: "Analyse submissions, view individual responses, and export your data.",
    content: [
      {
        heading: "Responses page",
        body: "Click the 📊 Responses icon in the editor toolbar, or navigate to it from the workspace card dropdown. You'll see a summary view with charts for each question, plus a list of individual submissions.",
      },
      {
        heading: "Summary view",
        body: "The Summary tab shows aggregated data — choice distribution charts, average ratings, and response counts. Great for quick analysis.",
      },
      {
        heading: "Individual responses",
        body: "The Responses tab shows each submission in full. You can view the timestamp, answers to all questions, and delete individual responses.",
      },
      {
        heading: "Managing data",
        body: "Use \"Clear all responses\" to reset the form's submissions (useful during testing). Individual responses can also be deleted. Export functionality is on the roadmap.",
        tip: "Deleting responses is permanent and cannot be undone.",
      },
    ],
  },
];

const QUICK_TIPS = [
  { icon: Zap, text: "Auto-save — every change saves automatically, no manual save needed." },
  { icon: Sparkles, text: "AI generation — describe a form in plain English and get a complete form instantly." },
  { icon: FileText, text: "Templates — 9+ pre-built templates ready to customise." },
  { icon: GitBranch, text: "Logic — show/hide blocks dynamically based on answers." },
  { icon: Palette, text: "Themes — full branding with colors, fonts, cover images, and logo." },
  { icon: BarChart2, text: "Responses — real-time summary charts and individual response viewer." },
];

// ── Step card (expanded/collapsed) ──────────────────────────────
function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const Icon = step.icon;
  return (
    <div className={cn("bg-white border rounded-2xl overflow-hidden transition-all duration-200",
      open ? "border-gray-300 shadow-sm" : "border-gray-200 hover:border-gray-300")}>
      {/* Header */}
      <button className="w-full flex items-center gap-4 px-6 py-5 text-left" onClick={() => setOpen(!open)}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: step.bg }}>
          <Icon className="w-5 h-5" style={{ color: step.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-semibold" style={{ color: step.color }}>{step.number}</span>
            <span className="text-xs text-gray-400">· {step.duration}</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{step.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{step.summary}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {/* Expanded body */}
      {open && (
        <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-5">
          {step.content.map((section, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">{section.heading}</h4>
              {"isList" in section && section.isList ? (
                <ul className="space-y-1.5">
                  {(section.items as string[]).map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">{(section as any).body}</p>
              )}
              {"tip" in section && section.tip && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  <span className="text-amber-500 text-xs font-bold shrink-0 mt-0.5">💡</span>
                  <p className="text-xs text-amber-800">{section.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function GetStartedPage() {
  const router = useRouter();
  const [allOpen, setAllOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 max-w-3xl mx-auto px-8 py-8 w-full">

            {/* Hero */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 mb-4">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Get started guide</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Intake 👋</h1>
              <p className="text-gray-500 leading-relaxed mb-5">
                Intake is a powerful form builder. Build anything from simple contact forms to complex multi-step surveys with conditional logic, custom themes, and AI generation — in minutes.
              </p>
              <div className="flex items-center gap-3">
                <Button onClick={() => router.push("/dashboard")}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-5 rounded-xl">
                  <Plus className="w-4 h-4" />Go to dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push("/templates")}
                  className="gap-2 h-10 px-5 rounded-xl">
                  <FileText className="w-4 h-4" />Browse templates
                </Button>
              </div>
            </div>

            {/* Quick tips strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {QUICK_TIPS.map(({ icon: Icon, text }, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-3.5 flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* Step-by-step guide */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Step-by-step guide</h2>
              <button className="text-xs text-blue-600 hover:underline" onClick={() => setAllOpen(!allOpen)}>
                {allOpen ? "Collapse all" : "Expand all"}
              </button>
            </div>

            <div className="space-y-3">
              {STEPS.map((step, i) => (
                <StepCard key={step.id} step={step} index={i} />
              ))}
            </div>

            {/* Footer CTA */}
            <div className="mt-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">Ready to build?</h3>
                  <p className="text-blue-100 text-sm">Create your first form in under 2 minutes.</p>
                </div>
                <Button onClick={() => router.push("/dashboard")}
                  className="bg-white text-blue-600 hover:bg-blue-50 gap-2 shrink-0 h-10 px-5 rounded-xl font-semibold">
                  Start building <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="h-12" />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}