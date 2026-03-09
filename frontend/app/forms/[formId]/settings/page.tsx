"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingPage from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Mail,
  Globe,
  Users,
  Clock,
  Palette,
  MessageSquare,
  BarChart2,
  Save,
  Hash,
  Shield,
  Copy,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Settings = {
  allowMultipleSubmissions: boolean;
  requireLogin: boolean;
  submitButtonLabel: string;
  redirectUrl: string;
  thankYouMessage: string;
  notifyOwnerEmail: boolean;
  notificationEmails: string[];
  maxResponses: number | "";
  closedAt: string;
  hideBranding: boolean;
  primaryColor: string;
  hasPassword: boolean;
};

function SettingSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <Icon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function FormSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const formId = params?.formId as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formTitle, setFormTitle] = useState("Form");
  const [formSlug, setFormSlug] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notifEmail, setNotifEmail] = useState("");
  const [settings, setSettings] = useState<Settings>({
    allowMultipleSubmissions: true,
    requireLogin: false,
    submitButtonLabel: "Submit",
    redirectUrl: "",
    thankYouMessage: "Thank you for your response!",
    notifyOwnerEmail: false,
    notificationEmails: [],
    maxResponses: "",
    closedAt: "",
    hideBranding: false,
    primaryColor: "#2563eb",
    hasPassword: false,
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      await fetchForm(data.user.id);
      setLoading(false);
    });
  }, [formId]);

  const fetchForm = async (userId: string) => {
    try {
      const res = await axios.get(`${API}/forms/${formId}`, {
        headers: { "x-user-id": userId },
      });
      const form = res.data.data;
      setFormTitle(form.title);
      setFormSlug(form.slug);
      const s = form.settings;
      if (s) {
        setSettings({
          allowMultipleSubmissions: s.allowMultipleSubmissions,
          requireLogin: s.requireLogin,
          submitButtonLabel: s.submitButtonLabel,
          redirectUrl: s.redirectUrl || "",
          thankYouMessage: s.thankYouMessage,
          notifyOwnerEmail: s.notifyOwnerEmail,
          notificationEmails: s.notificationEmails || [],
          maxResponses: s.maxResponses || "",
          closedAt: s.closedAt ? new Date(s.closedAt).toISOString().slice(0, 16) : "",
          hideBranding: s.hideBranding,
          primaryColor: s.primaryColor,
          hasPassword: false, // server never returns the hash
        });
      }
    } catch { toast.error("Failed to load settings"); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        allowMultipleSubmissions: settings.allowMultipleSubmissions,
        requireLogin: settings.requireLogin,
        submitButtonLabel: settings.submitButtonLabel,
        redirectUrl: settings.redirectUrl || null,
        thankYouMessage: settings.thankYouMessage,
        notifyOwnerEmail: settings.notifyOwnerEmail,
        notificationEmails: settings.notificationEmails,
        maxResponses: settings.maxResponses === "" ? null : Number(settings.maxResponses),
        closedAt: settings.closedAt ? new Date(settings.closedAt).toISOString() : null,
        hideBranding: settings.hideBranding,
        primaryColor: settings.primaryColor,
      };
      if (newPassword !== "") {
        payload.password = newPassword || null;
      }
      await axios.patch(`${API}/forms/${formId}/settings`, payload, {
        headers: { "x-user-id": user.id },
      });
      toast.success("Settings saved");
      setNewPassword("");
    } catch { toast.error("Failed to save settings"); }
    finally { setSaving(false); }
  };

  const update = (key: keyof Settings, value: any) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const addEmail = () => {
    if (!notifEmail || settings.notificationEmails.includes(notifEmail)) return;
    update("notificationEmails", [...settings.notificationEmails, notifEmail]);
    setNotifEmail("");
  };

  const removeEmail = (e: string) =>
    update("notificationEmails", settings.notificationEmails.filter((x) => x !== e));

  const formUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/f/${formSlug}`;

  if (loading) return <LoadingPage />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <button onClick={() => router.back()} className="hover:text-gray-900 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span
                  className="hover:text-gray-900 cursor-pointer transition-colors"
                  onClick={() => router.push(`/forms/${formId}/editor`)}
                >
                  {formTitle}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">Settings</span>
              </div>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>

            <div className="space-y-4">
              {/* Share link */}
              <SettingSection title="Share link" icon={Globe}>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Form URL</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={formUrl}
                      className="text-sm text-gray-700 bg-gray-50 h-9"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(formUrl);
                        toast.success("Link copied!");
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 shrink-0"
                      onClick={() => window.open(formUrl, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </SettingSection>

              {/* Submission behaviour */}
              <SettingSection title="Submission behaviour" icon={MessageSquare}>
                <SettingRow
                  label="Allow multiple submissions"
                  description="Let the same person submit more than once"
                >
                  <Switch
                    checked={settings.allowMultipleSubmissions}
                    onCheckedChange={(v) => update("allowMultipleSubmissions", v)}
                  />
                </SettingRow>
                <Separator />
                <SettingRow
                  label="Require login"
                  description="Respondents must be logged in to submit"
                >
                  <Switch
                    checked={settings.requireLogin}
                    onCheckedChange={(v) => update("requireLogin", v)}
                  />
                </SettingRow>
                <Separator />
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Submit button label</label>
                  <Input
                    className="h-9 text-sm"
                    value={settings.submitButtonLabel}
                    onChange={(e) => update("submitButtonLabel", e.target.value)}
                    placeholder="Submit"
                  />
                </div>
                <Separator />
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Thank you message</label>
                  <Input
                    className="h-9 text-sm"
                    value={settings.thankYouMessage}
                    onChange={(e) => update("thankYouMessage", e.target.value)}
                    placeholder="Thank you for your response!"
                  />
                </div>
                <Separator />
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Redirect URL <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <Input
                    className="h-9 text-sm"
                    value={settings.redirectUrl}
                    onChange={(e) => update("redirectUrl", e.target.value)}
                    placeholder="https://yoursite.com/thanks"
                  />
                </div>
              </SettingSection>

              {/* Notifications */}
              <SettingSection title="Notifications" icon={Mail}>
                <SettingRow
                  label="Email me on new response"
                  description="Get notified when someone submits"
                >
                  <Switch
                    checked={settings.notifyOwnerEmail}
                    onCheckedChange={(v) => update("notifyOwnerEmail", v)}
                  />
                </SettingRow>
                <Separator />
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Additional notification emails
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <Input
                      className="h-9 text-sm"
                      placeholder="teammate@example.com"
                      value={notifEmail}
                      onChange={(e) => setNotifEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addEmail()}
                    />
                    <Button variant="outline" size="sm" className="h-9 shrink-0" onClick={addEmail}>
                      Add
                    </Button>
                  </div>
                  {settings.notificationEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {settings.notificationEmails.map((e) => (
                        <div
                          key={e}
                          className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-700"
                        >
                          {e}
                          <button
                            onClick={() => removeEmail(e)}
                            className="text-gray-400 hover:text-gray-700 ml-0.5"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SettingSection>

              {/* Response limits */}
              <SettingSection title="Response limits" icon={BarChart2}>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Max responses <span className="text-gray-400 font-normal">(leave blank for unlimited)</span>
                  </label>
                  <Input
                    type="number"
                    className="h-9 text-sm max-w-xs"
                    value={settings.maxResponses}
                    onChange={(e) => update("maxResponses", e.target.value)}
                    placeholder="e.g. 100"
                    min={1}
                  />
                </div>
                <Separator />
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Close form at <span className="text-gray-400 font-normal">(leave blank to keep open)</span>
                  </label>
                  <Input
                    type="datetime-local"
                    className="h-9 text-sm max-w-xs"
                    value={settings.closedAt}
                    onChange={(e) => update("closedAt", e.target.value)}
                  />
                </div>
              </SettingSection>

              {/* Security */}
              <SettingSection title="Security" icon={Shield}>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Password protection <span className="text-gray-400 font-normal">(leave blank to remove)</span>
                  </label>
                  <Input
                    type="password"
                    className="h-9 text-sm max-w-xs"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set a password…"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Respondents will need to enter this password before accessing the form.
                  </p>
                </div>
              </SettingSection>

              {/* Branding */}
              <SettingSection title="Branding" icon={Palette}>
                <SettingRow
                  label="Hide Intake branding"
                  description="Remove 'Powered by Intake' footer"
                >
                  <Switch
                    checked={settings.hideBranding}
                    onCheckedChange={(v) => update("hideBranding", v)}
                  />
                </SettingRow>
                <Separator />
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Primary color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <Input
                      className="h-9 text-sm w-32 font-mono"
                      value={settings.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                    />
                  </div>
                </div>
              </SettingSection>
            </div>

            {/* Bottom save */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}