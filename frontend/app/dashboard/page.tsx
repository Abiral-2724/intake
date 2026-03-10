"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingPage from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, MoreHorizontal, Folder, FileText, Users, Trash2,
  ChevronRight, ArrowRight, Sparkles, Zap, BarChart2, Globe,
  Layout, TrendingUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Workspace = {
  id: string; name: string; slug: string; logoUrl?: string;
  createdAt: string; _count: { forms: number; members: number };
};

const FEATURE_CARDS = [
  { icon: Sparkles, grad: "from-violet-500 to-purple-600", bg: "bg-violet-50", text: "text-violet-700", title: "AI Form Builder", desc: "Generate complete forms from a single prompt using Gemini AI.", tag: "AI" },
  { icon: BarChart2, grad: "from-blue-500 to-cyan-500", bg: "bg-blue-50", text: "text-blue-700", title: "Smart Analytics", desc: "Charts, trends and completion rates for every form you build.", tag: "Analytics" },
  { icon: Zap, grad: "from-amber-400 to-orange-500", bg: "bg-amber-50", text: "text-amber-700", title: "Integrations", desc: "Auto-sync responses to Notion and Google Sheets in real time.", tag: "Sync" },
  { icon: Layout, grad: "from-green-500 to-teal-500", bg: "bg-green-50", text: "text-green-700", title: "Multi-page Forms", desc: "Split long forms into pages with per-page validation.", tag: "Forms" },
  { icon: Globe, grad: "from-pink-500 to-rose-500", bg: "bg-pink-50", text: "text-pink-700", title: "Auto-translate", desc: "Translate your entire form to 15+ languages in one click.", tag: "AI" },
  { icon: TrendingUp, grad: "from-indigo-500 to-blue-600", bg: "bg-indigo-50", text: "text-indigo-700", title: "Response Analyser", desc: "Ask questions about your data in plain English.", tag: "AI" },
];

