"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, Lock, Star, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const LAYOUT_TYPES   = ["HEADING_1","HEADING_2","TEXT","DIVIDER","IMAGE","TITLE","LABEL"];
const NON_Q_TYPES    = [...LAYOUT_TYPES, "NEW_PAGE", "THANK_YOU_PAGE"];

type Block = { id: string; type: string; label: string; required: boolean; config: any; logic?: any; order: number; groupId?: string };
type FormSettings = {
  submitButtonLabel: string; thankYouMessage: string; redirectUrl?: string;
  primaryColor: string; hideBranding: boolean; allowMultipleSubmissions: boolean;
  requireLogin: boolean; progressBar?: boolean;
  bgColor?: string; textColor?: string; fontFamily?: string; coverUrl?: string; logoUrl?: string; borderRadius?: string;
};
type FormData = { id: string; title: string; description?: string; logoUrl?: string; coverUrl?: string; slug: string; blocks: Block[]; settings: FormSettings };

// ── Conditional logic evaluator ──────────────────────────────────
function evaluateLogic(block: Block, answers: Record<string, any>): boolean {
  if (!block.logic) return true;
  const { conditions, conditionOperator = "AND", action } = block.logic;
  if (!conditions?.length) return true;
  const results = conditions.map((c: any) => {
    const val = answers[c.sourceBlockId];
    switch (c.operator) {
      case "equals":       return String(val ?? "") === String(c.value);
      case "not_equals":   return String(val ?? "") !== String(c.value);
      case "contains":     return String(val ?? "").includes(c.value);
      case "not_contains": return !String(val ?? "").includes(c.value);
      case "greater_than": return Number(val) > Number(c.value);
      case "less_than":    return Number(val) < Number(c.value);
      case "is_empty":     return !val || val === "" || (Array.isArray(val) && val.length === 0);
      case "is_not_empty": return !(!val || val === "" || (Array.isArray(val) && val.length === 0));
      default: return true;
    }
  });
  const met = conditionOperator === "AND" ? results.every(Boolean) : results.some(Boolean);
  return action === "show" ? met : !met;
}

// ── Split blocks into pages ───────────────────────────────────────
// A NEW_PAGE block acts as a page divider. Everything before the first
// NEW_PAGE is page 0. Everything between two NEW_PAGE blocks is a page.
function splitIntoPages(blocks: Block[]): Block[][] {
  const pages: Block[][] = [];
  let current: Block[] = [];
  for (const block of blocks) {
    if (block.type === "NEW_PAGE") {
      pages.push(current);
      current = [];
    } else if (block.type !== "THANK_YOU_PAGE") {
      current.push(block);
    }
  }
  pages.push(current);
  return pages.filter(p => p.length > 0);
}

// ── Progress bar ──────────────────────────────────────────────────
function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const pct = total <= 1 ? 100 : Math.round((current / (total - 1)) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
      <div className="h-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Page indicator dots ───────────────────────────────────────────
function PageDots({ total, current, color }: { total: number; current: number; color: string }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("rounded-full transition-all duration-300",
          i === current ? "w-4 h-2" : "w-2 h-2 opacity-30"
        )} style={{ backgroundColor: color }} />
      ))}
    </div>
  );
}

