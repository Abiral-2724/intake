"use client";
import { useRouter } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppContent from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { ArrowLeft, FileText } from "lucide-react";

const SECTIONS = [
  { title: "1. Acceptance of terms", content: `By creating an account or using intake in any way, you agree to be bound by these Terms of Use. If you do not agree to these terms, you may not use the service.

These terms apply to all users of intake, including form creators (owners, editors) and form respondents. We reserve the right to update these terms at any time. Material changes will be communicated via email or in-app notification.` },

  { title: "2. Description of service", content: `intake is a web-based form builder that allows users to create forms, collect responses, analyse data, and integrate with third-party tools. The service includes AI-powered features powered by Google Gemini.

We reserve the right to modify, suspend, or discontinue any part of the service at any time. We will provide reasonable notice for significant changes.` },

  { title: "3. Account registration", content: `You must create an account to use intake. You are responsible for:

- Providing accurate and complete registration information
- Maintaining the security of your account credentials
- All activity that occurs under your account
- Notifying us immediately of any unauthorised access at security@intake.io

You must be at least 13 years old to create an account. Accounts are personal and may not be shared or transferred.` },

  { title: "4. Acceptable use", content: `You agree to use intake only for lawful purposes. You may not use the service to:

- Collect information through deceptive means or without proper consent from respondents
- Create forms that violate any applicable laws, including data protection laws (GDPR, CCPA, etc.)
- Distribute spam, phishing content, or malicious material
- Impersonate any person, organisation, or brand
- Attempt to gain unauthorised access to any part of the service
- Use the AI features to generate harmful, illegal, or misleading content
- Collect sensitive personal data (health, financial, biometric) without explicit consent and appropriate safeguards
- Use automated bots to submit fake form responses

We reserve the right to suspend or terminate accounts that violate these rules without notice.` },

  { title: "5. Your content", content: `You retain ownership of all forms, content, and data you create in intake ("Your Content"). By using the service, you grant us a limited, non-exclusive, royalty-free licence to store and process Your Content solely to provide the service to you.

You are solely responsible for Your Content and the information you collect from respondents through your forms. You represent that:

- You have all necessary rights and consents to collect the information in your forms
- Your forms comply with applicable privacy laws in your jurisdiction
- You will maintain an appropriate privacy policy for respondents if required by law` },

  { title: "6. Respondent data and privacy", content: `As a form creator, you act as the data controller for information submitted through your forms. intake acts as a data processor on your behalf.

You are responsible for:
- Informing respondents about how their data will be used
- Obtaining any necessary consents under applicable law
- Responding to respondent requests for access, correction, or deletion
- Complying with data protection laws that apply in your jurisdiction (GDPR, CCPA, etc.)

We will assist with respondent requests to the extent technically possible when contacted at privacy@intake.io.` },

  { title: "7. AI features", content: `intake's AI features (form generation, response analysis, translation, block suggestions) are powered by Google Gemini. By using these features:

- You accept Google's Gemini API usage policies
- You understand that your prompts and relevant data are sent to Google's API to generate responses
- You are responsible for reviewing AI-generated content before publishing or relying on it
- You may not use AI features to generate illegal, harmful, defamatory, or deceptive content

AI-generated outputs may contain errors. We make no guarantees about accuracy.` },

  { title: "8. Integrations", content: `intake allows connection to third-party services including Notion and Google Sheets. When you connect an integration:

- You authorise intake to access and write data to the connected service on your behalf
- The third-party service's own terms and privacy policies apply
- You are responsible for ensuring your use of the integration complies with applicable laws
- We are not responsible for outages, errors, or data loss caused by third-party services

You may disconnect integrations at any time from the Integrations panel in your form's Responses page.` },

  { title: "9. Intellectual property", content: `intake and all associated software, designs, trademarks, and content are owned by or licensed to us. Nothing in these terms grants you any right to use our name, logo, or branding.

You may not copy, modify, distribute, sell, or reverse-engineer any part of the intake service without our written permission, except as permitted by applicable law.` },

  { title: "10. Disclaimer of warranties", content: `intake is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the service will be uninterrupted, error-free, or free of harmful components.

To the maximum extent permitted by law, we disclaim all implied warranties including merchantability, fitness for a particular purpose, and non-infringement.` },

  { title: "11. Limitation of liability", content: `To the maximum extent permitted by law, intake shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, revenue, or profits, arising from your use of or inability to use the service.

Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim, or £100, whichever is greater.` },

  { title: "12. Termination", content: `You may terminate your account at any time by deleting it from settings. Upon termination, your data will be deleted within 30 days.

We may terminate or suspend your account immediately if you breach these terms, engage in fraudulent activity, or if required by law. We will give reasonable notice where possible.` },

  { title: "13. Governing law", content: `These terms are governed by the laws of England and Wales. Any disputes shall be resolved in the courts of England and Wales, unless mandatory consumer protection laws in your jurisdiction provide otherwise.` },

  { title: "14. Contact", content: `For questions about these Terms of Use:\n\nEmail: legal@intake.io\nSupport: intake.io/support` },
];

function renderContent(text: string) {
  return text.split("\n\n").map((para, i) => {
    const formatted = para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/- (.*)/g, "• $1");
    return <p key={i} className="text-sm text-gray-600 leading-relaxed mb-3 last:mb-0 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

export default function TermsPage() {
  const router = useRouter();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#f8f9fb]">
        <AppContent />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 max-w-3xl mx-auto w-full px-7 py-8">

            <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Terms of Use</h1>
                <p className="text-xs text-gray-400 mt-0.5">Last updated: 1 March 2025 · Effective: 1 March 2025</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-8 mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
              Please read these Terms of Use carefully before using intake. By accessing or using the service, you agree to be bound by these terms. These terms constitute a legal agreement between you and intake.
            </p>

            <div className="space-y-4">
              {SECTIONS.map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-base font-bold text-gray-900 mb-4">{s.title}</h2>
                  {renderContent(s.content)}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400 mt-8">
              © {new Date().getFullYear()} intake. All rights reserved. · <button onClick={() => router.push("/privacy")} className="underline hover:text-gray-600">Privacy Policy</button>
            </p>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}