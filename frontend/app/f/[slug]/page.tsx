"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle, Lock, Star, ChevronDown } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const LAYOUT_TYPES = ["HEADING_1", "HEADING_2", "TEXT", "DIVIDER", "IMAGE", "TITLE", "LABEL"];

type Block = { id: string; type: string; label: string; required: boolean; config: any; logic?: any; order: number };
type FormSettings = {
  submitButtonLabel: string; thankYouMessage: string; redirectUrl?: string;
  primaryColor: string; hideBranding: boolean; allowMultipleSubmissions: boolean;
  requireLogin: boolean; progressBar?: boolean; theme?: string;
};
type FormData = {
  id: string; title: string; description?: string; logoUrl?: string; coverUrl?: string;
  slug: string; blocks: Block[]; settings: FormSettings;
};

// ── Conditional logic evaluator ──────────────────────────────────
const evaluateLogic = (block: Block, answers: Record<string, any>): boolean => {
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
};

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
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function Checkboxes({ block, value, onChange }: any) {
  const selected: string[] = Array.isArray(value) ? value : [];
  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {(block.config?.options || []).map((opt: string) => (
        <label key={opt} onClick={() => toggle(opt)}
          className={cn("flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
            selected.includes(opt) ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
          <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
              selected.includes(opt) ? "border-[var(--primary)] bg-[var(--primary)]" : "border-gray-300")}>
            {selected.includes(opt) && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-700">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function Dropdown({ block, value, onChange }: any) {
  return (
    <div className="relative">
      <select className={cn("w-full h-11 px-3 pr-9 text-sm bg-white border border-gray-200 rounded-xl outline-none appearance-none transition-colors focus:border-[var(--primary)]",
          !value && "text-gray-400")}
        value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select an option</option>
        {(block.config?.options || []).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function RatingInput({ block, value, onChange }: any) {
  const max = block.config?.maxRating || 5;
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: max }).map((_, i) => {
        const v = i + 1;
        const active = hovered !== null ? v <= hovered : v <= (value || 0);
        return (
          <button key={v} type="button" onMouseEnter={() => setHovered(v)} onMouseLeave={() => setHovered(null)} onClick={() => onChange(v)}>
            <Star className={cn("w-8 h-8 transition-all", active ? "text-yellow-400 fill-yellow-400" : "text-gray-200 hover:text-yellow-300")} />
          </button>
        );
      })}
    </div>
  );
}

function LinearScale({ block, value, onChange }: any) {
  const min = block.config?.min || 1;
  const max = block.config?.max || 10;
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={cn("min-w-[2.5rem] h-10 rounded-xl border text-sm font-medium transition-all",
              value === n ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-gray-200 bg-white text-gray-600 hover:border-[var(--primary)] hover:bg-[var(--primary-light)]")}>
            {n}
          </button>
        ))}
      </div>
      {(block.config?.minLabel || block.config?.maxLabel) && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-400">{block.config?.minLabel}</span>
          <span className="text-xs text-gray-400">{block.config?.maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function QuestionBlock({ block, value, onChange, error }: { block: Block; value: any; onChange: (v: any) => void; error?: string }) {
  const renderInput = () => {
    switch (block.type) {
      case "SHORT_ANSWER":   return <Input className={cn("h-11 text-sm rounded-xl", error && "border-red-400")} placeholder="Your answer" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "LONG_ANSWER":    return <Textarea className={cn("text-sm resize-none rounded-xl", error && "border-red-400")} rows={4} placeholder="Your answer" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "MULTIPLE_CHOICE": return <MultipleChoice block={block} value={value} onChange={onChange} error={error} />;
      case "CHECKBOXES":     return <Checkboxes block={block} value={value} onChange={onChange} error={error} />;
      case "DROPDOWN":       return <Dropdown block={block} value={value} onChange={onChange} error={error} />;
      case "RATING":         return <RatingInput block={block} value={value} onChange={onChange} />;
      case "LINEAR_SCALE":   return <LinearScale block={block} value={value} onChange={onChange} />;
      case "NUMBER":  return <Input type="number" className={cn("h-11 text-sm rounded-xl max-w-xs", error && "border-red-400")} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="0" />;
      case "EMAIL":   return <Input type="email"  className={cn("h-11 text-sm rounded-xl", error && "border-red-400")} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="you@example.com" />;
      case "PHONE_NUMBER": return <Input type="tel" className={cn("h-11 text-sm rounded-xl", error && "border-red-400")} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="+1 (555) 000-0000" />;
      case "LINK":    return <Input type="url"   className={cn("h-11 text-sm rounded-xl", error && "border-red-400")} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="https://" />;
      case "DATE":    return <Input type="date"  className={cn("h-11 text-sm rounded-xl", error && "border-red-400")} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      case "TIME":    return <Input type="time"  className={cn("h-11 text-sm rounded-xl", error && "border-red-400")} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
      default: return null;
    }
  };
  return (
    <div className="mb-8">
      <div className="flex items-start gap-1.5 mb-3">
        <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text, #111827)" }}>{block.label || "Question"}</p>
        {block.required && <span className="text-red-500 text-sm">*</span>}
      </div>
      {renderInput()}
      {error && (
        <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
      )}
    </div>
  );
}

function LayoutBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "HEADING_1": return <h2 className="text-2xl font-bold mb-4 mt-2" style={{ color: "var(--text, #111827)" }}>{block.label}</h2>;
    case "HEADING_2": return <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-1">{block.label}</h3>;
    case "TEXT":      return <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text, #111827)", opacity: 0.75 }}>{block.label}</p>;
    case "DIVIDER":   return <hr className="border-gray-200 mb-6 mt-2" />;
    default: return null;
  }
}

// ── Progress bar ─────────────────────────────────────────────────
function ProgressBar({ answered, total, color }: { answered: number; total: number; color: string }) {
  if (total === 0) return null;
  const pct = Math.round((answered / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-100">
      <div className="h-full transition-all duration-500 ease-out rounded-r-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// ── Main renderer ────────────────────────────────────────────────
export default function FormRenderer() {
  const params = useParams();
  const slug = params?.slug as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loadState, setLoadState] = useState<"loading"|"loaded"|"error"|"closed"|"password"|"submitted">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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

  const visibleBlocks    = form?.blocks.filter((b) => evaluateLogic(b, answers)) || [];
  const questionBlocks   = visibleBlocks.filter((b) => !LAYOUT_TYPES.includes(b.type));
  const requiredBlocks   = questionBlocks.filter((b) => b.required);
  const answeredRequired = requiredBlocks.filter((b) => {
    const v = answers[b.id];
    return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  });

  const handleSubmit = async () => {
    if (!form) return;
    const newErrors: Record<string, string> = {};

    // Only validate VISIBLE required blocks
    questionBlocks.forEach((b) => {
      if (!b.required) return;
      const val = answers[b.id];
      const isEmpty = val === undefined || val === "" || (Array.isArray(val) && val.length === 0);
      if (isEmpty) newErrors[b.id] = "This field is required";
    });

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setSubmitting(true);

    try {
      // Send only visible question blocks' answers — skip layout and hidden blocks
      const answersPayload = questionBlocks
        .filter((b) => answers[b.id] !== undefined && answers[b.id] !== "")
        .map((b) => ({ blockId: b.id, value: answers[b.id] }));

      await axios.post(`${API}/forms/${form.slug}/submit`, { answers: answersPayload });

      if (form.settings.redirectUrl) {
        window.location.href = form.settings.redirectUrl;
      } else {
        setLoadState("submitted");
      }
    } catch (e: any) {
      const code = e.response?.data?.code;
      if (code === "ALREADY_SUBMITTED") {
        setErrorMsg("You have already submitted this form.");
      } else if (code === "MISSING_REQUIRED_FIELDS") {
        setErrorMsg("Please fill in all required fields.");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
      }
    }
    setSubmitting(false);
  };

  const settings = form?.settings || {};
  const color     = settings.primaryColor || "#2563eb";
  const bgColor   = settings.bgColor      || "#ffffff";
  const textColor = settings.textColor    || "#111827";
  const fontFamily = settings.fontFamily  || "Inter";
  const radius    = settings.borderRadius || "md";
  const radiusPx  = radius==="none"?"0":radius==="sm"?"4px":radius==="xl"?"24px":"12px";

  // Load Google Font when fontFamily changes
  useEffect(() => {
    if (!fontFamily || fontFamily === "Inter") return;
    const id = `gf-${fontFamily.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  // CSS variables injected inline for full theming
  const cssVars = {
    "--primary":      color,
    "--primary-light":`${color}18`,
    "--bg":           bgColor,
    "--text":         textColor,
    "--font":         fontFamily,
    "--radius":       radiusPx,
    fontFamily,
  } as React.CSSProperties;

  // ── States ───────────────────────────────────────────────────────
  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (loadState === "error") {
    return (
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
  }

  if (loadState === "closed") {
    return (
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
  }

  if (loadState === "password") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" style={cssVars}>
        <div className="w-full max-w-sm">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-5 h-5 text-gray-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">Password required</h2>
          <p className="text-sm text-gray-500 text-center mb-5">This form is password protected.</p>
          {errorMsg && <p className="text-xs text-red-500 text-center mb-3">{errorMsg}</p>}
          <Input type="password" placeholder="Enter password" className="mb-3 h-11 rounded-xl" value={password}
            onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchForm(password)} />
          <Button className="w-full h-11 rounded-xl text-white" style={{ backgroundColor: color }} onClick={() => fetchForm(password)}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  if (loadState === "submitted") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" style={cssVars}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: `${color}18` }}>
            <CheckCircle2 className="w-8 h-8" style={{ color }} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {form?.settings.thankYouMessage || "Thank you!"}
          </h2>
          <p className="text-sm text-gray-500">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const showProgress = form.settings.progressBar !== false;

  return (
    <div className="min-h-screen" style={{...cssVars, backgroundColor: bgColor, color: textColor}}>
      {/* Progress bar */}
      {showProgress && requiredBlocks.length > 0 && (
        <ProgressBar answered={answeredRequired.length} total={requiredBlocks.length} color={color} />
      )}

      {/* Cover */}
      {(form.settings?.coverUrl || settings.coverUrl) && (
        <div className="h-44 bg-gray-100">
          <img src={form.settings?.coverUrl || settings.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 pt-12 pb-16">
        {/* Logo */}
        {(form.settings?.logoUrl || settings.logoUrl) && <img src={form.settings?.logoUrl || settings.logoUrl} alt="Logo" className="h-10 mb-6 object-contain" />}

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>{form.title}</h1>
        {form.description && <p className="mb-8 leading-relaxed text-sm" style={{ color: textColor, opacity: 0.7 }}>{form.description}</p>}
        {!form.description && <div className="mb-8" />}

        {/* Error banner */}
        {errorMsg && (
          <div className="mb-6 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />{errorMsg}
          </div>
        )}

        {/* Blocks */}
        {visibleBlocks.map((block) =>
          LAYOUT_TYPES.includes(block.type) ? (
            <LayoutBlock key={block.id} block={block} />
          ) : (
            <QuestionBlock key={block.id} block={block}
              value={answers[block.id]}
              onChange={(v) => {
                setAnswers((p) => ({ ...p, [block.id]: v }));
                if (errors[block.id]) setErrors((p) => { const n = { ...p }; delete n[block.id]; return n; });
              }}
              error={errors[block.id]}
            />
          )
        )}

        {/* Submit */}
        <div className="mt-6">
          <Button className="h-11 px-8 text-sm font-medium rounded-xl text-white transition-all"
            style={{ backgroundColor: color }} onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </span>
            ) : (form.settings.submitButtonLabel || "Submit")}
          </Button>
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