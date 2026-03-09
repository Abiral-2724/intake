"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LoadingPage from "@/components/LoadingPage";
import AIBlockSuggestions from "@/components/AIBlockSuggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft, Plus, Eye, MoreHorizontal, Trash2, Copy, GripVertical,
  ChevronDown, CheckCircle2, Type, List, CheckSquare, Hash, Mail, Phone,
  Link, Upload, Calendar, Clock, Star, AlignLeft, Minus, Image, Globe,
  SlidersHorizontal, BarChart2, Search, GitBranch, Sparkles, Wand2, Languages, Brain,
  Share2, Check, ExternalLink, Palette,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─────────────────────────────────────────────
//  BLOCK CATALOGUE
// ─────────────────────────────────────────────
const BLOCK_GROUPS = [
  { label: "Layout", blocks: [
    { type: "HEADING_1",   icon: Type,              label: "Heading 1",     desc: "Large section heading" },
    { type: "HEADING_2",   icon: Type,              label: "Heading 2",     desc: "Medium section heading" },
    { type: "TEXT",        icon: AlignLeft,         label: "Text",          desc: "Plain paragraph text" },
    { type: "DIVIDER",     icon: Minus,             label: "Divider",       desc: "Horizontal separator" },
    { type: "IMAGE",       icon: Image,             label: "Image",         desc: "Embed an image" },
  ]},
  { label: "Questions", blocks: [
    { type: "SHORT_ANSWER",    icon: Type,              label: "Short answer",    desc: "Single line text" },
    { type: "LONG_ANSWER",     icon: AlignLeft,         label: "Long answer",     desc: "Multi-line textarea" },
    { type: "MULTIPLE_CHOICE", icon: List,              label: "Multiple choice", desc: "Pick one option" },
    { type: "CHECKBOXES",      icon: CheckSquare,       label: "Checkboxes",      desc: "Pick multiple options" },
    { type: "DROPDOWN",        icon: ChevronDown,       label: "Dropdown",        desc: "Select from a list" },
    { type: "NUMBER",          icon: Hash,              label: "Number",          desc: "Numeric input" },
    { type: "EMAIL",           icon: Mail,              label: "Email",           desc: "Email address" },
    { type: "PHONE_NUMBER",    icon: Phone,             label: "Phone",           desc: "Phone number" },
    { type: "LINK",            icon: Link,              label: "Link / URL",      desc: "Website URL" },
    { type: "FILE_UPLOAD",     icon: Upload,            label: "File upload",     desc: "Upload files" },
    { type: "DATE",            icon: Calendar,          label: "Date",            desc: "Date picker" },
    { type: "TIME",            icon: Clock,             label: "Time",            desc: "Time picker" },
    { type: "RATING",          icon: Star,              label: "Rating",          desc: "Star rating" },
    { type: "LINEAR_SCALE",    icon: SlidersHorizontal, label: "Linear scale",    desc: "Numeric scale" },
  ]},
];
const ALL_BLOCKS = BLOCK_GROUPS.flatMap((g) => g.blocks);
const LAYOUT_TYPES = ["HEADING_1","HEADING_2","TEXT","DIVIDER","IMAGE"];
const ICON_MAP: Record<string,any> = Object.fromEntries(ALL_BLOCKS.map((b) => [b.type, b.icon]));

type Block = { id: string; type: string; label: string; required: boolean; config: any; logic?: any; order: number };
type Form  = { id: string; title: string; description?: string; slug: string; status: "DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED"; blocks: Block[]; settings?: any };

