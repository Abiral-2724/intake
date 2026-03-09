"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingPage from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreHorizontal, FileText, BarChart2, Copy, Trash2,
  ExternalLink, Clock, ChevronRight, Search, Settings, Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Form = {
  id: string; title: string; description?: string; slug: string;
  status: "DRAFT"|"PUBLISHED"|"CLOSED"|"ARCHIVED";
  createdAt: string; updatedAt: string;
  _count: { responses: number; blocks: number };
  settings?: { primaryColor?: string };
};

const STATUS = {
  DRAFT:     { label: "Draft",     dot: "bg-gray-400",   badge: "text-gray-600 bg-gray-100 border-gray-200" },
  PUBLISHED: { label: "Published", dot: "bg-green-500",  badge: "text-green-700 bg-green-50 border-green-200" },
  CLOSED:    { label: "Closed",    dot: "bg-orange-400", badge: "text-orange-700 bg-orange-50 border-orange-200" },
  ARCHIVED:  { label: "Archived",  dot: "bg-gray-300",   badge: "text-gray-500 bg-gray-100 border-gray-200" },
};

// ── Form card exactly matching the screenshot aesthetic ──────────
function FormCard({ form, onDuplicate, onDelete }: { form: Form; onDuplicate:(id:string)=>void; onDelete:(id:string)=>void }) {
  const router = useRouter();
  const s = STATUS[form.status];
  const color = form.settings?.primaryColor || "#2563eb";
  const date = new Date(form.updatedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});

  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => router.push(`/forms/${form.id}/editor`)}
    >
      {/* Color strip preview — mimics a mini form cover */}
      <div className="h-24 w-full relative overflow-hidden" style={{ backgroundColor: `${color}12` }}>
        {/* Decorative lines to suggest form content */}
        <div className="absolute inset-0 flex flex-col justify-center px-5 gap-2 opacity-40">
          <div className="h-2.5 rounded-full w-2/3" style={{ backgroundColor: color }} />
          <div className="h-1.5 rounded-full w-1/2 bg-gray-300" />
          <div className="h-1.5 rounded-full w-3/5 bg-gray-200" />
        </div>
        {/* Status badge top-right */}
        <div className="absolute top-3 right-3">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border", s.badge)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />
            {s.label}
          </span>
        </div>
        {/* Hover overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button className="h-8 px-3 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
            onClick={(e)=>{e.stopPropagation();router.push(`/forms/${form.id}/editor`);}}>
            <FileText className="w-3.5 h-3.5" />Edit
          </button>
          <button className="h-8 px-3 bg-white rounded-lg text-xs font-medium text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5"
            onClick={(e)=>{e.stopPropagation();window.open(`/f/${form.slug}`,"_blank");}}>
            <Eye className="w-3.5 h-3.5" />Preview
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-snug">{form.title || "Untitled form"}</h3>
            {form.description && <p className="text-xs text-gray-400 truncate mt-0.5">{form.description}</p>}
          </div>
          {/* Kebab menu */}
          <div onClick={(e)=>e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 transition-opacity shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={()=>router.push(`/forms/${form.id}/editor`)}><FileText className="w-4 h-4 mr-2"/>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>router.push(`/forms/${form.id}/responses`)}><BarChart2 className="w-4 h-4 mr-2"/>Responses</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>router.push(`/forms/${form.id}/settings`)}><Settings className="w-4 h-4 mr-2"/>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={()=>window.open(`/f/${form.slug}`,"_blank")}><ExternalLink className="w-4 h-4 mr-2"/>Preview</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={()=>onDuplicate(form.id)}><Copy className="w-4 h-4 mr-2"/>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={()=>onDelete(form.id)}><Trash2 className="w-4 h-4 mr-2"/>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5" />
            {form._count.responses} response{form._count.responses!==1?"s":""}
          </span>
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {form._count.blocks} block{form._count.blocks!==1?"s":""}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />{date}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [user, setUser]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [forms, setForms]         = useState<Form[]>([]);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [workspaceName, setWorkspaceName] = useState("My Workspace");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      await fetchData(data.user.id);
      setLoading(false);
    });
  }, [workspaceId]);

  const fetchData = async (uid: string) => {
    try {
      const [formsRes, wsRes] = await Promise.all([
        axios.get(`${API}/workspaces/${workspaceId}/forms`, { headers:{"x-user-id":uid} }),
        axios.get(`${API}/workspaces/${workspaceId}`, { headers:{"x-user-id":uid} }),
      ]);
      setForms(formsRes.data.data || []);
      if (wsRes.data.data?.name) setWorkspaceName(wsRes.data.data.name);
    } catch { toast.error("Failed to load workspace"); }
  };

  const handleCreateForm = async () => {
    try {
      const res = await axios.post(`${API}/workspaces/${workspaceId}/forms`,
        { title: "Untitled form" },
        { headers:{"x-user-id":user.id} });
      router.push(`/forms/${res.data.data.id}/editor`);
    } catch { toast.error("Failed to create form"); }
  };

  const handleDuplicate = async (formId: string) => {
    try {
      await axios.post(`${API}/forms/${formId}/duplicate`, {}, { headers:{"x-user-id":user.id} });
      toast.success("Form duplicated");
      fetchData(user.id);
    } catch { toast.error("Failed to duplicate"); }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/forms/${formId}`, { headers:{"x-user-id":user.id} });
      toast.success("Form deleted");
      setForms((p) => p.filter((f) => f.id !== formId));
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = forms.filter((f) => {
    const q = search.toLowerCase();
    return (statusFilter==="ALL" || f.status===statusFilter) &&
      (f.title.toLowerCase().includes(q) || (f.description||"").toLowerCase().includes(q));
  });

  if (loading) return <LoadingPage />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#fafafa]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-8 py-7 max-w-6xl mx-auto w-full">

            {/* Breadcrumb + New form */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
                  onClick={()=>router.push("/dashboard")}>Dashboard</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-gray-900 font-semibold">{workspaceName}</span>
              </div>
              <Button onClick={handleCreateForm}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm gap-1.5 rounded-lg shadow-sm">
                <Plus className="w-4 h-4" />New form
              </Button>
            </div>

            {/* Filters bar */}
            {forms.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input placeholder="Search forms…" className="pl-9 h-9 text-sm bg-white border-gray-200 rounded-lg"
                    value={search} onChange={(e)=>setSearch(e.target.value)} />
                </div>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 gap-0.5">
                  {["ALL","DRAFT","PUBLISHED","CLOSED"].map((s)=>(
                    <button key={s} onClick={()=>setStatusFilter(s)}
                      className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                        statusFilter===s?"bg-gray-900 text-white shadow-sm":"text-gray-500 hover:text-gray-800")}>
                      {s==="ALL"?"All":STATUS[s as keyof typeof STATUS]?.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400 ml-auto">{filtered.length} form{filtered.length!==1?"s":""}</span>
              </div>
            )}

            {/* Empty state */}
            {forms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-7 w-52">
                  <img src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1767381121/roll-sleeves_cxhlln.png"
                    alt="No forms yet" className="w-full h-auto" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No forms yet</h2>
                <p className="text-gray-500 text-sm mb-6">Roll up your sleeves — it's as easy as 1-2-3.</p>
                <Button onClick={handleCreateForm} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-10 px-6 rounded-xl">
                  <Plus className="w-4 h-4" />New form
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-gray-700 font-medium mb-1">No forms match your search</p>
                <p className="text-sm text-gray-400">Try a different filter or search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* New form card */}
                <button onClick={handleCreateForm}
                  className="h-[168px] bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/40 transition-all group/new">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover/new:bg-blue-100 flex items-center justify-center transition-colors">
                    <Plus className="w-5 h-5 text-gray-400 group-hover/new:text-blue-600 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-400 group-hover/new:text-blue-600 transition-colors">New form</span>
                </button>
                {filtered.map((form)=>(
                  <FormCard key={form.id} form={form} onDuplicate={handleDuplicate} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}