// ── Input components ─────────────────────────────────────────────
function MultipleChoice({ block, value, onChange }: any) {
  return (
    <div className="space-y-2">
      {(block.config?.options || []).map((opt: string) => (
        <label key={opt} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
            value === opt ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
          <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              value === opt ? "border-[var(--primary)] bg-[var(--primary)]" : "border-gray-300")}>
            {value === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
          </div>
          <input type="radio" className="sr-only" checked={value === opt} onChange={() => onChange(opt)} />
          <span className="text-sm" style={{ color: "var(--text)" }}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function Checkboxes({ block, value, onChange }: any) {
  const vals: string[] = Array.isArray(value) ? value : [];
  const toggle = (opt: string) => onChange(vals.includes(opt) ? vals.filter(v => v !== opt) : [...vals, opt]);
  return (
    <div className="space-y-2">
      {(block.config?.options || []).map((opt: string) => (
        <label key={opt} className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
            vals.includes(opt) ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
          <div className={cn("w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
              vals.includes(opt) ? "border-[var(--primary)] bg-[var(--primary)]" : "border-gray-300")}>
            {vals.includes(opt) && <svg viewBox="0 0 12 10" className="w-2.5 h-2 fill-white"><path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>}
          </div>
          <input type="checkbox" className="sr-only" checked={vals.includes(opt)} onChange={() => toggle(opt)} />
          <span className="text-sm" style={{ color: "var(--text)" }}>{opt}</span>
        </label>
      ))}
    </div>
  );
}

function Dropdown({ block, value, onChange }: any) {
  return (
    <div className="relative">
      <select value={value || ""} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none h-11 pl-4 pr-10 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent">
        <option value="">Select an option…</option>
        {(block.config?.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function RatingInput({ block, value, onChange }: any) {
  const max = block.config?.maxRating || 5;
  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 focus:outline-none">
          <Star className={cn("w-8 h-8 transition-colors", n <= (value || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
        </button>
      ))}
    </div>
  );
}

function LinearScale({ block, value, onChange }: any) {
  const min = block.config?.min ?? 1;
  const max = block.config?.max ?? 10;
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2 px-1">
        <span>{block.config?.minLabel || min}</span>
        <span>{block.config?.maxLabel || max}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {steps.map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={cn("w-10 h-10 rounded-xl text-sm font-semibold border-2 transition-all",
              n === value ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-gray-200 hover:border-gray-300 text-gray-700")}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function LayoutBlock({ block }: { block: Block }) {
  const color = "var(--text)";
  switch (block.type) {
    case "HEADING_1": return <h2 className="text-2xl font-bold mb-4 mt-6 first:mt-0" style={{ color }}>{block.label}</h2>;
    case "HEADING_2": return <h3 className="text-lg font-semibold mb-3 mt-5 first:mt-0" style={{ color }}>{block.label}</h3>;
    case "TEXT":      return <p className="text-sm leading-relaxed mb-4 opacity-70" style={{ color }}>{block.label}</p>;
    case "DIVIDER":   return <hr className="my-6 border-gray-200" />;
    case "IMAGE":     return block.config?.url ? <img src={block.config.url} alt={block.label || ""} className="w-full rounded-xl mb-4 object-cover max-h-64" /> : null;
    default:          return null;
  }
}

function QuestionBlock({ block, value, onChange, error }: any) {
  const inputClass = "w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all";
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
        {block.label}
        {block.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {block.type === "SHORT_ANSWER"  && <Input className={inputClass} placeholder={block.config?.placeholder || ""} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "LONG_ANSWER"   && <Textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-none min-h-[100px]" placeholder={block.config?.placeholder || ""} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "EMAIL"         && <Input type="email" className={inputClass} placeholder={block.config?.placeholder || "you@example.com"} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "PHONE_NUMBER"  && <Input type="tel" className={inputClass} placeholder={block.config?.placeholder || "+1 (555) 000-0000"} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "NUMBER"        && <Input type="number" className={inputClass} placeholder={block.config?.placeholder || "0"} value={value ?? ""} onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))} />}
      {block.type === "LINK"          && <Input type="url" className={inputClass} placeholder={block.config?.placeholder || "https://"} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "DATE"          && <Input type="date" className={inputClass} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "TIME"          && <Input type="time" className={inputClass} value={value || ""} onChange={e => onChange(e.target.value)} />}
      {block.type === "MULTIPLE_CHOICE" && <MultipleChoice block={block} value={value} onChange={onChange} />}
      {block.type === "CHECKBOXES"    && <Checkboxes block={block} value={value} onChange={onChange} />}
      {block.type === "DROPDOWN"      && <Dropdown block={block} value={value} onChange={onChange} />}
      {block.type === "RATING"        && <RatingInput block={block} value={value} onChange={onChange} />}
      {block.type === "LINEAR_SCALE"  && <LinearScale block={block} value={value} onChange={onChange} />}
      {block.type === "FILE_UPLOAD"   && <Input type="file" className={inputClass} onChange={e => onChange(e.target.files?.[0]?.name || "")} />}
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

// ── Main renderer ────────────────────────────────────────────────
export default function FormRenderer() {
  const params = useParams();
  const slug = params?.slug as string;

  const [form, setForm]         = useState<FormData | null>(null);
  const [loadState, setLoadState] = useState<"loading"|"loaded"|"error"|"closed"|"password"|"submitted">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [answers, setAnswers]   = useState<Record<string, any>>({});
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Multi-page state ──────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDirection, setPageDirection] = useState<"forward"|"back">("forward");

  const fetchForm = async (pw?: string) => {
    try {
      const url = `${API}/forms/slug/${slug}${pw ? `?password=${encodeURIComponent(pw)}` : ""}`;
      const res = await axios.get(url);
      setForm(res.data.data);
      setLoadState("loaded");
    } catch (e: any) {
      const code = e.response?.data?.code;
      if (code === "FORM_CLOSED" || code === "RESPONSE_LIMIT_REACHED") {
        setErrorMsg(e.response.data.message); setLoadState("closed");
      } else if (code === "PASSWORD_REQUIRED" || code === "WRONG_PASSWORD") {
        setLoadState("password");
        if (code === "WRONG_PASSWORD") setErrorMsg("Incorrect password, try again.");
      } else { setErrorMsg(e.response?.data?.message || "Form not found"); setLoadState("error"); }
    }
  };

  useEffect(() => { fetchForm(); }, [slug]);

  // ── Split blocks into pages ───────────────────────────────────
  const allPages = useMemo(() => {
    if (!form) return [[]];
    return splitIntoPages(form.blocks);
  }, [form]);

  const isMultiPage  = allPages.length > 1;
  const totalPages   = allPages.length;
  const pageBlocks   = allPages[currentPage] || [];

  // Filter by conditional logic
  const visiblePageBlocks = pageBlocks.filter(b => evaluateLogic(b, answers));

  // All visible question blocks on this page
  const pageQuestions = visiblePageBlocks.filter(b => !NON_Q_TYPES.includes(b.type));

  // All visible questions across all pages (for global progress)
  const allVisibleQuestions = useMemo(() =>
    allPages.flatMap(p => p.filter(b => !NON_Q_TYPES.includes(b.type) && evaluateLogic(b, answers))),
    [allPages, answers]
  );
  const answeredCount = allVisibleQuestions.filter(b => {
    const v = answers[b.id];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  // ── Validate current page ─────────────────────────────────────
  function validatePage(): boolean {
    const newErrors: Record<string, string> = {};
    pageQuestions.forEach(b => {
      if (!b.required) return;
      const val = answers[b.id];
      const empty = val === undefined || val === "" || (Array.isArray(val) && val.length === 0);
      if (empty) newErrors[b.id] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Navigation ────────────────────────────────────────────────
  function goNext() {
    if (!validatePage()) return;
    setPageDirection("forward");
    setCurrentPage(p => Math.min(p + 1, totalPages - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setPageDirection("back");
    setCurrentPage(p => Math.max(p - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form) return;
    if (!validatePage()) return;

    setSubmitting(true);
    try {
      const allQuestions = allPages.flatMap(p =>
        p.filter(b => !NON_Q_TYPES.includes(b.type) && evaluateLogic(b, answers))
      );
      const answersPayload = allQuestions
        .filter(b => answers[b.id] !== undefined && answers[b.id] !== "")
        .map(b => ({ blockId: b.id, value: answers[b.id] }));

      await axios.post(`${API}/forms/${form.slug}/submit`, { answers: answersPayload });

      if (form.settings.redirectUrl) {
        window.location.href = form.settings.redirectUrl;
      } else {
        setLoadState("submitted");
      }
    } catch (e: any) {
      const code = e.response?.data?.code;
      if (code === "ALREADY_SUBMITTED") setErrorMsg("You have already submitted this form.");
      else if (code === "MISSING_REQUIRED_FIELDS") setErrorMsg("Please fill in all required fields.");
      else setErrorMsg("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  // ── Theme vars ────────────────────────────────────────────────
  const settings  = form?.settings || {} as FormSettings;
  const color     = settings.primaryColor || "#2563eb";
  const bgColor   = settings.bgColor      || "#ffffff";
  const textColor = settings.textColor    || "#111827";
  const fontFamily = settings.fontFamily  || "Inter";
  const radius    = settings.borderRadius || "md";
  const radiusPx  = radius==="none"?"0":radius==="sm"?"4px":radius==="xl"?"24px":"12px";

  useEffect(() => {
    if (!fontFamily || fontFamily === "Inter") return;
    const id = `gf-${fontFamily.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  const cssVars = {
    "--primary":       color,
    "--primary-light": `${color}18`,
    "--bg":            bgColor,
    "--text":          textColor,
    "--font":          fontFamily,
    "--radius":        radiusPx,
    fontFamily,
  } as React.CSSProperties;

  // ── Load states ───────────────────────────────────────────────
  if (loadState === "loading") return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  if (loadState === "error") return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Form not found</h2>
        <p className="text-sm text-gray-500">{errorMsg}</p>
      </div>
    </div>
  );

  if (loadState === "closed") return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-orange-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Form closed</h2>
        <p className="text-sm text-gray-500">{errorMsg}</p>
      </div>
    </div>
  );

  if (loadState === "password") return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={cssVars}>
      <div className="w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-5 h-5 text-gray-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Password required</h2>
        <p className="text-sm text-gray-500 text-center mb-5">This form is password protected.</p>
        {errorMsg && <p className="text-xs text-red-500 text-center mb-3">{errorMsg}</p>}
        <Input type="password" placeholder="Enter password" className="mb-3 h-11 rounded-xl" value={password}
          onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchForm(password)} />
        <Button className="w-full h-11 rounded-xl text-white" style={{ backgroundColor: color }} onClick={() => fetchForm(password)}>
          Continue
        </Button>
      </div>
    </div>
  );

  if (loadState === "submitted") return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6" style={cssVars}>
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: `${color}18` }}>
          <CheckCircle2 className="w-8 h-8" style={{ color }} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {form?.settings.thankYouMessage || "Thank you!"}
        </h2>
        <p className="text-sm text-gray-500">Your response has been recorded.</p>
      </div>
    </div>
  );

  if (!form) return null;

  const showProgress = form.settings.progressBar !== false;
  const isLastPage   = currentPage === totalPages - 1;
  const isFirstPage  = currentPage === 0;

  return (
    <div className="min-h-screen" style={{ ...cssVars, backgroundColor: bgColor, color: textColor }}>

      {/* Progress bar — shows per-page progress for multi-page, answered/total for single */}
      {showProgress && (
        isMultiPage
          ? <ProgressBar current={currentPage} total={totalPages} color={color} />
          : allVisibleQuestions.length > 0
            ? <ProgressBar current={answeredCount} total={allVisibleQuestions.length} color={color} />
            : null
      )}

      {/* Cover image — only on first page */}
      {isFirstPage && (form.settings?.coverUrl || settings.coverUrl) && (
        <div className="h-44 bg-gray-100">
          <img src={form.settings?.coverUrl || settings.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-16">

        {/* Logo — only on first page */}
        {isFirstPage && (form.settings?.logoUrl || settings.logoUrl) && (
          <img src={form.settings?.logoUrl || settings.logoUrl} alt="Logo" className="h-10 mb-6 object-contain" />
        )}

        {/* Title + description — only on first page */}
        {isFirstPage && (
          <>
            <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>{form.title}</h1>
            {form.description
              ? <p className="mb-8 leading-relaxed text-sm" style={{ color: textColor, opacity: 0.7 }}>{form.description}</p>
              : <div className="mb-8" />}
          </>
        )}

        {/* Multi-page indicator */}
        {isMultiPage && (
          <div className="mb-6">
            <PageDots total={totalPages} current={currentPage} color={color} />
            <p className="text-center text-xs text-gray-400">
              Page {currentPage + 1} of {totalPages}
            </p>
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
          </div>
        )}

        {/* Blocks for current page */}
        {visiblePageBlocks.map(block =>
          LAYOUT_TYPES.includes(block.type) ? (
            <LayoutBlock key={block.id} block={block} />
          ) : (
            <QuestionBlock key={block.id} block={block}
              value={answers[block.id]}
              onChange={(v: any) => {
                setAnswers(p => ({ ...p, [block.id]: v }));
                if (errors[block.id]) setErrors(p => { const n = { ...p }; delete n[block.id]; return n; });
              }}
              error={errors[block.id]}
            />
          )
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center gap-3">
          {/* Back button */}
          {isMultiPage && !isFirstPage && (
            <button onClick={goBack}
              className="flex items-center gap-1.5 h-11 px-5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          {/* Next or Submit */}
          {isMultiPage && !isLastPage ? (
            <Button className="h-11 px-8 text-sm font-medium rounded-xl text-white transition-all flex items-center gap-1.5"
              style={{ backgroundColor: color }} onClick={goNext}>
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="h-11 px-8 text-sm font-medium rounded-xl text-white transition-all"
              style={{ backgroundColor: color }} onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (form.settings.submitButtonLabel || "Submit")}
            </Button>
          )}
        </div>

        {/* Branding */}
        {!form.settings.hideBranding && (
          <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-center">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5">
              Powered by <span className="font-semibold text-gray-600">Intake</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}