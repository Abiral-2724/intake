"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, Star, HelpCircle } from 'lucide-react';
import { div } from 'framer-motion/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppContent from '@/components/Sidebar';
import SettingsContent from '@/components/SettingsContent';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'My account', href: '/settings/account' },
    { name: 'Notifications', href: '/settings/notifications' },
    { name: 'API keys', href: '/settings/api-keys' },
    { name: 'Billing', href: '/settings/billing' },
  ];

  return (
    <SidebarProvider>
    <SettingsContent>{children}</SettingsContent>
  </SidebarProvider>
   
  );
}