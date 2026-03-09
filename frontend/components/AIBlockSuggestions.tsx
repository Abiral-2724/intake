"use client";
import { useState } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Wand2, Loader2, Plus, ChevronDown, ChevronUp,
  Sparkles, RefreshCw, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  SHORT_ANSWER: "Short answer", LONG_ANSWER: "Long answer",
  MULTIPLE_CHOICE: "Multiple choice", CHECKBOXES: "Checkboxes",
  DROPDOWN: "Dropdown", EMAIL: "Email", PHONE_NUMBER: "Phone",
  NUMBER: "Number", RATING: "Rating", LINEAR_SCALE: "Linear scale",
  DATE: "Date", TIME: "Time", LINK: "URL", FILE_UPLOAD: "File upload",
  HEADING_1: "Heading", TEXT: "Text", DIVIDER: "Divider",
};

interface Suggestion {
  type: string;
  label: string;
  required: boolean;
  config: Record<string, any>;
  reason: string;
}

interface Props {
  formId: string;
  onBlockAdded?: () => void; // callback to refresh editor blocks
}

export default function AIBlockSuggestions({ formId, onBlockAdded }: Props) {
  const [open, setOpen]             = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading]       = useState(false);
  const [adding, setAdding]         = useState<number | null>(null);
  const [added, setAdded]           = useState<Set<number>>(new Set());

  async function loadSuggestions() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await axios.post(`${API}/forms/${formId}/ai/suggest-blocks`, {}, {
        headers: { "x-user-id": session.user.id },
      });
      setSuggestions(res.data.suggestions || []);
      setAdded(new Set());
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  }

  async function addBlock(suggestion: Suggestion, index: number) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setAdding(index);
    try {
      await axios.post(`${API}/forms/${formId}/ai/apply-suggestion`, {
        type: suggestion.type,
        label: suggestion.label,
        required: suggestion.required,
        config: suggestion.config,
      }, { headers: { "x-user-id": session.user.id } });

      setAdded(prev => new Set([...prev, index]));
      toast.success(`Added: ${suggestion.label}`);
      onBlockAdded?.();
    } catch (err: any) {
      toast.error("Failed to add block");
    } finally {
      setAdding(null);
    }
  }

  function handleToggle() {
    if (!open && suggestions.length === 0) loadSuggestions();
    setOpen(v => !v);
  }

  return (
    <div className="border border-violet-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <button onClick={handleToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-violet-50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Wand2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-gray-900">AI Block Suggestions</p>
            <p className="text-[10px] text-gray-400">Powered by Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {suggestions.length > 0 && !open && (
            <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
              {suggestions.length - added.size} suggestions
            </span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-violet-100 px-4 pb-4 pt-3">
          {loading && (
            <div className="flex flex-col items-center py-6 gap-2">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
              <p className="text-xs text-gray-400">Analysing your form…</p>
            </div>
          )}

          {!loading && suggestions.length === 0 && (
            <div className="text-center py-4">
              <Sparkles className="w-6 h-6 text-violet-400 mx-auto mb-2" />
              <p className="text-xs text-gray-500 mb-3">No suggestions yet</p>
              <button onClick={loadSuggestions}
                className="text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors">
                Get suggestions
              </button>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border transition-all",
                  added.has(i) ? "border-green-200 bg-green-50" : "border-gray-100 hover:border-violet-200 hover:bg-violet-50/50"
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded">
                        {BLOCK_TYPE_LABELS[s.type] || s.type}
                      </span>
                      {s.required && <span className="text-[10px] text-red-500 font-semibold">Required</span>}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 leading-snug">{s.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{s.reason}</p>
                    {s.config?.options?.length > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        Options: {s.config.options.slice(0, 3).join(", ")}{s.config.options.length > 3 ? "…" : ""}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => !added.has(i) && addBlock(s, i)}
                    disabled={adding === i || added.has(i)}
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all",
                      added.has(i)
                        ? "bg-green-100 text-green-600"
                        : "bg-violet-100 hover:bg-violet-600 hover:text-white text-violet-600"
                    )}>
                    {adding === i ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                     added.has(i) ? <Check className="w-3.5 h-3.5" /> :
                     <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}

              <button onClick={loadSuggestions}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-violet-600 py-1.5 transition-colors mt-1">
                <RefreshCw className="w-3 h-3" /> Refresh suggestions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}