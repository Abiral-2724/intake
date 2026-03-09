import { Suspense } from "react";
import NotionSetupPage from "./NotionSetupClient";


export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <NotionSetupPage></NotionSetupPage>
    </Suspense>
  );
}