function WorkspaceCard({ workspace, onOpen, onDelete }: { workspace: Workspace; onOpen: () => void; onDelete: () => void }) {
  const initials = workspace.name.slice(0, 2).toUpperCase();
  const COLORS = ["bg-blue-500","bg-violet-500","bg-green-500","bg-amber-500","bg-rose-500","bg-cyan-500"];
  const color = COLORS[workspace.name.charCodeAt(0) % COLORS.length];
  return (
    <div onClick={onOpen} className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold", color)}>
            {workspace.logoUrl ? <img src={workspace.logoUrl} className="w-7 h-7 object-contain rounded" alt="" /> : initials}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{workspace.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">/{workspace.slug}</p>
          </div>
        </div>
        <div onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onOpen}><Folder className="w-4 h-4 mr-2" />Open workspace</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-100">
          <p className="text-xl font-bold text-gray-900 leading-none">{workspace._count.forms}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">Forms</p>
        </div>
        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-100">
          <p className="text-xl font-bold text-gray-900 leading-none">{workspace._count.members}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">Members</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Created {new Date(workspace.createdAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}</p>
        <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Open <ChevronRight className="w-3.5 h-3.5" /></span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      await fetchWorkspaces(data.user.id);
      setLoading(false);
    });
  }, [router]);

  const fetchWorkspaces = async (uid: string) => {
    try { const r = await axios.get(`${API}/workspaces`,{headers:{"x-user-id":uid}}); setWorkspaces(r.data.data||[]); }
    catch { toast.error("Failed to load workspaces"); }
  };

  const handleCreate = async () => {
    if (!newName.trim()||!newSlug.trim()) { toast.error("Name and slug required"); return; }
    setCreating(true);
    try {
      const r = await axios.post(`${API}/workspaces`,{name:newName.trim(),slug:newSlug.trim()},{headers:{"x-user-id":user.id}});
      setWorkspaces(p=>[r.data.data,...p]); setShowCreate(false); setNewName(""); setNewSlug("");
      toast.success("Workspace created!"); router.push(`/workspaces/${r.data.data.id}`);
    } catch(e:any) { toast.error(e.response?.data?.error||"Failed"); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this workspace and all its forms? This cannot be undone.")) return;
    try { await axios.delete(`${API}/workspaces/${id}`,{headers:{"x-user-id":user.id}}); setWorkspaces(p=>p.filter(w=>w.id!==id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  };

  const nameChange = (v: string) => { setNewName(v); setNewSlug(v.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"").slice(0,40)); };
  const firstName = user?.user_metadata?.firstName || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading) return <LoadingPage />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 px-7 py-7 max-w-6xl mx-auto w-full">
            {workspaces.length === 0 ? (
              <div className="min-h-[calc(100vh-9rem)] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden rounded-3xl">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                  <div className="mb-6 relative">
                    <img
                      src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766943528/roll-up-sleeves_qv5yko.png"
                      alt="Ready to build"
                      className="w-64 h-auto mx-auto"
                    />
                  </div>
                  <div>
                  <h1 className="text-5xl font-bold text-gray-900 mb-4">Build your first form in seconds</h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
                      {greeting}, <span className="capitalize font-semibold text-gray-800">{firstName}</span>! Start by creating a workspace —
                      then build unlimited forms, collect responses, and analyse results with AI.
                    </p>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <Plus className="w-5 h-5" /> Create your first workspace
                    </button>
                    <div className="flex flex-wrap gap-2 justify-center mt-8">
                      {["AI form generation", "Notion & Sheets sync", "Smart analytics", "Multi-page forms", "Auto-translate", "Response analyser"].map(f => (
                        <span key={f} className="bg-white border border-gray-200 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">✓ {f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{greeting}, <span className="capitalize">{firstName}</span> 👋</h1>
                    <p className="text-sm text-gray-500 mt-1">{workspaces.reduce((s,w)=>s+w._count.forms,0)} forms across {workspaces.length} workspace{workspaces.length!==1?"s":""}</p>
                  </div>
                  <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 text-sm font-medium">
                    <Plus className="w-4 h-4" /> New workspace
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {label:"Workspaces",value:workspaces.length,icon:Folder,c:"text-blue-600",bg:"bg-blue-50"},
                    {label:"Total forms",value:workspaces.reduce((s,w)=>s+w._count.forms,0),icon:FileText,c:"text-violet-600",bg:"bg-violet-50"},
                    {label:"Team members",value:workspaces.reduce((s,w)=>s+w._count.members,0),icon:Users,c:"text-green-600",bg:"bg-green-50"},
                    {label:"AI features",value:6,icon:Sparkles,c:"text-amber-600",bg:"bg-amber-50"},
                  ].map(s=>(
                    <div key={s.label} className="bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",s.bg)}>
                        <s.icon className={cn("w-4 h-4",s.c)} />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900 leading-none">{s.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Workspaces grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Your workspaces</h2>
                    <span className="text-xs text-gray-400">{workspaces.length} total</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {workspaces.map(ws=>(
                      <WorkspaceCard key={ws.id} workspace={ws} onOpen={()=>router.push(`/workspaces/${ws.id}`)} onDelete={()=>handleDelete(ws.id)} />
                    ))}
                    <button onClick={()=>setShowCreate(true)} className="border-2 border-dashed border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-gray-400 hover:text-blue-500 min-h-[160px] group">
                      <div className="w-10 h-10 rounded-xl border-2 border-dashed border-current flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                      <p className="text-sm font-semibold">New workspace</p>
                    </button>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Platform features</h2>
                    <button onClick={()=>router.push("/roadmap")} className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">View roadmap <ArrowRight className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FEATURE_CARDS.map(f=>(
                      <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br",f.grad)}>
                            <f.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",f.bg,f.text)}>{f.tag}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">{f.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA footer */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-white font-semibold">Need help getting started?</p>
                    <p className="text-gray-400 text-sm mt-0.5">Browse the help centre or explore the product roadmap</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={()=>router.push("/help")} className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/10">Help centre</button>
                    <button onClick={()=>router.push("/roadmap")} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">View roadmap →</button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>A workspace holds all your forms. Create multiple for different projects or teams.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace name</label>
              <Input placeholder="e.g. Marketing team" value={newName} onChange={e=>nameChange(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCreate()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Slug <span className="text-gray-400 font-normal text-xs">(used in URLs)</span></label>
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400">
                <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 h-9 flex items-center shrink-0">intake.io/</span>
                <Input className="border-0 focus-visible:ring-0 rounded-none" placeholder="my-workspace" value={newSlug} onChange={e=>setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))} onKeyDown={e=>e.key==="Enter"&&handleCreate()} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating||!newName.trim()||!newSlug.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">{creating?"Creating…":"Create workspace"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}