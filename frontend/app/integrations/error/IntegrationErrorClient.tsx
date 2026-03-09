"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "The authorization request expired or is invalid. Please try again.",
  token_exchange_failed: "We couldn't complete the connection. Please try again.",
  access_denied: "You cancelled the authorization. No changes were made.",
};

export default function IntegrationErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get("reason") || "unknown";
  const message = ERROR_MESSAGES[reason] || "Something went wrong during the connection.";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Connection failed</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <Button onClick={() => router.back()} className="bg-gray-900 hover:bg-gray-800 text-white w-full">
          Go back and try again
        </Button>
      </div>
    </div>
  );
}