"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Sheet, Check, Loader2, ExternalLink } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function GoogleSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");

  const [user, setUser]   = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [init, setInit]   = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      // Fetch the pending integration to show Google account
      try {
        const res = await axios.get(`${API}/forms/${formId}/integrations`, {
          headers: { "x-user-id": data.user.id },
        });
        const g = res.data.data.find((i: any) => i.type === "google_sheets");
        if (g?.config?.googleEmail) setEmail(g.config.googleEmail);
      } catch {}
      setInit(false);
    });
  }, [formId]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/forms/${formId}/integrations/google/setup`, {},
        { headers: { "x-user-id": user.id } }
      );
      setSheetUrl(res.data.spreadsheetUrl);
      setDone(true);
      setTimeout(() => router.push(`/forms/${formId}/responses`), 3000);
    } catch {
      toast.error("Failed to create spreadsheet. Please try again.");
    } finally { setLoading(false); }
  };

  if (init) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Spreadsheet created!</h2>
        <p className="text-sm text-gray-500 mb-4">Your existing responses are being synced now, and every new submission will appear automatically.</p>
        {sheetUrl && (
          <a href={sheetUrl} target="_blank"
            className="inline-flex items-center gap-2 text-sm text-green-600 hover:underline font-medium mb-4">
            <Sheet className="w-4 h-4" />Open your sheet <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 mt-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
          Syncing existing responses in background…
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Sheet className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Connect to Google Sheets</h1>
            <p className="text-xs text-gray-400">We'll create a spreadsheet ready for your responses</p>
          </div>
        </div>

        {email && (
          <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span className="text-sm text-gray-700">Signed in as <strong>{email}</strong></span>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {[
            { icon: "📋", title: "Auto-creates a spreadsheet", desc: "Named after your form, with pre-configured columns for every field." },
            { icon: "⚡", title: "Real-time sync", desc: "Every new submission instantly appears as a new row — no delays." },
            { icon: "🎨", title: "Formatted headers", desc: "Column headers are bold and colour-coded so your sheet looks great." },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xl shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-sm font-medium gap-2"
          disabled={loading} onClick={handleCreate}>
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Creating your spreadsheet…</>
            : <><Sheet className="w-4 h-4" />Create spreadsheet & connect</>}
        </Button>
      </div>
    </div>
  );
}