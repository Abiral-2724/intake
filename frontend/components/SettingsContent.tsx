"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, HelpCircle, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import AppContent from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SettingsContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setOpen(!open);
    }
  };

  const tabs = [
    { name: 'My account', href: '/settings/account' },
    { name: 'Notifications', href: '/settings/notifications' },
    { name: 'API keys', href: '/settings/api-keys' },
    { name: 'Billing', href: '/settings/billing' },
  ];

  return (
    <div className="flex min-h-screen w-full">
      <AppContent />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Toggle Sidebar Button */}
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
                  <TooltipContent side="bottom">
                    Open sidebar
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <a href="/dashboard">
              <img
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg"
                alt="Logo"
                className="h-5 w-auto object-contain"
              />
            </a>
            <span className="text-gray-400">
            <ChevronsRight className="w-6 h-6" />
            </span>
            <span className="text-gray-900 text-sm">Settings</span>
          </div>
          <div className="flex items-center gap-2 cursor-pointer">
            <Search className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700 text-sm">Search</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            {/* Tab Navigation */}
            <div className="border-b mb-8">
              <nav className="flex gap-8">
                {tabs.map((tab) => (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`pb-4 border-b-2 transition-colors ${
                      pathname === tab.href
                        ? 'border-black text-black font-medium'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </main>

        {/* Help Button */}
        <button className="fixed bottom-6 right-6 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
          <HelpCircle className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
