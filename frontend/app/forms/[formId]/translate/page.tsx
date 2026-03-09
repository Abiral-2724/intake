"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "sonner";
import {
  Languages, ArrowLeft, Loader2, Check, Eye, Save,
  Globe, ChevronRight, RefreshCw, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const LANGUAGES = [
  { code: "hi", name: "Hindi",      flag: "🇮🇳" },
  { code: "es", name: "Spanish",    flag: "🇪🇸" },
  { code: "fr", name: "French",     flag: "🇫🇷" },
  { code: "de", name: "German",     flag: "🇩🇪" },
  { code: "zh", name: "Chinese",    flag: "🇨🇳" },
  { code: "ja", name: "Japanese",   flag: "🇯🇵" },
  { code: "ar", name: "Arabic",     flag: "🇸🇦" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "it", name: "Italian",    flag: "🇮🇹" },
  { code: "ko", name: "Korean",     flag: "🇰🇷" },
  { code: "ru", name: "Russian",    flag: "🇷🇺" },
  { code: "tr", name: "Turkish",    flag: "🇹🇷" },
  { code: "nl", name: "Dutch",      flag: "🇳🇱" },
  { code: "pl", name: "Polish",     flag: "🇵🇱" },
  { code: "sv", name: "Swedish",    flag: "🇸🇪" },
];

type Step = "pick" | "preview" | "done";

export default function TranslatePage() {
  const { formId } = useParams<{ formId: string }>();
  const router = useRouter();

  const [step, setStep]                 = useState<Step>("pick");
  const [selectedLang, setSelectedLang] = useState<typeof LANGUAGES[0] | null>(null);
  const [loading, setLoading]           = useState(false);
  const [applying, setApplying]         = useState(false);
  const [preview, setPreview]           = useState<any>(null);
  const [original, setOriginal]         = useState<any>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  async function generatePreview() {
    if (!selectedLang) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/forms/${formId}/ai/translate`,
        { targetLanguage: selectedLang.name, applyToForm: false },
        { headers: { "x-user-id": session.user.id } }
      );
      setPreview(res.data.translated);
      setOriginal(res.data.original);
      setStep("preview");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Translation failed");
    } finally {
      setLoading(false);
    }
  }

  async function applyTranslation() {
    if (!selectedLang) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setApplying(true);
    try {
      await axios.post(`${API}/forms/${formId}/ai/translate`,
        { targetLanguage: selectedLang.name, applyToForm: true },
        { headers: { "x-user-id": session.user.id } }
      );
      toast.success(`Form translated to ${selectedLang.name}!`);
      setStep("done");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to apply translation");
    } finally {
      setApplying(false);
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-7 py-6 max-w-4xl mx-auto w-full">

            {/* Header */}
            <div className="mb-6">
              <button onClick={() => router.push(`/forms/${formId}/editor`)}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to editor
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Languages className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Auto-translate</h1>
                  <p className="text-sm text-gray-500">Translate your entire form to any language with one click</p>
                </div>
              </div>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-2 mb-7">
              {(["pick", "preview", "done"] as const).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    step === s ? "bg-blue-600 text-white" :
                    (["pick","preview","done"].indexOf(step) > i) ? "bg-green-500 text-white" :
                    "bg-gray-200 text-gray-400"
                  )}>
                    {(["pick","preview","done"].indexOf(step) > i) ? <Check className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className={cn("text-xs font-medium capitalize",
                    step === s ? "text-gray-900" : "text-gray-400")}>
                    {s === "pick" ? "Choose language" : s === "preview" ? "Preview" : "Done"}
                  </span>
                  {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                </div>
              ))}
            </div>

            {/* ── STEP 1: Pick language ── */}
            {step === "pick" && (
              <div>
                <p className="text-sm text-gray-600 mb-4">Select the language you want to translate your form into:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-6">
                  {LANGUAGES.map(lang => (
                    <button key={lang.code} onClick={() => setSelectedLang(lang)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-all",
                        selectedLang?.code === lang.code
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      )}>
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </button>
                  ))}
                </div>

                {/* Warning */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 mb-6">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>Heads up:</strong> Translating will permanently change your form's labels, questions, and options. You'll see a preview first before anything is saved. We recommend exporting a backup or duplicating your form first.
                  </p>
                </div>

                <button
                  onClick={generatePreview}
                  disabled={!selectedLang || loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  {loading ? `Translating to ${selectedLang?.name}…` : `Preview translation${selectedLang ? ` → ${selectedLang.flag} ${selectedLang.name}` : ""}`}
                </button>
              </div>
            )}

            {/* ── STEP 2: Preview ── */}
            {step === "preview" && preview && original && (
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{selectedLang?.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Translation preview — {selectedLang?.name}</p>
                      <p className="text-xs text-gray-400">{preview.blocks?.length} blocks translated</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowOriginal(v => !v)}
                      className={cn("flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors",
                        showOriginal ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300")}>
                      <Eye className="w-3 h-3" /> {showOriginal ? "Show translated" : "Show original"}
                    </button>
                    <button onClick={() => setStep("pick")}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Change language
                    </button>
                  </div>
                </div>

                {/* Title/Description preview */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Title</p>
                      <p className="text-sm text-gray-900 font-medium">{showOriginal ? original.title : preview.title}</p>
                    </div>
                    {(original.description || preview.description) && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-gray-600">{showOriginal ? original.description : preview.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Blocks preview */}
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 mb-4 max-h-96 overflow-y-auto">
                  {(showOriginal ? original.blocks : preview.blocks)?.map((block: any, i: number) => (
                    <div key={block.id || i} className="px-5 py-3">
                      <p className="text-xs text-gray-400 mb-0.5">Question {i + 1}</p>
                      <p className="text-sm font-medium text-gray-900">{block.label || <span className="text-gray-300 italic">No label</span>}</p>
                      {block.config?.placeholder && (
                        <p className="text-xs text-gray-400 mt-1">Placeholder: {block.config.placeholder}</p>
                      )}
                      {block.config?.options?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">Options: {block.config.options.join(" · ")}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Settings preview */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-6 text-sm">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Submit button</p>
                    <p className="font-medium text-gray-800">{showOriginal ? original.submitButtonLabel : preview.submitButtonLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Thank you message</p>
                    <p className="font-medium text-gray-800">{showOriginal ? original.thankYouMessage : preview.thankYouMessage}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={applyTranslation} disabled={applying}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                    {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {applying ? "Applying…" : `Apply translation — save to form`}
                  </button>
                  <button onClick={() => setStep("pick")} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Done ── */}
            {step === "done" && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Form translated to {selectedLang?.flag} {selectedLang?.name}
                </h2>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                  All labels, questions, options, and messages have been saved. Go to the editor to review or make adjustments.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => router.push(`/forms/${formId}/editor`)}
                    className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                    Open editor
                  </button>
                  <button onClick={() => { setStep("pick"); setSelectedLang(null); setPreview(null); }}
                    className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                    Translate to another language
                  </button>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}