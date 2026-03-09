"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Search,
  Users,
  Globe,
  Settings,
  ArrowUpCircle,
  LayoutTemplate,
  TrendingUp,
  Map,
  Lightbulb,
  Gift,
  Trash2,
  Rocket,
  BookOpen,
  HelpCircle,
  MessageCircle,
  ChevronsLeft,
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  _count: { forms: number };
};

type Form = {
  id: string;
  title: string;
  status: string;
  slug: string;
};

export default function AppContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();

  const [userId, setUserId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(new Set());
  const [workspaceForms, setWorkspaceForms] = useState<Record<string, Form[]>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Load user + workspaces on mount ──────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      try {
        const res = await axios.get(`${API}/workspaces`, {
          headers: { "x-user-id": data.user.id },
        });
        setWorkspaces(res.data.data || []);

        // Auto-expand workspace that matches current URL
        const match = pathname.match(/\/workspaces\/([^/]+)/);
        if (match) {
          setExpandedWorkspaces(new Set([match[1]]));
          fetchFormsForWorkspace(data.user.id, match[1]);
        }
      } catch {}
    });
  }, []);

  const fetchFormsForWorkspace = async (uid: string, workspaceId: string) => {
    try {
      const res = await axios.get(`${API}/workspaces/${workspaceId}/forms`, {
        headers: { "x-user-id": uid },
      });
      setWorkspaceForms((prev) => ({ ...prev, [workspaceId]: res.data.data || [] }));
    } catch {}
  };

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
        if (userId && !workspaceForms[workspaceId]) {
          fetchFormsForWorkspace(userId, workspaceId);
        }
      }
      return next;
    });
  };

  const handleCreateWorkspace = async () => {
    if (!newName.trim() || !newSlug.trim() || !userId) return;
    setCreating(true);
    try {
      const res = await axios.post(
        `${API}/workspaces`,
        { name: newName.trim(), slug: newSlug.trim() },
        { headers: { "x-user-id": userId } }
      );
      setWorkspaces((prev) => [res.data.data, ...prev]);
      setShowCreateDialog(false);
      setNewName("");
      setNewSlug("");
      toast.success("Workspace created!");
      router.push(`/workspaces/${res.data.data.id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateForm = async (workspaceId: string) => {
    if (!userId) return;
    try {
      const res = await axios.post(
        `${API}/workspaces/${workspaceId}/forms`,
        { title: "Untitled form" },
        { headers: { "x-user-id": userId } }
      );
      const newForm = res.data.data;
      setWorkspaceForms((prev) => ({
        ...prev,
        [workspaceId]: [newForm, ...(prev[workspaceId] || [])],
      }));
      router.push(`/forms/${newForm.id}/editor`);
      if (isMobile) setOpenMobile(false);
    } catch {
      toast.error("Failed to create form");
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) setOpenMobile(false);
  };

  const toggleSidebar = () => {
    if (isMobile) setOpenMobile(!openMobile);
    else setOpen(!open);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const handleNameChange = (v: string) => {
    setNewName(v);
    setNewSlug(
      v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 40)
    );
  };

  // ── Nav items ────────────────────────────────────────────────
  const mainItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: Search, label: "Search", href: "/search" },
    { icon: Settings, label: "Settings", href: "/settings/account" },
    { icon: ArrowUpCircle, label: "Upgrade plan", href: "/upgrade", highlight: true },
  ];

  const productItems = [
    { icon: LayoutTemplate, label: "Templates", href: "/templates" },
    { icon: TrendingUp, label: "What's new", href: "/whats-new", badge: "New" },
    { icon: Map, label: "Roadmap", href: "/roadmap" },
    { icon: Lightbulb, label: "Feature requests", href: "/feature-requests" },
    { icon: Gift, label: "Rewards", href: "/rewards" },
    { icon: Trash2, label: "Trash", href: "/trash" },
  ];

  const helpItems = [
    { icon: Rocket, label: "Get started", href: "/get-started" },
    { icon: BookOpen, label: "How-to guides", href: "/guides" },
    { icon: HelpCircle, label: "Help center", href: "/help" },
    { icon: MessageCircle, label: "Contact support", href: "/support" },
  ];

  return (
    <>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleNavigation("/dashboard")}
            >
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">I</span>
              </div>
              <span className="font-semibold text-sm text-gray-900">Intake</span>
            </div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-auto h-7 w-7"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Close sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarHeader>

        <SidebarContent className="overflow-y-auto">
          {/* Main nav */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      className={item.highlight ? "text-purple-600 hover:text-purple-700 hover:bg-purple-50" : ""}
                      onClick={() => handleNavigation(item.href)}
                      isActive={pathname === item.href}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Workspaces */}
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 mb-1">
              <SidebarGroupLabel className="mb-0 pb-0">Workspaces</SidebarGroupLabel>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowCreateDialog(true)}
                      className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">New workspace</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <SidebarGroupContent>
              {workspaces.length === 0 ? (
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create your first workspace
                </button>
              ) : (
                <div className="space-y-0.5">
                  {workspaces.map((ws) => {
                    const isExpanded = expandedWorkspaces.has(ws.id);
                    const isWorkspaceActive = pathname.includes(`/workspaces/${ws.id}`);
                    const forms = workspaceForms[ws.id] || [];

                    return (
                      <div key={ws.id}>
                        {/* Workspace row */}
                        <div
                          className={cn(
                            "group flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
                            isWorkspaceActive ? "bg-gray-100" : "hover:bg-gray-100"
                          )}
                        >
                          <button
                            className="flex items-center gap-1.5 flex-1 min-w-0"
                            onClick={() => {
                              toggleWorkspace(ws.id);
                              handleNavigation(`/workspaces/${ws.id}`);
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            )}
                            <Folder className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            <span className="text-sm text-gray-700 truncate font-medium">
                              {ws.name}
                            </span>
                          </button>
                          {/* New form button inside workspace */}
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateForm(ws.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-all text-gray-500"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right">New form</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>

                        {/* Forms nested under workspace */}
                        {isExpanded && (
                          <div className="ml-5 border-l border-gray-100 pl-2 mt-0.5 space-y-0.5">
                            {forms.length === 0 ? (
                              <button
                                onClick={() => handleCreateForm(ws.id)}
                                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                              >
                                <Plus className="w-3 h-3" /> New form
                              </button>
                            ) : (
                              forms.map((form) => {
                                const isFormActive = pathname.includes(`/forms/${form.id}`);
                                return (
                                  <button
                                    key={form.id}
                                    onClick={() => handleNavigation(`/forms/${form.id}/editor`)}
                                    className={cn(
                                      "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors text-left group/form",
                                      isFormActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    )}
                                  >
                                    <FileText className="w-3 h-3 shrink-0 opacity-60" />
                                    <span className="truncate flex-1">{form.title || "Untitled form"}</span>
                                    <span
                                      className={cn(
                                        "shrink-0 w-1.5 h-1.5 rounded-full",
                                        form.status === "PUBLISHED" ? "bg-green-400" : "bg-gray-300"
                                      )}
                                    />
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Product */}
          <SidebarGroup>
            <SidebarGroupLabel>Product</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {productItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.href)}
                      isActive={pathname === item.href}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Help */}
          <SidebarGroup>
            <SidebarGroupLabel>Help</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {helpItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      onClick={() => handleNavigation(item.href)}
                      isActive={pathname === item.href}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* AI Assistant + Logout */}
          <SidebarGroup className="mt-auto pb-2">
            <div className="px-2 space-y-2">
              <button
                onClick={() => {
                  // Dispatch a custom event that AIAssistant listens to
                  window.dispatchEvent(new CustomEvent("intake:open-assistant"));
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all shadow-sm"
              >
                <Bot className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">AI Assistant</span>
                <span className="ml-auto text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">Ask anything</span>
              </button>
              <Button
                className="text-white bg-blue-950 hover:bg-blue-900 w-full"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Create workspace dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              A workspace holds all your forms. Create one per project or team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Workspace name</label>
              <Input
                placeholder="e.g. Marketing team"
                value={newName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Slug <span className="text-gray-400 font-normal text-xs">(used in URLs)</span>
              </label>
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-200 focus-within:border-blue-400">
                <span className="px-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 h-9 flex items-center shrink-0">
                  intake.io/
                </span>
                <Input
                  className="border-0 focus-visible:ring-0 rounded-none"
                  placeholder="my-workspace"
                  value={newSlug}
                  onChange={(e) =>
                    setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={creating || !newName.trim() || !newSlug.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {creating ? "Creating…" : "Create workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}