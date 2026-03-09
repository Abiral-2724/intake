"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import {
  ChevronsRight, Menu, Search, Settings, TrendingUp,
  BarChart2, Pencil, Bell, LogOut, User, HelpCircle,
  ChevronDown, Sparkles, Shield, FileText,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "./ui/sidebar";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  const [user, setUser] = useState<any>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) setOpenMobile(!openMobile);
    else setOpen(!open);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  // Derived user info
  const email = user?.email || "";
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.firstName || "";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || "";
  const displayName = fullName || email.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  // Avatar color based on email hash
  const AVATAR_COLORS = [
    "from-blue-500 to-cyan-500",
    "from-violet-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-green-500 to-teal-500",
    "from-indigo-500 to-blue-600",
  ];
  const colorIdx = email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const avatarGradient = AVATAR_COLORS[colorIdx];

  // Form context detection
  const formMatch = pathname.match(/\/forms\/([^/]+)\/(editor|responses|settings|analytics|ai-insights|translate)/);
  const formId = formMatch?.[1];
  const currentTab = formMatch?.[2];

  const formTabs = formId
    ? [
        { id: "editor",      label: "Editor",    icon: Pencil,    href: `/forms/${formId}/editor`      },
        { id: "responses",   label: "Responses", icon: BarChart2, href: `/forms/${formId}/responses`   },
        { id: "settings",    label: "Settings",  icon: Settings,  href: `/forms/${formId}/settings`    },
      ]
    : null;

  return (
    <header className="sticky top-0 z-30 w-full">
      {/* Glass morphism bar */}
      <div className="h-14 flex items-center justify-between px-4 bg-white/90 backdrop-blur-md border-b border-gray-200/80">

        {/* ── Left ── */}
        <div className="flex items-center gap-1.5">
          <a href="/dashboard" className="flex items-center gap-2 mr-1">
            <img
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg"
              alt="Intake"
              className="h-5 w-auto object-contain"
            />
          </a>

          {!isOpen && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 rounded-lg">
                    {isMobile ? <Menu className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Open sidebar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* ── Centre: form tabs ── */}
        {formTabs ? (
          <div className="flex items-center gap-0.5 bg-gray-100/80 rounded-xl p-1 border border-gray-200/60">
            {formTabs.map(tab => {
              const Icon = tab.icon;
              const active = currentTab === tab.id;
              return (
                <button key={tab.id} onClick={() => router.push(tab.href)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    active
                      ? "bg-white text-gray-900 shadow-sm border border-gray-200/80"
                      : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                  )}>
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : (
          /* Breadcrumb for non-form pages */
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <span className="text-gray-700 font-semibold">Intake</span>
            {pathname !== "/dashboard" && (
              <>
                <span className="text-gray-300">/</span>
                <span className="capitalize text-gray-500">
                  {pathname.split("/").filter(Boolean)[0] || "dashboard"}
                </span>
              </>
            )}
          </div>
        )}

        {/* ── Right ── */}
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={0}>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => router.push("/search")}>
                  <Search className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Search</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => router.push("/whats-new")}>
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">What's new</TooltipContent>
            </Tooltip>

          </TooltipProvider>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 mx-1" />

          {/* Profile avatar + dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(v => !v)}
              className={cn(
                "flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-all hover:bg-gray-100 border",
                profileOpen ? "bg-gray-100 border-gray-200" : "border-transparent"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden",
                avatarUrl ? "" : `bg-gradient-to-br ${avatarGradient}`
              )}>
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-semibold text-gray-900 max-w-[96px] truncate">{displayName}</p>
              </div>
              <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform hidden sm:block", profileOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-200/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile header */}
                <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 overflow-hidden",
                    avatarUrl ? "" : `bg-gradient-to-br ${avatarGradient}`
                  )}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{email}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  {[
                    { icon: User,       label: "My profile",       href: "/settings/account" },
                    { icon: Settings,   label: "Account settings",  href: "/settings/account" },
                    { icon: Sparkles,   label: "Upgrade plan",      href: "/upgrade",          accent: true },
                  ].map(item => (
                    <button key={item.label} onClick={() => { router.push(item.href); setProfileOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors text-left",
                        item.accent
                          ? "text-violet-600 hover:bg-violet-50 font-semibold"
                          : "text-gray-700 hover:bg-gray-50 font-medium"
                      )}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-1.5 border-t border-gray-100">
                  {[
                    { icon: HelpCircle, label: "Help centre",   href: "/help"    },
                    { icon: FileText,   label: "Privacy policy", href: "/privacy" },
                    { icon: Shield,     label: "Terms of use",   href: "/terms"   },
                  ].map(item => (
                    <button key={item.label} onClick={() => { router.push(item.href); setProfileOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors font-medium text-left">
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-1.5 border-t border-gray-100">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold text-left">
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};

export default Navbar;