// ─────────────────────────────────────────────
//  BLOCK PICKER  (manual blocks)
// ─────────────────────────────────────────────
function BlockPicker({ onSelect, onClose, showAI, onOpenAI }: {
  onSelect: (type: string) => void; onClose: () => void;
  showAI?: boolean; onOpenAI?: () => void;
}) {
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  const groups = query.trim()
    ? [{ label: "Results", blocks: ALL_BLOCKS.filter((b) =>
        b.label.toLowerCase().includes(query.toLowerCase()) ||
        b.desc.toLowerCase().includes(query.toLowerCase())) }]
    : BLOCK_GROUPS;

  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl shadow-gray-200/60 overflow-hidden">
      {/* AI generate button at top */}
      {showAI && onOpenAI && (
        <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-violet-50 to-blue-50 hover:from-violet-100 hover:to-blue-100 transition-colors border-b border-gray-100 text-left"
          onMouseDown={(e) => { e.preventDefault(); onClose(); onOpenAI(); }}>
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-blue-500 rounded-md flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-700">Generate with AI</p>
            <p className="text-xs text-violet-500">Describe the fields you want</p>
          </div>
        </button>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        <input ref={ref} className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
          placeholder="Search blocks…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pt-2 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.label}</p>
            {group.blocks.length === 0 && <p className="px-3 py-2 text-sm text-gray-400">No results</p>}
            {group.blocks.map((b) => {
              const Icon = b.icon;
              return (
                <button key={b.type} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                  onMouseDown={(e) => { e.preventDefault(); onSelect(b.type); }}>
                  <div className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 leading-snug">{b.label}</p>
                    <p className="text-xs text-gray-400">{b.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  AI INLINE PROMPT PANEL
// ─────────────────────────────────────────────
function AIPromptPanel({ onGenerate, onClose, loading }: {
  onGenerate: (prompt: string) => void; onClose: () => void; loading: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const examples = [
    "Name, email, phone number, and a message field",
    "NPS survey with a 1–10 rating and a comments box",
    "Job application: position, experience, resume upload, availability",
    "Customer feedback: satisfaction rating, what went well, improvements",
  ];

  return (
    <div className="absolute z-50 top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl shadow-gray-200/60 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-blue-50">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <span className="text-sm font-semibold text-violet-700">AI block generator</span>
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 text-xs">✕</button>
      </div>
      <div className="p-3">
        <Textarea
          ref={ref}
          className="text-sm resize-none border-gray-200 focus:border-violet-400 focus-visible:ring-violet-200 rounded-lg"
          rows={3}
          placeholder="Describe the fields you want…&#10;e.g. 'Name, email, dropdown for department, and a message box'"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onGenerate(prompt); }}
        />
        <div className="mt-2 mb-3">
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1.5">Examples</p>
          <div className="space-y-1">
            {examples.map((ex) => (
              <button key={ex} className="w-full text-left text-xs text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded px-2 py-1 transition-colors"
                onClick={() => setPrompt(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white text-sm h-9 gap-2"
          onClick={() => onGenerate(prompt)} disabled={!prompt.trim() || loading}>
          {loading ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
          ) : (
            <><Wand2 className="w-3.5 h-3.5" />Generate blocks</>
          )}
        </Button>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">⌘ Enter to generate</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  SHARE MODAL
// ─────────────────────────────────────────────
function ShareModal({ form, onClose }: { form: Form; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const formUrl = `${APP_URL}/f/${form.slug}`;

  const copy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Share form
        </DialogTitle>
        <DialogDescription>Anyone with this link can fill out your form.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        {form.status !== "PUBLISHED" && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-amber-600 text-sm">⚠️ Your form is not published yet. Publish it so people can submit responses.</span>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Form link</label>
          <div className="flex items-center gap-2">
            <Input readOnly value={formUrl} className="text-sm bg-gray-50 h-9 text-gray-700 font-mono text-xs" />
            <Button variant="outline" size="sm" className="h-9 px-3 shrink-0 gap-1.5" onClick={copy}>
              {copied ? <><Check className="w-3.5 h-3.5 text-green-500" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </Button>
            <Button variant="outline" size="sm" className="h-9 px-3 shrink-0" onClick={() => window.open(formUrl, "_blank")}>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

// ─────────────────────────────────────────────
//  BLOCK ROW
// ─────────────────────────────────────────────
function BlockRow({ block, isSelected, onSelect, onUpdate, onDelete, onDuplicate, onAddAfter }: {
  block: Block; isSelected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, data: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAddAfter: (id: string, type: string) => void;
}) {
  const Icon = ICON_MAP[block.type] || Type;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [aiOpen, setAIOpen] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isLayout = LAYOUT_TYPES.includes(block.type);
  const opts: string[] = block.config?.options?.length ? block.config.options : ["Option 1", "Option 2"];
  const isCheck = block.type === "CHECKBOXES";

  useEffect(() => {
    if (!pickerOpen && !aiOpen) return;
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false); setAIOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [pickerOpen, aiOpen]);

  const body = () => {
    switch (block.type) {
      case "HEADING_1": return <input className="w-full text-[26px] font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-300 leading-tight"
        placeholder="Heading 1" value={block.label} onChange={(e) => onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />;
      case "HEADING_2": return <input className="w-full text-xl font-semibold text-gray-800 bg-transparent border-none outline-none placeholder-gray-300"
        placeholder="Heading 2" value={block.label} onChange={(e) => onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />;
      case "TEXT": return <textarea className="w-full text-sm text-gray-600 bg-transparent border-none outline-none placeholder-gray-300 resize-none leading-relaxed"
        placeholder="Write something…" rows={2} value={block.label} onChange={(e)=>onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />;
      case "DIVIDER": return <div className="py-2"><hr className="border-gray-200" /></div>;
      case "MULTIPLE_CHOICE": case "CHECKBOXES": case "DROPDOWN":
        return (
          <div>
            <input className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 mb-3"
              placeholder="Your question" value={block.label} onChange={(e)=>onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />
            <div className="space-y-2">
              {opts.map((opt,i)=>(
                <div key={i} className="flex items-center gap-2.5">
                  <div className={cn("w-4 h-4 border border-gray-300 shrink-0",isCheck?"rounded":"rounded-full")} />
                  <input className="flex-1 text-sm text-gray-600 bg-transparent border-none outline-none" value={opt}
                    onChange={(e)=>{const n=[...opts];n[i]=e.target.value;onUpdate(block.id,{config:{...block.config,options:n}});}}
                    onClick={(e)=>e.stopPropagation()} />
                  <button className="text-gray-300 hover:text-red-400 transition-colors"
                    onClick={(e)=>{e.stopPropagation();const n=opts.filter((_,j)=>j!==i);onUpdate(block.id,{config:{...block.config,options:n}});}}>
                    <Minus className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 mt-1"
                onClick={(e)=>{e.stopPropagation();onUpdate(block.id,{config:{...block.config,options:[...opts,`Option ${opts.length+1}`]}});}}>
                <Plus className="w-3 h-3" />Add option</button>
            </div>
          </div>
        );
      case "RATING": {
        const max=block.config?.maxRating||5;
        return (<div>
          <input className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 mb-3"
            placeholder="Your question" value={block.label} onChange={(e)=>onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />
          <div className="flex gap-1.5">{Array.from({length:max}).map((_,i)=><Star key={i} className="w-6 h-6 text-gray-200" />)}</div>
        </div>);
      }
      case "LINEAR_SCALE": {
        const min=block.config?.min||1,maxV=block.config?.max||10;
        return (<div>
          <input className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 mb-3"
            placeholder="Your question" value={block.label} onChange={(e)=>onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 min-w-[48px]">{block.config?.minLabel||"Low"}</span>
            <div className="flex gap-1">{Array.from({length:maxV-min+1}).map((_,i)=>(
              <div key={i} className="w-8 h-8 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">{min+i}</div>
            ))}</div>
            <span className="text-xs text-gray-400 min-w-[48px] text-right">{block.config?.maxLabel||"High"}</span>
          </div>
        </div>);
      }
      default: {
        const def=ALL_BLOCKS.find((b)=>b.type===block.type);
        return (<div>
          <input className="w-full text-sm font-medium text-gray-900 bg-transparent border-none outline-none placeholder-gray-400 mb-2.5"
            placeholder="Your question" value={block.label} onChange={(e)=>onUpdate(block.id,{label:e.target.value})} onClick={(e)=>e.stopPropagation()} />
          <div className="h-9 rounded-lg border border-dashed border-gray-200 bg-gray-50/60 flex items-center px-3 gap-2">
            <Icon className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-xs text-gray-400">{def?.desc||block.type.replace(/_/g," ").toLowerCase()}</span>
          </div>
        </div>);
      }
    }
  };

  return (
    <div className={cn("group/block relative flex items-start gap-1.5 rounded-xl py-3 px-3 transition-all duration-100 cursor-pointer",
        isSelected?"bg-gray-50 ring-1 ring-gray-200":"hover:bg-gray-50/70")}
      onClick={onSelect}>
      {/* Gutter */}
      <div className="flex flex-col items-center gap-0.5 w-6 shrink-0 pt-0.5">
        <div className="opacity-0 group-hover/block:opacity-100 cursor-grab transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-300" />
        </div>
        <div className="relative" ref={pickerRef}>
          <button className="opacity-0 group-hover/block:opacity-100 w-5 h-5 bg-gray-100 hover:bg-blue-100 rounded flex items-center justify-center transition-all"
            onClick={(e)=>{e.stopPropagation();setPickerOpen((v)=>!v);setAIOpen(false);}}>
            <Plus className="w-3 h-3 text-gray-500 hover:text-blue-600" />
          </button>
          {pickerOpen && !aiOpen && (
            <BlockPicker
              onSelect={(type)=>{setPickerOpen(false);onAddAfter(block.id,type);}}
              onClose={()=>setPickerOpen(false)}
              showAI
              onOpenAI={()=>{setPickerOpen(false);setAIOpen(true);}}
            />
          )}
          {aiOpen && (
            <AIPromptPanel
              loading={aiLoading}
              onClose={()=>setAIOpen(false)}
              onGenerate={async(prompt)=>{
                setAILoading(true);
                // Dispatch to parent via a special update signal
                onUpdate(block.id,{config:{...block.config,__aiPrompt:prompt,__aiAfter:block.id}});
                setAILoading(false);
                setAIOpen(false);
              }}
            />
          )}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">{body()}</div>
      {/* Actions */}
      {isSelected && (
        <div className="flex items-center gap-1.5 shrink-0 ml-1 mt-0.5" onClick={(e)=>e.stopPropagation()}>
          {!isLayout && (
            <button onClick={()=>onUpdate(block.id,{required:!block.required})}
              className={cn("px-2 py-1 rounded-md text-xs font-medium transition-colors",
                block.required?"bg-blue-100 text-blue-700":"bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200")}>
              {block.required?"Required":"Optional"}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400"><MoreHorizontal className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={()=>onDuplicate(block.id)}><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={()=>onDelete(block.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  SETTINGS TAB
// ─────────────────────────────────────────────
function SettingsTab({ formId, userId, initialSettings }: { formId: string; userId: string; initialSettings: any }) {
  const [s, setS] = useState({
    allowMultipleSubmissions: initialSettings?.allowMultipleSubmissions??true,
    requireLogin:             initialSettings?.requireLogin??false,
    submitButtonLabel:        initialSettings?.submitButtonLabel??"Submit",
    thankYouMessage:          initialSettings?.thankYouMessage??"Thank you for your response!",
    redirectUrl:              initialSettings?.redirectUrl??"",
    notifyOwnerEmail:         initialSettings?.notifyOwnerEmail??false,
    maxResponses:             initialSettings?.maxResponses??"",
    closedAt:                 initialSettings?.closedAt?new Date(initialSettings.closedAt).toISOString().slice(0,16):"",
    hideBranding:             initialSettings?.hideBranding??false,
    primaryColor:             initialSettings?.primaryColor??"#2563eb",
    progressBar:              initialSettings?.progressBar??true,
  });
  const [saving, setSaving] = useState(false);
  const upd = (k: string, v: any) => setS((p)=>({...p,[k]:v}));
  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/forms/${formId}/settings`, {
        ...s,
        maxResponses: s.maxResponses===""?null:Number(s.maxResponses),
        closedAt: s.closedAt?new Date(s.closedAt).toISOString():null,
        redirectUrl: s.redirectUrl||null,
      }, { headers:{"x-user-id":userId} });
      toast.success("Settings saved");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };
  const Row = ({label,hint,children}:{label:string;hint?:string;children:React.ReactNode}) => (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-gray-100 last:border-0">
      <div><p className="text-sm font-medium text-gray-800">{label}</p>{hint&&<p className="text-xs text-gray-400 mt-0.5">{hint}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
  const Section = ({title,children}:{title:string;children:React.ReactNode}) => (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="bg-white border border-gray-200 rounded-xl px-4">{children}</div>
    </div>
  );
  return (
    <div className="max-w-xl mx-auto py-8 px-6 space-y-6">
      <Section title="Behaviour">
        <Row label="Allow multiple submissions" hint="Same person can submit more than once"><Switch checked={s.allowMultipleSubmissions} onCheckedChange={(v)=>upd("allowMultipleSubmissions",v)} /></Row>
        <Row label="Require login" hint="Must be signed in to submit"><Switch checked={s.requireLogin} onCheckedChange={(v)=>upd("requireLogin",v)} /></Row>
        <Row label="Email me on new response"><Switch checked={s.notifyOwnerEmail} onCheckedChange={(v)=>upd("notifyOwnerEmail",v)} /></Row>
        <Row label="Show progress bar" hint="Displays completion % to respondents"><Switch checked={s.progressBar} onCheckedChange={(v)=>upd("progressBar",v)} /></Row>
        <Row label="Hide branding" hint="Remove 'Powered by Intake' footer"><Switch checked={s.hideBranding} onCheckedChange={(v)=>upd("hideBranding",v)} /></Row>
      </Section>
      <Section title="Content">
        <Row label="Submit button label"><Input className="h-8 text-sm w-40 text-right" value={s.submitButtonLabel} onChange={(e)=>upd("submitButtonLabel",e.target.value)} /></Row>
        <Row label="Thank you message"><Input className="h-8 text-sm w-56 text-right" value={s.thankYouMessage} onChange={(e)=>upd("thankYouMessage",e.target.value)} /></Row>
        <Row label="Redirect URL" hint="After submission (optional)"><Input className="h-8 text-sm w-56 text-right" placeholder="https://…" value={s.redirectUrl} onChange={(e)=>upd("redirectUrl",e.target.value)} /></Row>
      </Section>
      <Section title="Limits">
        <Row label="Max responses" hint="Leave blank for unlimited"><Input type="number" className="h-8 text-sm w-28 text-right" placeholder="∞" value={s.maxResponses} onChange={(e)=>upd("maxResponses",e.target.value)} /></Row>
        <Row label="Close form at" hint="Leave blank to keep open"><Input type="datetime-local" className="h-8 text-sm w-48" value={s.closedAt} onChange={(e)=>upd("closedAt",e.target.value)} /></Row>
      </Section>
      <Section title="Branding">
        <Row label="Primary color">
          <div className="flex items-center gap-2">
            <input type="color" value={s.primaryColor} onChange={(e)=>upd("primaryColor",e.target.value)} className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
            <Input className="h-8 text-sm w-24 font-mono" value={s.primaryColor} onChange={(e)=>upd("primaryColor",e.target.value)} />
          </div>
        </Row>
      </Section>
      <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 text-sm font-medium">
        {saving?"Saving…":"Save settings"}
      </Button>
    </div>
  );
}


// ─────────────────────────────────────────────
//  THEMES TAB
// ─────────────────────────────────────────────
const PRESET_THEMES = [
  { id:"default",  label:"Default",   primaryColor:"#2563eb", bgColor:"#ffffff", fontFamily:"Inter",             textColor:"#111827" },
  { id:"midnight", label:"Midnight",  primaryColor:"#6366f1", bgColor:"#0f172a", fontFamily:"Space Grotesk",     textColor:"#f1f5f9" },
  { id:"rose",     label:"Rose",      primaryColor:"#e11d48", bgColor:"#fff1f2", fontFamily:"Nunito",            textColor:"#1c1917" },
  { id:"forest",   label:"Forest",    primaryColor:"#16a34a", bgColor:"#f0fdf4", fontFamily:"Lato",              textColor:"#14532d" },
  { id:"sunset",   label:"Sunset",    primaryColor:"#ea580c", bgColor:"#fff7ed", fontFamily:"Poppins",           textColor:"#431407" },
  { id:"lavender", label:"Lavender",  primaryColor:"#7c3aed", bgColor:"#f5f3ff", fontFamily:"Plus Jakarta Sans", textColor:"#2e1065" },
  { id:"ocean",    label:"Ocean",     primaryColor:"#0891b2", bgColor:"#ecfeff", fontFamily:"DM Sans",           textColor:"#164e63" },
  { id:"minimal",  label:"Minimal",   primaryColor:"#374151", bgColor:"#f9fafb", fontFamily:"Inter",             textColor:"#111827" },
];

const GOOGLE_FONTS = [
  "Inter","Roboto","Open Sans","Lato","Poppins","Montserrat","Nunito",
  "Raleway","Playfair Display","Merriweather","DM Sans","Space Grotesk",
  "Outfit","Sora","Plus Jakarta Sans",
];

function ThemesTab({ formId, userId, initialSettings, onThemeChange }: {
  formId: string; userId: string; initialSettings: any;
  onThemeChange: (theme: any) => void;
}) {
  const [theme, setTheme] = useState({
    primaryColor: initialSettings?.primaryColor || "#2563eb",
    bgColor:      initialSettings?.bgColor      || "#ffffff",
    fontFamily:   initialSettings?.fontFamily   || "Inter",
    textColor:    initialSettings?.textColor    || "#111827",
    coverUrl:     initialSettings?.coverUrl     || "",
    logoUrl:      initialSettings?.logoUrl      || "",
    borderRadius: initialSettings?.borderRadius || "md",
    progressBar:  initialSettings?.progressBar  ?? true,
  });
  const [saving, setSaving] = useState(false);

  const upd = (k: string, v: any) => {
    const next = { ...theme, [k]: v };
    setTheme(next);
    onThemeChange(next);
  };

  const applyPreset = (p: typeof PRESET_THEMES[0]) => {
    const next = { ...theme, primaryColor: p.primaryColor, bgColor: p.bgColor, fontFamily: p.fontFamily, textColor: p.textColor };
    setTheme(next);
    onThemeChange(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.patch(`${API}/forms/${formId}/theme`, theme, { headers:{"x-user-id":userId} });
      // Also patch settings so primaryColor persists
      await axios.patch(`${API}/forms/${formId}/settings`, {
        primaryColor: theme.primaryColor,
        progressBar: theme.progressBar,
      }, { headers:{"x-user-id":userId} });
      toast.success("Theme saved");
    } catch { toast.error("Failed to save theme"); }
    finally { setSaving(false); }
  };

  // Load font from Google Fonts
  useEffect(() => {
    if (!theme.fontFamily || theme.fontFamily === "Inter") return;
    const encoded = encodeURIComponent(theme.fontFamily);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [theme.fontFamily]);

  const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-6 py-3.5 border-b border-gray-100 last:border-0">
      <div><p className="text-sm font-medium text-gray-800">{label}</p>{hint&&<p className="text-xs text-gray-400 mt-0.5">{hint}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="bg-white border border-gray-200 rounded-xl px-4">{children}</div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-8 px-6 space-y-6">

      {/* Presets */}
      <Section title="Presets">
        <div className="py-4 grid grid-cols-4 gap-2">
          {PRESET_THEMES.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p)}
              className={cn("relative flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all hover:scale-105",
                theme.primaryColor===p.primaryColor && theme.bgColor===p.bgColor
                  ? "border-blue-500 shadow-sm" : "border-transparent hover:border-gray-200")}>
              {/* Mini preview swatch */}
              <div className="w-full h-10 rounded-lg border border-gray-100 overflow-hidden flex flex-col justify-center px-2 gap-1"
                style={{ backgroundColor: p.bgColor }}>
                <div className="h-1.5 rounded-full w-2/3" style={{ backgroundColor: p.primaryColor }} />
                <div className="h-1 rounded-full w-1/2 opacity-30" style={{ backgroundColor: p.textColor }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: "#374151" }}>{p.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Colors */}
      <Section title="Colors">
        <Row label="Primary color" hint="Buttons, active states, accents">
          <div className="flex items-center gap-2">
            <input type="color" value={theme.primaryColor} onChange={(e)=>upd("primaryColor",e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
            <Input className="h-8 text-sm w-24 font-mono" value={theme.primaryColor} onChange={(e)=>upd("primaryColor",e.target.value)} />
          </div>
        </Row>
        <Row label="Background color">
          <div className="flex items-center gap-2">
            <input type="color" value={theme.bgColor} onChange={(e)=>upd("bgColor",e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
            <Input className="h-8 text-sm w-24 font-mono" value={theme.bgColor} onChange={(e)=>upd("bgColor",e.target.value)} />
          </div>
        </Row>
        <Row label="Text color">
          <div className="flex items-center gap-2">
            <input type="color" value={theme.textColor} onChange={(e)=>upd("textColor",e.target.value)}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5" />
            <Input className="h-8 text-sm w-24 font-mono" value={theme.textColor} onChange={(e)=>upd("textColor",e.target.value)} />
          </div>
        </Row>
      </Section>

      {/* Typography */}
      <Section title="Typography">
        <Row label="Font family">
          <div className="relative">
            <select className="text-sm border border-gray-200 rounded-lg px-3 pr-8 py-1.5 bg-white outline-none focus:border-blue-400 appearance-none w-48"
              value={theme.fontFamily} onChange={(e)=>upd("fontFamily",e.target.value)}
              style={{ fontFamily: theme.fontFamily }}>
              {GOOGLE_FONTS.map((f)=>(
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </Row>
        {/* Live font preview */}
        <div className="py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Preview</p>
          <p className="text-base font-semibold" style={{ fontFamily: theme.fontFamily, color: theme.textColor }}>
            The quick brown fox jumps over the lazy dog
          </p>
          <p className="text-sm mt-1" style={{ fontFamily: theme.fontFamily, color: theme.textColor, opacity: 0.7 }}>
            Your form responses will look like this.
          </p>
        </div>
      </Section>

      {/* Branding images */}
      <Section title="Images">
        <Row label="Cover image URL" hint="Wide banner at the top of your form">
          <Input className="h-8 text-sm w-56 text-right" placeholder="https://…" value={theme.coverUrl}
            onChange={(e)=>upd("coverUrl",e.target.value)} />
        </Row>
        <Row label="Logo URL" hint="Small logo above the form title">
          <Input className="h-8 text-sm w-56 text-right" placeholder="https://…" value={theme.logoUrl}
            onChange={(e)=>upd("logoUrl",e.target.value)} />
        </Row>
      </Section>

      {/* Options */}
      <Section title="Options">
        <Row label="Corner radius" hint="How rounded the input fields look">
          <div className="flex gap-1">
            {([["none","□"],["sm","⌐"],["md","⌐"],["xl","◯"]] as [string,string][]).map(([val,icon])=>(
              <button key={val} onClick={()=>upd("borderRadius",val)}
                className={cn("px-2.5 py-1.5 text-xs rounded-md border transition-colors",
                  theme.borderRadius===val?"bg-gray-900 text-white border-gray-900":"border-gray-200 text-gray-600 hover:border-gray-400")}>
                {val}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Progress bar" hint="Show completion progress to respondents">
          <Switch checked={theme.progressBar} onCheckedChange={(v)=>upd("progressBar",v)} />
        </Row>
      </Section>

      {/* Live mini-preview */}
      <Section title="Preview">
        <div className="py-4">
          <div className="rounded-xl border border-gray-200 overflow-hidden"
            style={{ backgroundColor: theme.bgColor, fontFamily: theme.fontFamily }}>
            {theme.coverUrl && (
              <div className="h-16 bg-cover bg-center" style={{ backgroundImage: `url(${theme.coverUrl})` }} />
            )}
            <div className="px-5 py-4">
              {theme.logoUrl && <img src={theme.logoUrl} alt="Logo" className="h-6 mb-3 object-contain" />}
              <p className="text-base font-bold mb-1" style={{ color: theme.textColor }}>Sample Form</p>
              <p className="text-xs mb-3" style={{ color: theme.textColor, opacity: 0.6 }}>What is your name?</p>
              <div className={cn("h-9 border border-gray-200 bg-white flex items-center px-3 mb-3",
                theme.borderRadius==="none"?"rounded-none":theme.borderRadius==="sm"?"rounded":"theme.borderRadius==='xl'"?"rounded-full":"rounded-lg")}>
                <span className="text-xs text-gray-300">Your answer…</span>
              </div>
              <div className="h-8 px-4 flex items-center justify-center text-xs font-medium text-white rounded-lg"
                style={{ backgroundColor: theme.primaryColor, borderRadius: theme.borderRadius==="none"?"0":theme.borderRadius==="xl"?"999px":"8px" }}>
                Submit
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white w-full h-10 text-sm font-medium">
        {saving?"Saving…":"Save theme"}
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOGIC TAB
// ─────────────────────────────────────────────
function LogicTab({ blocks, formId, userId, onUpdateBlock }: { blocks: Block[]; formId: string; userId: string; onUpdateBlock: (id:string,data:Partial<Block>)=>void }) {
  const qBlocks = blocks.filter((b)=>!LAYOUT_TYPES.includes(b.type));
  const [openId, setOpenId] = useState<string|null>(null);
  const OPS = [{value:"equals",label:"is equal to"},{value:"not_equals",label:"is not equal to"},{value:"contains",label:"contains"},{value:"not_contains",label:"does not contain"},{value:"is_empty",label:"is empty"},{value:"is_not_empty",label:"is not empty"}];
  const save = async (id:string,logic:any)=>{
    try { await axios.patch(`${API}/forms/${formId}/blocks/${id}/logic`,{logic},{headers:{"x-user-id":userId}}); onUpdateBlock(id,{logic}); toast.success("Logic saved"); }
    catch { toast.error("Failed to save logic"); }
  };
  const clear = async (id:string)=>{
    try { await axios.patch(`${API}/forms/${formId}/blocks/${id}/logic`,{logic:null},{headers:{"x-user-id":userId}}); onUpdateBlock(id,{logic:null}); toast.success("Logic cleared"); }
    catch { toast.error("Failed to clear"); }
  };
  return (
    <div className="max-w-xl mx-auto py-8 px-6">
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6">
        <GitBranch className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700">Show or hide blocks based on previous answers. Logic is attached to the block it affects.</p>
      </div>
      {qBlocks.length===0&&<div className="text-center py-16 text-gray-400 text-sm">Add question blocks first to set up logic.</div>}
      <div className="space-y-3">
        {qBlocks.map((block)=>{
          const Icon=ICON_MAP[block.type]||Type;
          const isOpen=openId===block.id;
          const hasLogic=!!block.logic;
          const logic=block.logic||{conditions:[{sourceBlockId:"",operator:"equals",value:""}],conditionOperator:"AND",action:"show",targetBlockId:block.id};
          return (
            <div key={block.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={()=>setOpenId(isOpen?null:block.id)}>
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{block.label||"(no label)"}</span>
                  {hasLogic&&<span className="text-[10px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Logic on</span>}
                </div>
                <div className="flex items-center gap-2">
                  {hasLogic&&<button className="text-xs text-red-400 hover:text-red-600" onClick={(e)=>{e.stopPropagation();clear(block.id);}}>Clear</button>}
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform",isOpen&&"rotate-180")} />
                </div>
              </div>
              {isOpen&&(
                <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50/40">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">When</p>
                    {(logic.conditions||[]).map((cond:any,i:number)=>(
                      <div key={i} className="flex items-center gap-2 mb-2 flex-wrap">
                        <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-300"
                          value={cond.sourceBlockId} onChange={(e)=>{const n=[...logic.conditions];n[i]={...n[i],sourceBlockId:e.target.value};save(block.id,{...logic,conditions:n});}}>
                          <option value="">Pick a question…</option>
                          {qBlocks.filter((b)=>b.id!==block.id).map((b)=><option key={b.id} value={b.id}>{b.label||b.type}</option>)}
                        </select>
                        <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-300"
                          value={cond.operator} onChange={(e)=>{const n=[...logic.conditions];n[i]={...n[i],operator:e.target.value};save(block.id,{...logic,conditions:n});}}>
                          {OPS.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {!["is_empty","is_not_empty"].includes(cond.operator)&&(
                          <input className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none w-28 focus:border-blue-300"
                            placeholder="Value…" value={cond.value}
                            onChange={(e)=>{const n=[...logic.conditions];n[i]={...n[i],value:e.target.value};save(block.id,{...logic,conditions:n});}} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Then</p>
                    <div className="flex items-center gap-2">
                      <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-300"
                        value={logic.action} onChange={(e)=>save(block.id,{...logic,action:e.target.value})}>
                        <option value="show">Show this block</option>
                        <option value="hide">Hide this block</option>
                        <option value="jump_to">Jump to block</option>
                      </select>
                      {logic.action==="jump_to"&&(
                        <select className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white outline-none focus:border-blue-300"
                          value={logic.targetBlockId} onChange={(e)=>save(block.id,{...logic,targetBlockId:e.target.value})}>
                          {qBlocks.filter((b)=>b.id!==block.id).map((b)=><option key={b.id} value={b.id}>{b.label||b.type}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────
export default function FormEditorPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.formId as string;

  const [user, setUser]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [form, setForm]         = useState<Form|null>(null);
  const [blocks, setBlocks]     = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"build"|"settings"|"logic"|"themes">("build");
  const [shareOpen, setShareOpen] = useState(false);

  // Bottom picker
  const [bottomPickerOpen, setBottomPickerOpen] = useState(false);
  const [bottomAIOpen, setBottomAIOpen]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Full-form AI dialog
  const [fullAIOpen, setFullAIOpen]   = useState(false);
  const [fullAIPrompt, setFullAIPrompt] = useState("");
  const [fullAILoading, setFullAILoading] = useState(false);

  const saveTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      await fetchForm(data.user.id);
      setLoading(false);
    });
  }, [formId]);

  useEffect(() => {
    if (!bottomPickerOpen && !bottomAIOpen) return;
    const h = (e: MouseEvent) => {
      if (bottomRef.current && !bottomRef.current.contains(e.target as Node)) {
        setBottomPickerOpen(false); setBottomAIOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [bottomPickerOpen, bottomAIOpen]);

  const fetchForm = async (uid: string) => {
    try {
      const res = await axios.get(`${API}/forms/${formId}`, { headers:{"x-user-id":uid} });
      setForm(res.data.data);
      setBlocks(res.data.data.blocks || []);
    } catch { toast.error("Failed to load form"); }
  };

  const autoSave = useCallback((blockId: string, data: Partial<Block>) => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try { setSaving(true); await axios.patch(`${API}/forms/${formId}/blocks/${blockId}`, data, {headers:{"x-user-id":user?.id}}); }
      catch { /* silent */ } finally { setSaving(false); }
    }, 700);
  }, [formId, user]);

  const handleUpdateBlock = async (id: string, data: Partial<Block>) => {
    // Intercept AI inline signal
    if (data.config?.__aiPrompt) {
      const { __aiPrompt, __aiAfter, ...cleanConfig } = data.config;
      setBlocks((p) => p.map((b) => b.id===id ? {...b,config:cleanConfig} : b));
      await handleAIGenerate(__aiPrompt, __aiAfter);
      return;
    }
    setBlocks((p) => p.map((b) => b.id===id ? {...b,...data} : b));
    autoSave(id, data);
  };

  const handleAddBlock = async (type: string, afterId?: string|null) => {
    setBottomPickerOpen(false);
    try {
      const res = await axios.post(`${API}/forms/${formId}/blocks`,
        { type, label:"", required:false, ...(afterId&&{afterBlockId:afterId}) },
        { headers:{"x-user-id":user.id} });
      const nb = res.data.data;
      setBlocks((prev) => {
        if (!afterId) return [...prev, nb];
        const idx = prev.findIndex((b)=>b.id===afterId);
        if (idx===-1) return [...prev,nb];
        const n=[...prev]; n.splice(idx+1,0,nb); return n;
      });
      setSelectedId(nb.id);
    } catch { toast.error("Failed to add block"); }
  };

  const handleAIGenerate = async (prompt: string, afterId?: string|null) => {
    setAILoading(true);
    try {
      const res = await axios.post(`${API}/forms/${formId}/ai-generate`,
        { prompt },
        { headers:{"x-user-id":user.id} });
      const newBlocks: Block[] = res.data.data;
      setBlocks((prev) => {
        if (!afterId) return [...prev, ...newBlocks];
        const idx = prev.findIndex((b)=>b.id===afterId);
        if (idx===-1) return [...prev,...newBlocks];
        const n=[...prev]; n.splice(idx+1,0,...newBlocks); return n;
      });
      toast.success(`✨ Generated ${newBlocks.length} block${newBlocks.length!==1?"s":""}`);
    } catch (e:any) {
      toast.error(e.response?.data?.error || "AI generation failed");
    } finally { setAILoading(false); }
  };

  const handleFullAIGenerate = async () => {
    if (!fullAIPrompt.trim()) return;
    setFullAILoading(true);
    try {
      const res = await axios.post(`${API}/forms/${formId}/ai-generate-full`,
        { prompt: fullAIPrompt },
        { headers:{"x-user-id":user.id} });
      const updated = res.data.data;
      setForm(updated);
      setBlocks(updated.blocks || []);
      setFullAIOpen(false);
      setFullAIPrompt("");
      toast.success("✨ Form generated!");
    } catch (e:any) {
      toast.error(e.response?.data?.error || "AI generation failed");
    } finally { setFullAILoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/forms/${formId}/blocks/${id}`, {headers:{"x-user-id":user.id}});
      setBlocks((p)=>p.filter((b)=>b.id!==id));
      if (selectedId===id) setSelectedId(null);
    } catch { toast.error("Failed to delete block"); }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await axios.post(`${API}/forms/${formId}/blocks/${id}/duplicate`,{},{headers:{"x-user-id":user.id}});
      const dup = res.data.data;
      setBlocks((prev)=>{const idx=prev.findIndex((b)=>b.id===id);const n=[...prev];n.splice(idx+1,0,dup);return n;});
    } catch { toast.error("Failed to duplicate"); }
  };

  const handleTogglePublish = async () => {
    try {
      const res = await axios.patch(`${API}/forms/${formId}/publish`,{},{headers:{"x-user-id":user.id}});
      setForm((p)=>p?{...p,status:res.data.data.status}:p);
      const isNowPublished = res.data.data.status === "PUBLISHED";
      toast.success(isNowPublished ? "Form published! 🎉" : "Unpublished");
      if (isNowPublished) setShareOpen(true); // Auto-open share modal on publish
    } catch { toast.error("Failed to update status"); }
  };

  const handleUpdateTitle = (title: string) => {
    setForm((p)=>p?{...p,title}:p);
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try { await axios.patch(`${API}/forms/${formId}`,{title},{headers:{"x-user-id":user.id}}); }
      catch { /* silent */ }
    }, 700);
  };

  if (loading || !form) return <LoadingPage />;
  const isPublished = form.status === "PUBLISHED";

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-screen bg-white overflow-hidden">

        {/* TOP BAR */}
        <header className="h-14 border-b border-gray-100 flex items-center gap-3 px-4 shrink-0 bg-white">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={()=>router.back()}><ArrowLeft className="w-4 h-4" /></Button>
            <input className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none min-w-0 max-w-[180px] truncate"
              value={form.title} onChange={(e)=>handleUpdateTitle(e.target.value)} placeholder="Untitled form" />
            <Badge variant="outline" className={cn("text-xs shrink-0",isPublished?"bg-green-50 text-green-700 border-green-200":"bg-gray-100 text-gray-500 border-gray-200")}>
              {isPublished?"Published":"Draft"}
            </Badge>
            {saving&&<span className="text-xs text-gray-400 shrink-0">Saving…</span>}
            {aiLoading&&<span className="text-xs text-violet-500 shrink-0 flex items-center gap-1"><Sparkles className="w-3 h-3 animate-pulse" />Generating…</span>}
          </div>

          {/* Center tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5 shrink-0">
            {(["build","settings","logic","themes"] as const).map((tab)=>(
              <button key={tab} onClick={()=>setActiveTab(tab)}
                className={cn("px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all",
                  activeTab===tab?"bg-white text-gray-900 shadow-sm":"text-gray-500 hover:text-gray-700")}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-1 justify-end">
            {/* AI full-form button */}
            <Tooltip><TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-violet-200 text-violet-600 hover:bg-violet-50 hover:text-violet-700"
                onClick={()=>setFullAIOpen(true)}>
                <Wand2 className="w-3.5 h-3.5" />AI generate
              </Button>
            </TooltipTrigger><TooltipContent>Generate entire form with AI</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>window.open(`/f/${form.slug}`,"_blank")}><Eye className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Preview</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>setShareOpen(true)}><Share2 className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Share</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50" onClick={()=>router.push(`/forms/${formId}/ai-insights`)}><Brain className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>AI Insights</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={()=>router.push(`/forms/${formId}/translate`)}><Languages className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Auto-translate</TooltipContent></Tooltip>

            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={()=>router.push(`/forms/${formId}/responses`)}><BarChart2 className="w-4 h-4" /></Button>
            </TooltipTrigger><TooltipContent>Responses</TooltipContent></Tooltip>

            <Button onClick={handleTogglePublish} size="sm"
              className={cn("h-8 text-sm gap-1.5 font-medium",isPublished?"bg-gray-900 hover:bg-gray-800 text-white":"bg-blue-600 hover:bg-blue-700 text-white")}>
              {isPublished?<><CheckCircle2 className="w-3.5 h-3.5"/>Published</>:<><Globe className="w-3.5 h-3.5"/>Publish</>}
            </Button>
          </div>
        </header>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-hidden">

          {/* BUILD */}
          {activeTab==="build"&&(
            <div className="h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto py-10 px-6">
                <input className="w-full text-[32px] font-bold text-gray-900 bg-transparent border-none outline-none placeholder-gray-200 leading-tight"
                  placeholder="Form title" value={form.title} onChange={(e)=>handleUpdateTitle(e.target.value)} />
                <div className="h-px bg-gray-100 mt-4 mb-6" />

                {blocks.length===0&&(
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center mb-4">
                      <Plus className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium mb-1">Your form is empty</p>
                    <p className="text-sm text-gray-400">Use <span className="font-medium text-gray-600">+ Add a block</span> or <span className="font-medium text-violet-600">✨ AI generate</span> below</p>
                  </div>
                )}

                <div className="space-y-0.5">
                  {blocks.map((block)=>(
                    <BlockRow key={block.id} block={block}
                      isSelected={selectedId===block.id}
                      onSelect={()=>setSelectedId((p)=>p===block.id?null:block.id)}
                      onUpdate={handleUpdateBlock}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      onAddAfter={(id,type)=>handleAddBlock(type,id)}
                    />
                  ))}
                </div>

                {/* AI Block Suggestions */}
                <div className="mt-5 mb-4">
                  <AIBlockSuggestions formId={formId} onBlockAdded={async () => {
                    const r = await axios.get(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000/api/v1"}/forms/${formId}/blocks`, { headers: { "x-user-id": user.id } });
                    if (r.data.data) setBlocks(r.data.data);
                  }} />
                </div>

                {/* Bottom toolbar */}
                <div className="relative mt-5 flex items-center gap-3" ref={bottomRef}>
                  <div className="relative">
                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 transition-colors group/add"
                      onClick={()=>{setBottomPickerOpen((v)=>!v);setBottomAIOpen(false);}}>
                      <div className="w-6 h-6 rounded-md bg-gray-100 group-hover/add:bg-gray-200 flex items-center justify-center transition-colors">
                        <Plus className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span>Add a block</span>
                    </button>
                    {bottomPickerOpen&&(
                      <BlockPicker
                        onSelect={(type)=>{setBottomPickerOpen(false);handleAddBlock(type,blocks[blocks.length-1]?.id??null);}}
                        onClose={()=>setBottomPickerOpen(false)}
                        showAI
                        onOpenAI={()=>{setBottomPickerOpen(false);setBottomAIOpen(true);}}
                      />
                    )}
                    {bottomAIOpen&&(
                      <AIPromptPanel loading={aiLoading}
                        onClose={()=>setBottomAIOpen(false)}
                        onGenerate={(prompt)=>{setBottomAIOpen(false);handleAIGenerate(prompt,blocks[blocks.length-1]?.id??null);}} />
                    )}
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <button className="flex items-center gap-2 text-sm text-violet-500 hover:text-violet-700 transition-colors group/ai"
                    onClick={()=>{setBottomAIOpen((v)=>!v);setBottomPickerOpen(false);}}>
                    <div className="w-6 h-6 rounded-md bg-violet-50 group-hover/ai:bg-violet-100 flex items-center justify-center transition-colors">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <span>Generate with AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab==="settings"&&(
            <div className="h-full overflow-y-auto bg-gray-50/40">
              <SettingsTab formId={formId} userId={user.id} initialSettings={form.settings} />
            </div>
          )}

          {activeTab==="logic"&&(
            <div className="h-full overflow-y-auto bg-gray-50/40">
              <LogicTab blocks={blocks} formId={formId} userId={user.id} onUpdateBlock={handleUpdateBlock} />
            </div>
          )}
          {activeTab==="themes"&&(
            <div className="h-full overflow-y-auto bg-gray-50/40">
              <ThemesTab
                formId={formId}
                userId={user.id}
                initialSettings={form.settings}
                onThemeChange={(t) => setForm((p) => p ? { ...p, settings: { ...p.settings, ...t } } : p)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Share modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        {form && <ShareModal form={form} onClose={()=>setShareOpen(false)} />}
      </Dialog>

      {/* Full AI generate modal */}
      <Dialog open={fullAIOpen} onOpenChange={setFullAIOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              Generate form with AI
            </DialogTitle>
            <DialogDescription>
              Describe the form you want to create. AI will generate a complete form with a title, description, and all the relevant fields. <strong>This will replace all existing blocks.</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea className="text-sm resize-none min-h-[100px] focus:border-violet-400 focus-visible:ring-violet-200"
              placeholder="e.g. A job application form for a senior software engineer position with fields for personal info, work experience, technical skills, and an optional cover letter"
              value={fullAIPrompt} onChange={(e)=>setFullAIPrompt(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              {["Customer feedback survey with NPS, overall satisfaction, and open comments",
                "Event registration: name, email, ticket type, dietary restrictions, +1 guest",
                "Bug report: title, steps to reproduce, expected vs actual, severity, screenshot upload",
                "Employee onboarding: personal details, emergency contact, equipment preferences"].map((ex)=>(
                <button key={ex} className="text-left text-xs text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg p-2.5 border border-gray-100 hover:border-violet-200 transition-colors"
                  onClick={()=>setFullAIPrompt(ex)}>{ex}</button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setFullAIOpen(false)}>Cancel</Button>
            <Button onClick={handleFullAIGenerate} disabled={fullAILoading||!fullAIPrompt.trim()}
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white gap-2">
              {fullAILoading?<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Generating…</>
                :<><Wand2 className="w-4 h-4"/>Generate form</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}