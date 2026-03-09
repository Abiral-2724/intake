"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home, Search, Users, Globe, Settings, ArrowUpCircle,
  LayoutTemplate, TrendingUp, Map, Lightbulb, Gift, Trash2,
  Rocket, BookOpen, HelpCircle, MessageCircle, ChevronsLeft,
  Folder, Plus, ChevronRight, ChevronDown, FileText, Bot, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Workspace = { id: string; name: string; slug: string; _count: { forms: number } };
type Form      = { id: string; title: string; status: string; slug: string };

export default function AppContent() {
  const router   = useRouter();
  const pathname = usePathname();
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();

  const [userId, setUserId]       = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());
  const [wsForms, setWsForms]     = useState<Record<string, Form[]>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]     = useState("");
  const [newSlug, setNewSlug]     = useState("");
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      try {
        const res = await axios.get(`${API}/workspaces`, { headers: { "x-user-id": data.user.id } });
        setWorkspaces(res.data.data || []);
        const match = pathname.match(/\/workspaces\/([^/]+)/);
        if (match) {
          setExpanded(new Set([match[1]]));
          fetchForms(data.user.id, match[1]);
        }
      } catch {}
    });
  }, []);

  const fetchForms = async (uid: string, wsId: string) => {
    try {
      const r = await axios.get(`${API}/workspaces/${wsId}/forms`, { headers: { "x-user-id": uid } });
      setWsForms(p => ({ ...p, [wsId]: r.data.data || [] }));
    } catch {}
  };

  const toggleWs = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); if (userId && !wsForms[id]) fetchForms(userId, id); }
      return next;
    });
  };

  const handleCreateWs = async () => {
    if (!newName.trim() || !newSlug.trim() || !userId) return;
    setCreating(true);
    try {
      const r = await axios.post(`${API}/workspaces`, { name: newName.trim(), slug: newSlug.trim() }, { headers: { "x-user-id": userId } });
      setWorkspaces(p => [r.data.data, ...p]);
      setShowCreate(false); setNewName(""); setNewSlug("");
      toast.success("Workspace created!");
      router.push(`/workspaces/${r.data.data.id}`);
    } catch (e: any) { toast.error(e.response?.data?.error || "Failed"); }
    finally { setCreating(false); }
  };

  const handleCreateForm = async (wsId: string) => {
    if (!userId) return;
    try {
      const r = await axios.post(`${API}/workspaces/${wsId}/forms`, { title: "Untitled form" }, { headers: { "x-user-id": userId } });
      const f = r.data.data;
      setWsForms(p => ({ ...p, [wsId]: [f, ...(p[wsId] || [])] }));
      router.push(`/forms/${f.id}/editor`);
      if (isMobile) setOpenMobile(false);
    } catch { toast.error("Failed to create form"); }
  };

  const nav = (href: string) => { router.push(href); if (isMobile) setOpenMobile(false); };
  const toggleSidebar = () => { if (isMobile) setOpenMobile(!openMobile); else setOpen(!open); };
  const nameChange = (v: string) => { setNewName(v); setNewSlug(v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)); };

  const WS_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500","bg-cyan-500","bg-indigo-500","bg-pink-500"];

  const mainItems = [
    { icon: Home,          label: "Home",         href: "/dashboard" },
    { icon: Search,        label: "Search",       href: "/search"    },
    { icon: Settings,      label: "Settings",     href: "/settings/account" },
  ];

  const productItems = [
    { icon: LayoutTemplate, label: "Templates",        href: "/templates",        badge: null },
    { icon: TrendingUp,     label: "What's new",       href: "/whats-new",        badge: "New" },
    { icon: Map,            label: "Roadmap",           href: "/roadmap",          badge: null },
    { icon: Lightbulb,      label: "Feature requests", href: "/feature-requests", badge: null },
    { icon: Gift,           label: "Rewards",           href: "/rewards",          badge: null },
    { icon: Trash2,         label: "Trash",             href: "/trash",            badge: null },
  ];

  const helpItems = [
    { icon: Rocket,        label: "Get started",    href: "/get-started" },
    { icon: BookOpen,      label: "Help centre",    href: "/help"        },
    { icon: MessageCircle, label: "Contact support",href: "/support"     },
  ];

  return (
    <>
      <Sidebar className="border-r border-gray-200/80">
        {/* ── Header ── */}
        <SidebarHeader className="border-b border-gray-200/60 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <button onClick={() => nav("/dashboard")} className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-blue-200 transition-shadow">
                <span className="text-white text-xs font-black tracking-tight">I</span>
              </div>
              <span className="font-bold text-sm text-gray-900 tracking-tight">Intake</span>
            </button>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-7 w-7 rounded-lg text-gray-400 hover:text-gray-600">
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Close sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto scrollbar-thin">

          {/* ── Main nav ── */}
          <SidebarGroup className="pt-3">
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map(item => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton onClick={() => nav(item.href)} isActive={pathname === item.href}
                      className="rounded-xl h-8 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                {/* Upgrade - special */}
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => nav("/upgrade")}
                    className="rounded-xl h-8 text-[13px] font-semibold text-violet-600 hover:bg-violet-50 hover:text-violet-700">
                    <Sparkles className="w-4 h-4" />
                    <span>Upgrade plan</span>
                    <span className="ml-auto text-[9px] font-black bg-gradient-to-r from-violet-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full">PRO</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* ── Workspaces ── */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 mb-1.5">
              <SidebarGroupLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0 pb-0">Workspaces</SidebarGroupLabel>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setShowCreate(true)}
                      className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">New workspace</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SidebarGroupContent>
              {workspaces.length === 0 ? (
                <button onClick={() => setShowCreate(true)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  <div className="w-5 h-5 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                    <Plus className="w-3 h-3" />
                  </div>
                  Create first workspace
                </button>
              ) : (
                <div className="space-y-0.5">
                  {workspaces.map(ws => {
                    const isExpanded   = expanded.has(ws.id);
                    const isActive     = pathname.includes(`/workspaces/${ws.id}`);
                    const forms        = wsForms[ws.id] || [];
                    const color        = WS_COLORS[ws.name.charCodeAt(0) % WS_COLORS.length];
                    const initials     = ws.name.slice(0, 2).toUpperCase();

                    return (
                      <div key={ws.id}>
                        <div className={cn(
                          "group flex items-center gap-1.5 px-2 py-1.5 rounded-xl cursor-pointer transition-colors",
                          isActive ? "bg-gray-100" : "hover:bg-gray-50"
                        )}>
                          <button className="flex items-center gap-2 flex-1 min-w-0"
                            onClick={() => { toggleWs(ws.id); nav(`/workspaces/${ws.id}`); }}>
                            <ChevronRight className={cn("w-3 h-3 text-gray-300 shrink-0 transition-transform", isExpanded && "rotate-90")} />
                            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center text-white text-[9px] font-black shrink-0", color)}>
                              {initials}
                            </div>
                            <span className="text-[13px] text-gray-700 truncate font-medium">{ws.name}</span>
                            <span className="ml-auto text-[10px] text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {ws._count.forms}
                            </span>
                          </button>
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={e => { e.stopPropagation(); handleCreateForm(ws.id); }}
                                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-all">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right">New form</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {isExpanded && (
                          <div className="ml-4 border-l-2 border-gray-100 pl-2 mt-0.5 space-y-0.5 pb-1">
                            {forms.length === 0 ? (
                              <button onClick={() => handleCreateForm(ws.id)}
                                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <Plus className="w-3 h-3" /> New form
                              </button>
                            ) : forms.map(form => {
                              const isFormActive = pathname.includes(`/forms/${form.id}`);
                              return (
                                <button key={form.id} onClick={() => nav(`/forms/${form.id}/editor`)}
                                  className={cn(
                                    "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] transition-colors text-left",
                                    isFormActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                  )}>
                                  <FileText className="w-3 h-3 shrink-0 opacity-60" />
                                  <span className="truncate flex-1">{form.title || "Untitled"}</span>
                                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", form.status === "PUBLISHED" ? "bg-green-400" : "bg-gray-300")} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          {/* ── Product ── */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {productItems.map(item => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton onClick={() => nav(item.href)} isActive={pathname === item.href}
                      className="rounded-xl h-8 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700">
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full leading-none">{item.badge}</span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* ── Help ── */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {helpItems.map(item => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton onClick={() => nav(item.href)} isActive={pathname === item.href}
                      className="rounded-xl h-8 text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700">
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* ── AI Assistant ── */}
          <SidebarGroup className="mt-auto pb-3">
            <div className="px-2">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("intake:open-assistant"))}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transition-all shadow-sm hover:shadow-blue-200 hover:shadow-md group"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-none">AI Assistant</p>
                  <p className="text-[10px] text-blue-200 mt-0.5">Ask anything</p>
                </div>
                <span className="text-[9px] font-black bg-white/20 border border-white/20 text-white px-1.5 py-0.5 rounded-full shrink-0">✨ AI</span>
              </button>
            </div>
          </SidebarGroup>

        </SidebarContent>
      </Sidebar>

      {/* Create workspace dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>A workspace holds all your forms. Create one per project or team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace name</label>
              <Input placeholder="e.g. Marketing team" value={newName} onChange={e => nameChange(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCreateWs()} autoFocus />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Slug <span className="text-gray-400 font-normal text-xs">(used in URLs)</span></label>
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400">
                <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 h-9 flex items-center shrink-0">intake.io/</span>
                <Input className="border-0 focus-visible:ring-0 rounded-none" placeholder="my-workspace"
                  value={newSlug} onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  onKeyDown={e => e.key === "Enter" && handleCreateWs()} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateWs} disabled={creating || !newName.trim() || !newSlug.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {creating ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}