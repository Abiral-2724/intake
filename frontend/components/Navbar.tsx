"use client";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import {
  ChevronsRight,
  Menu,
  Search,
  Settings,
  TrendingUp,
  BarChart2,
  Eye,
  Pencil,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "./ui/sidebar";

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  const toggleSidebar = () => {
    if (isMobile) setOpenMobile(!openMobile);
    else setOpen(!open);
  };

  // Detect if we're inside a form context to show contextual nav tabs
  const formMatch = pathname.match(/\/forms\/([^/]+)\/(editor|responses|settings)/);
  const formId = formMatch?.[1];
  const currentTab = formMatch?.[2];

  const formTabs = formId
    ? [
        { id: "editor", label: "Editor", icon: Pencil, href: `/forms/${formId}/editor` },
        { id: "responses", label: "Responses", icon: BarChart2, href: `/forms/${formId}/responses` },
        { id: "settings", label: "Settings", icon: Settings, href: `/forms/${formId}/settings` },
      ]
    : null;

  return (
    <header className="sticky top-0 z-10 border-b bg-white w-full">
        <div className="flex h-14 items-center justify-between px-4">

          {/* Left: Logo + Toggle */}
          <div className="flex items-center gap-2">
            <a href="/dashboard">
              <img
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg"
                alt="Logo"
                className="h-5 w-auto object-contain"
              />
            </a>

            {!isOpen && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSidebar}
                      className="h-8 w-8"
                    >
                      {isMobile ? (
                        <Menu className="h-5 w-5" />
                      ) : (
                        <ChevronsRight className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Open sidebar</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Center: Form context tabs */}
          {formTabs && (
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {formTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => router.push(tab.href)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push("/search")}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Search</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push("/whats-new")}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">What's new</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => router.push("/settings/account")}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

        </div>
      </header>
  );
};

export default Navbar;