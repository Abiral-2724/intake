"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold">intake* plan</h3>
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
            Free
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Upgrade to access advanced features designed for growing teams and creators.
        </p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Upgrade plan
        </Button>
      </div>
    </div>
  );
}