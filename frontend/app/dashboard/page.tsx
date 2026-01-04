"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import LoadingPage from "@/components/LoadingPage";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasForms, setHasForms] = useState(false); // Set to false to show empty state

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth");
      } else {
        setUser(data.user);
        console.log("dashboard data", data.user);
        // Add your logic here to check if user has forms
        // setHasForms(true/false based on your data)
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth");
  };

  const handleNewForm = () => {
    // Add your navigation logic here
    console.log("Create new form");
  };

  if (loading) return <LoadingPage />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppContent />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 flex items-center justify-center p-4 mt-[-30px]">
            {!hasForms ? (
              <div className="flex flex-col items-center justify-center max-w-md text-center">
                {/* Empty State Illustration */}
                <div className="mb-8 w-full max-w-xs">
                  <img
                    src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1767381121/roll-sleeves_cxhlln.png"
                    alt="No forms yet"
                    className="w-full h-auto"
                  />
                </div>

                {/* Empty State Content */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  No forms yet
                </h2>
                <p className="text-gray-600 mb-2">
                  Roll up your sleeves and let's get started.
                </p>
                <p className="text-gray-600 mb-6">
                  It's as simple as one-two-three.
                </p>

                {/* CTA Button */}
                <Button
                  onClick={handleNewForm}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New form
                </Button>
              </div>
            ) : (
              // Your existing dashboard content when user has forms
              <div className="w-full">
                {/* Your forms list/grid goes here */}
                <p>Dashboard content with forms</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}