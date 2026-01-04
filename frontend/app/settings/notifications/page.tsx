"use client";

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';

export default function NotificationsPage() {
  const [productUpdates, setProductUpdates] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between max-w-2xl">
        <div>
          <h3 className="font-medium mb-1">intake* Product Updates</h3>
          <p className="text-sm text-gray-600">
            Receive email updates on what we built, why we built it, and how to use it.
          </p>
        </div>
        <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
      </div>
    </div>
  );
}
