import { Suspense } from "react";
import IntegrationErrorClient from "./IntegrationErrorClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
      <IntegrationErrorClient />
    </Suspense>
  );
}