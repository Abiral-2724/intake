"use client";

import React from 'react';
import { Button } from '@/components/ui/button';

export default function APIKeysPage() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No API keys configured yet.</p>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          Create API Key
        </Button>
      </div>
    </div>
  );
}