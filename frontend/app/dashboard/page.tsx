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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Folder,
  FileText,
  Users,
  Settings,
  Trash2,
  ChevronRight,
  Edit2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
  _count: { forms: number; members: number };
};

function WorkspaceCard({
  workspace,
  onOpen,
  onDelete,
}: {
  workspace: Workspace;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all duration-150 cursor-pointer"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
            {workspace.logoUrl ? (
              <img src={workspace.logoUrl} className="w-7 h-7 object-contain rounded" alt="" />
            ) : (
              <Folder className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{workspace.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">/{workspace.slug}</p>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onOpen}>
                <Folder className="w-4 h-4 mr-2" /> Open workspace
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {workspace._count.forms} form{workspace._count.forms !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          {workspace._count.members} member{workspace._count.members !== 1 ? "s" : ""}
        </span>
        <span className="ml-auto flex items-center gap-1 text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.replace("/auth");
        return;
      }
      setUser(data.user);
      await fetchWorkspaces(data.user.id);
      setLoading(false);
    });
  }, [router]);

  const fetchWorkspaces = async (userId: string) => {
    try {
      const res = await axios.get(`${API}/workspaces`, {
        headers: { "x-user-id": userId },
      });
      setWorkspaces(res.data.data || []);
    } catch {
      toast.error("Failed to load workspaces");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setCreating(true);
    try {
      const res = await axios.post(
        `${API}/workspaces`,
        { name: newName.trim(), slug: newSlug.trim() },
        { headers: { "x-user-id": user.id } }
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

  const handleDelete = async (workspaceId: string) => {
    if (!confirm("Delete this workspace and all its forms? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/workspaces/${workspaceId}`, {
        headers: { "x-user-id": user.id },
      });
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
      toast.success("Workspace deleted");
    } catch {
      toast.error("Failed to delete workspace");
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (v: string) => {
    setNewName(v);
    setNewSlug(
      v
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .slice(0, 40)
    );
  };

  if (loading) return <LoadingPage />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 max-w-5xl mx-auto w-full">

            {workspaces.length === 0 ? (
              /* ── Empty state ─────────────────────────────── */
              <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center">
                <div className="mb-8 w-full max-w-[220px]">
                  <img
                    src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1767381121/roll-sleeves_cxhlln.png"
                    alt="No workspaces yet"
                    className="w-full h-auto"
                  />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No forms yet</h2>
                <p className="text-gray-500 mb-1">Roll up your sleeves and let's get started.</p>
                <p className="text-gray-500 mb-6">It's as simple as one-two-three.</p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New workspace
                </Button>
              </div>
            ) : (
              /* ── Workspace grid ──────────────────────────── */
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Workspaces</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New workspace
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workspaces.map((ws) => (
                    <WorkspaceCard
                      key={ws.id}
                      workspace={ws}
                      onOpen={() => router.push(`/workspaces/${ws.id}`)}
                      onDelete={() => handleDelete(ws.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Create workspace dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              A workspace holds all your forms. You can create multiple workspaces for different projects or teams.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Workspace name
              </label>
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
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
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
    </SidebarProvider>
  );
}