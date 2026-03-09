"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Search, ArrowRight, Star, Users, ClipboardList, Heart, Briefcase, GraduationCap, ShoppingCart, MessageSquare, Zap, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ── Template definitions ─────────────────────────────────────────
const CATEGORIES = ["All", "Feedback", "HR", "Education", "Events", "Leads", "Healthcare", "E-commerce"];

const TEMPLATES = [
  {
    id: "contact-us",
    title: "Contact Us",
    description: "Simple contact form with name, email, subject and message.",
    category: "Leads",
    icon: MessageSquare,
    color: "#2563eb",
    bg: "#eff6ff",
    popular: true,
    blocks: [
      { type: "HEADING_1", label: "Contact Us", required: false, config: {} },
      { type: "TEXT", label: "We'd love to hear from you. Fill out the form and we'll get back to you shortly.", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Full name", required: true, config: { placeholder: "John Doe" } },
      { type: "EMAIL", label: "Email address", required: true, config: { placeholder: "you@example.com" } },
      { type: "SHORT_ANSWER", label: "Subject", required: true, config: { placeholder: "What's this about?" } },
      { type: "LONG_ANSWER", label: "Message", required: true, config: { placeholder: "Tell us more…" } },
    ],
  },
  {
    id: "customer-feedback",
    title: "Customer Feedback",
    description: "NPS score, satisfaction rating, and open-ended feedback questions.",
    category: "Feedback",
    icon: Star,
    color: "#f59e0b",
    bg: "#fffbeb",
    popular: true,
    blocks: [
      { type: "HEADING_1", label: "Share Your Feedback", required: false, config: {} },
      { type: "TEXT", label: "Help us improve by sharing your experience.", required: false, config: {} },
      { type: "LINEAR_SCALE", label: "How likely are you to recommend us to a friend?", required: true, config: { min: 0, max: 10, minLabel: "Not likely", maxLabel: "Very likely" } },
      { type: "RATING", label: "Overall satisfaction", required: true, config: { maxRating: 5 } },
      { type: "MULTIPLE_CHOICE", label: "What did you like most?", required: false, config: { options: ["Product quality", "Customer service", "Pricing", "Ease of use", "Other"] } },
      { type: "LONG_ANSWER", label: "Any additional comments?", required: false, config: { placeholder: "Your thoughts…" } },
    ],
  },
  {
    id: "job-application",
    title: "Job Application",
    description: "Professional job application with personal info, experience, and resume upload.",
    category: "HR",
    icon: Briefcase,
    color: "#7c3aed",
    bg: "#f5f3ff",
    popular: true,
    blocks: [
      { type: "HEADING_1", label: "Job Application", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Full name", required: true, config: { placeholder: "Jane Smith" } },
      { type: "EMAIL", label: "Email address", required: true, config: { placeholder: "jane@example.com" } },
      { type: "PHONE_NUMBER", label: "Phone number", required: true, config: { placeholder: "+1 (555) 000-0000" } },
      { type: "DROPDOWN", label: "Position applying for", required: true, config: { options: ["Software Engineer", "Product Manager", "Designer", "Marketing", "Sales", "Other"] } },
      { type: "SHORT_ANSWER", label: "Years of experience", required: true, config: { placeholder: "e.g. 3 years" } },
      { type: "LINK", label: "LinkedIn profile", required: false, config: { placeholder: "https://linkedin.com/in/…" } },
      { type: "FILE_UPLOAD", label: "Upload your resume", required: true, config: {} },
      { type: "LONG_ANSWER", label: "Why do you want to work with us?", required: true, config: { placeholder: "Tell us about yourself…" } },
    ],
  },
  {
    id: "event-registration",
    title: "Event Registration",
    description: "Collect attendee info, ticket preferences, and dietary requirements.",
    category: "Events",
    icon: Users,
    color: "#059669",
    bg: "#ecfdf5",
    blocks: [
      { type: "HEADING_1", label: "Event Registration", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Full name", required: true, config: { placeholder: "Your name" } },
      { type: "EMAIL", label: "Email address", required: true, config: { placeholder: "you@example.com" } },
      { type: "DROPDOWN", label: "Ticket type", required: true, config: { options: ["General Admission", "VIP", "Student", "Group (5+)"] } },
      { type: "NUMBER", label: "Number of guests", required: false, config: { placeholder: "1" } },
      { type: "CHECKBOXES", label: "Dietary requirements", required: false, config: { options: ["Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "None"] } },
      { type: "MULTIPLE_CHOICE", label: "How did you hear about this event?", required: false, config: { options: ["Social media", "Email", "Friend", "Website", "Other"] } },
    ],
  },
  {
    id: "student-survey",
    title: "Student Survey",
    description: "Course feedback, learning experience, and improvement suggestions.",
    category: "Education",
    icon: GraduationCap,
    color: "#0891b2",
    bg: "#ecfeff",
    blocks: [
      { type: "HEADING_1", label: "Course Feedback Survey", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Course name", required: true, config: { placeholder: "e.g. Introduction to Python" } },
      { type: "RATING", label: "How would you rate this course overall?", required: true, config: { maxRating: 5 } },
      { type: "LINEAR_SCALE", label: "How engaging was the instructor?", required: true, config: { min: 1, max: 10, minLabel: "Not engaging", maxLabel: "Very engaging" } },
      { type: "CHECKBOXES", label: "What topics would you like more coverage on?", required: false, config: { options: ["Practical exercises", "Theory", "Case studies", "Group projects", "Guest speakers"] } },
      { type: "LONG_ANSWER", label: "What could be improved?", required: false, config: { placeholder: "Your suggestions…" } },
    ],
  },
  {
    id: "bug-report",
    title: "Bug Report",
    description: "Structured bug report with steps to reproduce, severity, and attachments.",
    category: "Feedback",
    icon: Zap,
    color: "#dc2626",
    bg: "#fef2f2",
    blocks: [
      { type: "HEADING_1", label: "Report a Bug", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Bug title", required: true, config: { placeholder: "Short description of the issue" } },
      { type: "LONG_ANSWER", label: "Steps to reproduce", required: true, config: { placeholder: "1. Go to…\n2. Click on…\n3. See error" } },
      { type: "SHORT_ANSWER", label: "Expected behaviour", required: true, config: { placeholder: "What should happen?" } },
      { type: "SHORT_ANSWER", label: "Actual behaviour", required: true, config: { placeholder: "What actually happened?" } },
      { type: "DROPDOWN", label: "Severity", required: true, config: { options: ["Critical", "High", "Medium", "Low"] } },
      { type: "SHORT_ANSWER", label: "Browser / OS", required: false, config: { placeholder: "e.g. Chrome 120, macOS 14" } },
      { type: "FILE_UPLOAD", label: "Screenshot (optional)", required: false, config: {} },
    ],
  },
  {
    id: "patient-intake",
    title: "Patient Intake",
    description: "New patient intake form with personal, medical, and insurance details.",
    category: "Healthcare",
    icon: Heart,
    color: "#e11d48",
    bg: "#fff1f2",
    blocks: [
      { type: "HEADING_1", label: "New Patient Intake", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Full legal name", required: true, config: { placeholder: "First Middle Last" } },
      { type: "DATE", label: "Date of birth", required: true, config: {} },
      { type: "MULTIPLE_CHOICE", label: "Biological sex", required: true, config: { options: ["Male", "Female", "Prefer not to say"] } },
      { type: "PHONE_NUMBER", label: "Phone number", required: true, config: { placeholder: "+1 (555) 000-0000" } },
      { type: "EMAIL", label: "Email address", required: false, config: { placeholder: "you@example.com" } },
      { type: "SHORT_ANSWER", label: "Insurance provider", required: false, config: { placeholder: "e.g. Blue Cross" } },
      { type: "LONG_ANSWER", label: "Current medications", required: false, config: { placeholder: "List any medications you are currently taking…" } },
      { type: "LONG_ANSWER", label: "Reason for visit", required: true, config: { placeholder: "Describe your symptoms or reason for the visit…" } },
    ],
  },
  {
    id: "product-order",
    title: "Product Order Form",
    description: "Simple order form with product selection, quantity, and delivery info.",
    category: "E-commerce",
    icon: ShoppingCart,
    color: "#ea580c",
    bg: "#fff7ed",
    blocks: [
      { type: "HEADING_1", label: "Place Your Order", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Full name", required: true, config: { placeholder: "Your name" } },
      { type: "EMAIL", label: "Email address", required: true, config: { placeholder: "you@example.com" } },
      { type: "PHONE_NUMBER", label: "Phone number", required: true, config: { placeholder: "+1 (555) 000-0000" } },
      { type: "DROPDOWN", label: "Product", required: true, config: { options: ["Product A — $29", "Product B — $49", "Product C — $99", "Custom order"] } },
      { type: "NUMBER", label: "Quantity", required: true, config: { placeholder: "1" } },
      { type: "LONG_ANSWER", label: "Delivery address", required: true, config: { placeholder: "Street, City, State, ZIP, Country" } },
      { type: "LONG_ANSWER", label: "Special instructions", required: false, config: { placeholder: "Any special requests?" } },
    ],
  },
  {
    id: "employee-onboarding",
    title: "Employee Onboarding",
    description: "Collect new hire details, emergency contacts, and equipment preferences.",
    category: "HR",
    icon: ClipboardList,
    color: "#0f766e",
    bg: "#f0fdfa",
    blocks: [
      { type: "HEADING_1", label: "Welcome! Let's get you set up.", required: false, config: {} },
      { type: "SHORT_ANSWER", label: "Full legal name", required: true, config: { placeholder: "As it appears on your ID" } },
      { type: "EMAIL", label: "Personal email", required: true, config: { placeholder: "personal@email.com" } },
      { type: "PHONE_NUMBER", label: "Phone number", required: true, config: { placeholder: "+1 (555) 000-0000" } },
      { type: "DATE", label: "Start date", required: true, config: {} },
      { type: "SHORT_ANSWER", label: "Emergency contact name", required: true, config: { placeholder: "Full name" } },
      { type: "PHONE_NUMBER", label: "Emergency contact phone", required: true, config: { placeholder: "+1 (555) 000-0000" } },
      { type: "CHECKBOXES", label: "Equipment needed", required: true, config: { options: ["MacBook Pro", "MacBook Air", "Windows Laptop", "External Monitor", "Keyboard & Mouse", "Standing Desk"] } },
      { type: "MULTIPLE_CHOICE", label: "Preferred work arrangement", required: true, config: { options: ["In-office", "Remote", "Hybrid"] } },
    ],
  },
];

// ── Template card ────────────────────────────────────────────────
function TemplateCard({ template, onPreview, onUse }: { template: typeof TEMPLATES[0]; onPreview: () => void; onUse: () => void }) {
  const Icon = template.icon;
  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200">
      {/* Preview strip */}
      <div className="h-28 relative flex flex-col justify-center px-5 gap-2"
        style={{ backgroundColor: template.bg }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${template.color}20` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
          </div>
          {template.popular && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${template.color}20`, color: template.color }}>
              Popular
            </span>
          )}
        </div>
        <div className="h-2 rounded-full w-3/4 opacity-30" style={{ backgroundColor: template.color }} />
        <div className="h-1.5 rounded-full w-1/2 bg-gray-300 opacity-30" />
        <div className="h-1.5 rounded-full w-2/3 bg-gray-300 opacity-20" />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); onPreview(); }}
            className="h-8 px-3 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />Preview
          </button>
        </div>
      </div>
      {/* Body */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{template.title}</h3>
        <p className="text-xs text-gray-400 leading-relaxed mb-3">{template.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{template.blocks.length} fields</span>
          <Button size="sm" className="h-7 text-xs gap-1 text-white"
            style={{ backgroundColor: template.color }}
            onClick={onUse}>
            Use template <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Preview modal ────────────────────────────────────────────────
function PreviewModal({ template, onClose, onUse }: { template: typeof TEMPLATES[0]; onClose: () => void; onUse: () => void }) {
  const Icon = template.icon;
  return (
    <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${template.color}18` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: template.color }} />
          </div>
          {template.title}
        </DialogTitle>
        <DialogDescription>{template.description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        {template.blocks.map((block, i) => (
          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white border border-gray-200 shrink-0 mt-0.5">
              <span className="text-[10px] font-mono text-gray-400">{i + 1}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-700">{block.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{block.type.replace(/_/g," ").toLowerCase()}{block.required ? " · required" : ""}</p>
            </div>
          </div>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button className="text-white gap-1.5" style={{ backgroundColor: template.color }} onClick={onUse}>
          Use this template <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ── Workspace picker modal ───────────────────────────────────────
function WorkspacePickerModal({ workspaces, onPick, onClose }: { workspaces: any[]; onPick: (id: string) => void; onClose: () => void }) {
  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Choose a workspace</DialogTitle>
        <DialogDescription>Select where to create this form from the template.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2 py-2">
        {workspaces.map((ws) => (
          <button key={ws.id} onClick={() => onPick(ws.id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-blue-600 text-xs font-bold">{ws.name[0].toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">{ws.name}</span>
          </button>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ── Main page ────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [preview, setPreview] = useState<typeof TEMPLATES[0] | null>(null);
  const [pickingWorkspace, setPickingWorkspace] = useState<typeof TEMPLATES[0] | null>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  const filtered = TEMPLATES.filter((t) =>
    (category === "All" || t.category === category) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) ||
     t.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUseTemplate = async (template: typeof TEMPLATES[0]) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push("/auth"); return; }
    // Load workspaces
    try {
      const res = await axios.get(`${API}/workspaces`, { headers: { "x-user-id": data.user.id } });
      const ws = res.data.data || [];
      if (ws.length === 0) { toast.error("Create a workspace first"); return; }
      if (ws.length === 1) {
        await createFromTemplate(template, ws[0].id, data.user.id);
      } else {
        setWorkspaces(ws);
        setPickingWorkspace(template);
      }
    } catch { toast.error("Failed to load workspaces"); }
  };

  const createFromTemplate = async (template: typeof TEMPLATES[0], workspaceId: string, userId: string) => {
    setCreating(true);
    try {
      // 1. Create blank form
      const formRes = await axios.post(`${API}/workspaces/${workspaceId}/forms`,
        { title: template.title },
        { headers: { "x-user-id": userId } });
      const formId = formRes.data.data.id;
      // 2. Create all blocks sequentially to preserve order
      let lastId: string | null = null;
      for (const block of template.blocks) {
        const bRes = await axios.post(`${API}/forms/${formId}/blocks`,
          { ...block, afterBlockId: lastId ?? undefined },
          { headers: { "x-user-id": userId } });
        lastId = bRes.data.data.id;
      }
      // 3. Apply theme color
      await axios.patch(`${API}/forms/${formId}/theme`,
        { primaryColor: template.color },
        { headers: { "x-user-id": userId } });
      toast.success("Template applied!");
      router.push(`/forms/${formId}/editor`);
    } catch { toast.error("Failed to create form from template"); }
    finally { setCreating(false); }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-8 py-7 max-w-6xl mx-auto w-full">

            {/* Hero */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Templates</h1>
              <p className="text-sm text-gray-500">Start from a ready-made form. Edit any field after applying.</p>
            </div>

            {/* Search + filter */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input placeholder="Search templates…" className="pl-9 h-9 text-sm bg-white border-gray-200 rounded-lg"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                      category === c ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500 font-medium">No templates match your search</p>
                <p className="text-sm text-gray-400 mt-1">Try a different keyword or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((t) => (
                  <TemplateCard key={t.id} template={t}
                    onPreview={() => setPreview(t)}
                    onUse={() => handleUseTemplate(t)} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        {preview && (
          <PreviewModal template={preview} onClose={() => setPreview(null)}
            onUse={() => { setPreview(null); handleUseTemplate(preview); }} />
        )}
      </Dialog>

      {/* Workspace picker */}
      <Dialog open={!!pickingWorkspace} onOpenChange={() => setPickingWorkspace(null)}>
        {pickingWorkspace && (
          <WorkspacePickerModal
            workspaces={workspaces}
            onClose={() => setPickingWorkspace(null)}
            onPick={async (wsId) => {
              const { data } = await supabase.auth.getUser();
              if (!data.user || !pickingWorkspace) return;
              setPickingWorkspace(null);
              await createFromTemplate(pickingWorkspace, wsId, data.user.id);
            }}
          />
        )}
      </Dialog>

      {creating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Creating your form…</p>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}