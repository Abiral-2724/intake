"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { BookOpen, Check, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function NotionSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = searchParams.get("formId");

  const [user, setUser]             = useState<any>(null);
  const [integration, setIntegration] = useState<any>(null);
  const [databases, setDatabases]   = useState<any[]>([]);
  const [selected, setSelected]     = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      // Fetch integration (which has the databases list from the callback)
      try {
        const res = await axios.get(`${API}/forms/${formId}/integrations`, {
          headers: { "x-user-id": data.user.id },
        });
        const notion = res.data.data.find((i: any) => i.type === "notion");
        if (notion) {
          setIntegration(notion);
          setDatabases(notion.config?.databases || []);
        }
      } catch { toast.error("Failed to load integration"); }
      setLoading(false);
    });
  }, [formId]);

  const handleFinish = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const db = databases.find(d => d.id === selected);
      await axios.post(`${API}/forms/${formId}/integrations/notion/setup`,
        { databaseId: selected, databaseTitle: db?.title },
        { headers: { "x-user-id": user.id } }
      );
      setDone(true);
      setTimeout(() => router.push(`/forms/${formId}/responses`), 2000);
    } catch { toast.error("Setup failed. Please try again."); }
    finally { setSaving(false); }
  };

  if (loading) return (
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">All set!</h2>
        <p className="text-sm text-gray-500">Notion is connected. New responses will appear in your database automatically.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-gray-800" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Connect to Notion</h1>
            <p className="text-xs text-gray-400">Select a database to receive your form responses</p>
          </div>
        </div>

        {integration?.config?.workspaceName && (
          <div className="mb-5 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-sm text-gray-700">Connected to workspace: <strong>{integration.config.workspaceName}</strong></span>
          </div>
        )}

        {databases.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-800 mb-1">No databases found</p>
            <p className="text-xs text-gray-500 mb-4">Make sure your integration has access to at least one Notion database.</p>
            <a href="https://notion.so" target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
              Open Notion <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 mb-3">Choose a database:</p>
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {databases.map(db => (
                <button key={db.id} onClick={() => setSelected(db.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    selected === db.id
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"
                  }`}>
                  <BookOpen className={`w-4 h-4 shrink-0 ${selected === db.id ? "text-white" : "text-gray-500"}`} />
                  <span className="text-sm font-medium truncate">{db.title}</span>
                  {selected === db.id && <Check className="w-4 h-4 ml-auto shrink-0" />}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-5 text-xs text-blue-700">
              ✨ Intake will automatically add columns to your database matching your form fields.
            </div>
            <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white h-11 text-sm font-medium"
              disabled={!selected || saving} onClick={handleFinish}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Setting up…</> : "Finish setup →"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}