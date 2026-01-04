import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Button } from './ui/button'
import { ChevronsRight, Menu, Search, Settings, TrendingUp } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { useSidebar } from './ui/sidebar'

type Props = {}

const Navbar = (props: Props) => {
    const router = useRouter();
    const { open, setOpen, openMobile, setOpenMobile, isMobile } = useSidebar();
    const isOpen = isMobile ? openMobile : open;

    const toggleSidebar = () => {
        if (isMobile) {
          setOpenMobile(!openMobile);
        } else {
          setOpen(!open);
        }
      };
    

  return (
    <div className="flex-1 flex flex-col">
    {/* Navbar */}
    <header className="sticky top-0 z-10 border-b bg-background">
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
                <TooltipContent side="bottom">
                  Open sidebar
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => router.push('/search')}>
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Search</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => router.push('/whats-new')}>
                  <TrendingUp className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">What's new</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => router.push('/settings/account')}>
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

      </div>
    </header>

    {/* Main Content Area
    <main className="flex-1 overflow-y-auto p-6 bg-background">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          This is a responsive sidebar and navbar implementation using shadcn Sidebar components.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="p-6 border rounded-lg hover:shadow-md transition-shadow bg-card">
              <h3 className="font-semibold mb-2">Card {item}</h3>
              <p className="text-sm text-muted-foreground">Sample content for demonstration</p>
            </div>
          ))}
        </div>
      </div>
    </main> */}
  </div>
  )
}

export default Navbar