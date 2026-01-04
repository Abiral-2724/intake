import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  ChevronsRight,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader,
  useSidebar
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from '@/lib/supabase';

export default function AppContent() {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
  
  const mainItems = [
    { icon: Home, label: 'Home', href: '/dashboard' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Users, label: 'Members', href: '/members' },
    { icon: Globe, label: 'Domains', href: '/domains' },
    { icon: Settings, label: 'Settings', href: '/settings/account' },
    { icon: ArrowUpCircle, label: 'Upgrade plan', href: '/upgrade', highlight: true }
  ];

  const productItems = [
    { icon: LayoutTemplate, label: 'Templates', href: '/templates' },
    { icon: TrendingUp, label: "What's new", href: '/whats-new' },
    { icon: Map, label: 'Roadmap', href: '/roadmap' },
    { icon: Lightbulb, label: 'Feature requests', href: '/feature-requests' },
    { icon: Gift, label: 'Rewards', href: '/rewards' },
    { icon: Trash2, label: 'Trash', href: '/trash' }
  ];

  const helpItems = [
    { icon: Rocket, label: 'Get started', href: '/get-started' },
    { icon: BookOpen, label: 'How-to guides', href: '/guides' },
    { icon: HelpCircle, label: 'Help center', href: '/help' },
    { icon: MessageCircle, label: 'Contact support', href: '/support' }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setOpen(!open);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const isOpen = isMobile ? openMobile : open;

  return (
    <div className="">
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="w-10 h-10 bg-indigo-600 rounded-full mb-2"></div>
              <p className="text-xs text-muted-foreground">
                Click to go back, hold to see history
              </p>
            </div>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={toggleSidebar}
                    className="ml-auto"
                  >
                    <ChevronsLeft className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Close sidebar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton 
                      className={item.highlight ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50' : ''}
                      onClick={() => handleNavigation(item.href)}
                      isActive={pathname === item.href || pathname.startsWith(item.href)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

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
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

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
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
          <Button className='text-white bg-blue-950 border-1' onClick={handleLogout}>
      Logout
     </Button>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

     
    </div>
  );
}