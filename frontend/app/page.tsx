import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Command, Lock,
  Sparkles, Brain, BarChart2, Languages, Lightbulb,
  MousePointerClick, Star, AlignLeft, ToggleLeft,
  Calendar, Mail, Upload, Hash, ChevronDown, CheckSquare,
} from 'lucide-react';
import TestimonialsSection from '@/components/testimonials';
import { FAQSection } from '@/components/FAQSection';
import { Footer } from '@/components/Footer';
import { BankingScaleHero } from '@/components/ScaleHero';
import { img } from 'framer-motion/client';
// import { IntegrationIcon } from '@/components/IntegrationIcon';

// ── Integrations ─────────────────────────────────────────────────
// Using publicly available CDN logos
const integrations = [
  {
    name: "Notion",
    description: "Send submissions to a Notion database automatically.",
    icon: "https://res.cloudinary.com/dci6nuwrm/image/upload/v1773051092/icons8-notion-64_gb39hv.png",
  },
  {
    name: "Google Sheets",
    description: "Sync every response to a spreadsheet in real time.",
    icon: "https://res.cloudinary.com/dci6nuwrm/image/upload/v1773051290/icons8-google-sheets-48_gcqjeh.png",
  },
];

// ── AI features — Intake's actual AI capabilities ─────────────────
const aiFeatures = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI Form Generator",
    items: [
      "Describe your form in plain English",
      "Gemini builds the whole form instantly",
      "Full form with questions & options",
    ],
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: "AI Assistant",
    items: [
      "Chat with an AI about your form",
      "Get writing and structure suggestions",
      "Ask anything about your responses",
    ],
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: "Smart Insights",
    items: [
      "Auto-analyse all your responses",
      "Sentiment analysis & key themes",
      "Instant summary of hundreds of replies",
    ],
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Block Suggestions",
    items: [
      "AI recommends missing questions",
      "Tailored to your existing form",
      "Add suggestions with one click",
    ],
  },
  {
    icon: <Languages className="w-6 h-6" />,
    title: "Auto-Translate",
    items: [
      "Translate your form to any language",
      "Preview before applying",
      "Reach a global audience instantly",
    ],
  },
  {
    icon: <MousePointerClick className="w-6 h-6" />,
    title: "Question Types",
    items: [
      "16+ block types supported",
      "Ratings, scales, file uploads & more",
      "Multi-page forms with logic",
    ],
  },
];

export default function IntakeLandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">

      {/* ── Navigation ── */}
      <nav className="flex items-center justify-between px-12 py-5">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 600 160">
              <text x="40" y="110" fill="#000000" fontSize="104" fontWeight="700"
                letterSpacing="-4" fontFamily="Arial, Helvetica, sans-serif">
                intake
              </text>
            </svg>
            {/* <img
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg"
              alt=""
              className="w-2.5 h-2.5 mt-3 ml-[-74px]"
            /> */}
          </h1>
        </div>
        <div className="flex items-center gap-8">
          
          <Button className="text-white">
            <a href="/auth" className="text-sm font-medium">Log in</a>
          </Button>
          <Button className="text-white">
            <a href="/auth" className="text-sm font-medium">Sign up free</a>
          </Button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen bg-gray-50 px-8 pt-12 pb-24 overflow-hidden">
        <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[800px] h-[250px]">
          <img src="https://tally.so/images/demo/v2/faces-mobile.png" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center pt-60">
          <h1 className="text-7xl leading-tight font-bold mb-6 tracking-tight">
            The{" "}
            <span className="relative inline-block">
              smartest
              <img
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766922864/title-highlight-2_fk9bq6.png"
                alt=""
                className="absolute left-0 right-0 -bottom-2 w-[90%] ml-3 h-3 object-fill"
              />
            </span>{" "}
            way to build forms
          </h1>
          <p className="text-xl text-gray-950 mb-5 leading-relaxed max-w-3xl mx-auto">
            Say goodbye to boring forms. Meet Intake — the AI-powered,<br />
            free form builder that does the heavy lifting for you.
          </p>
          <a href="/auth">
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-sm font-medium shadow-lg transition-colors inline-flex items-center gap-2">
              Create a free form <ArrowRight className="h-5 w-5" />
            </button>
          </a>
        </div>
      </section>

      {/* ── Product video ── */}
      <section className="relative px-8 py-16 pb-32 mt-[-330px] mb-10">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6 mb-[-120px] relative z-10">
            <div className="flex gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <div className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <video className="w-full" autoPlay loop muted playsInline>
                <source src="https://res.cloudinary.com/dci6nuwrm/video/upload/v1766922650/intro_mi5d3n.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* ── "A form builder powered by AI" ── */}
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <div className="mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              A form builder powered by AI
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl">
              Intake makes it simple for anyone to build beautiful online forms. Describe what you need
              and let Gemini AI generate the whole form for you — or build it block by block, just like a doc.
            </p>
          </div>

          {/* Pink highlight card */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-pink-200 p-6 sm:pl-10 md:pl-14 sm:pt-8 md:pt-10 sm:pr-6 md:pr-8 pb-0 bg-gradient-to-br from-pink-50 to-white overflow-hidden">
            <div className="relative z-10 max-w-3xl mb-4 sm:mb-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600 mb-2 sm:mb-3">
                Unlimited forms and responses — always free
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-800 mb-4 sm:mb-0">
                No paywalls. No submission limits. Intake gives you unlimited forms and responses for
                free so you can focus on collecting answers, not counting them.{" "}
                <a href="/pricing" className="underline hover:text-pink-600 transition">See what's included</a>.
              </p>
            </div>
            <div className="relative">
              <img src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766937242/dive-in_nzwydi.png" alt="" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-24">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-[-40px] sm:mt-[-60px] md:mt-[-70px]">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Command className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Generate with AI or just start typing
              </h3>
              <p className="text-gray-700 text-base sm:text-lg mb-6 sm:mb-8">
                Describe your form in plain English and Intake's Gemini AI builds it instantly.
                Or type questions block by block — just like writing in a doc. Either way, you're done in seconds.
              </p>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1 text-gray-600">
                  <span className="text-sm font-mono">/phone</span>
                </div>
                <video autoPlay loop muted playsInline className="w-full rounded-lg">
                  <source src="https://res.cloudinary.com/dci6nuwrm/video/upload/v1766937274/just-type-card_vrgckn.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
            <div className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                  <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Your data, always secure
                </h3>
                <p className="text-gray-700 text-base sm:text-lg mb-4 sm:mb-6">
                  Privacy is built in, not bolted on. Intake is{" "}
                  <span className="font-semibold">GDPR-compliant</span> and treats your
                  respondents' data with the care it deserves.
                </p>
                <p className="text-gray-700 text-base sm:text-lg">
                  All form data is <span className="font-semibold">encrypted in transit and at rest</span>.
                  We never sell your data or use it to train AI models.{" "}
                  <a href="/privacy" className="underline hover:text-pink-600 transition">Read our privacy policy</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scale hero ── */}
      <BankingScaleHero />

      {/* ── Integrations ── */}
      <div className="bg-white px-4 md:px-8 py-16 md:py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">

          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-16">
            <div className="flex-1 max-w-xl">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
                Connect your{" "}
                <span className="relative inline-block">
                  favorite tools
                  <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-pink-500 rounded-full" />
                </span>
              </h2>
              <p className="text-lg text-gray-600 mt-5 leading-relaxed">
                Save time using popular integrations to sync<br />
                your form submissions automatically.
              </p>
            </div>
            <div className="flex-shrink-0">
              <img
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766941371/designed-for-you_gnpovs.png"
                alt=""
                className="h-40 w-auto object-contain opacity-75"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-12 max-w-lg">
            {integrations.map((integration, index) => (
              <div key={index} className="flex flex-col gap-3">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  {integration.icon ? (
                    <img src={integration.icon}></img>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 grid grid-cols-2 gap-1 p-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-indigo-400 rounded-sm" />
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="font-bold text-gray-900">{integration.name}.</span>{" "}
                  {integration.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14">
            <a href="/auth">
              <button className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors inline-flex items-center gap-2 text-sm">
                Start integrating <ArrowRight className="w-4 h-4" />
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* ── AI Features (replaces "Built for everyone" categories) ── */}
      <div className="bg-gradient-to-br from-gray-50 to-white px-4 md:px-8 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-10">
            <div className="flex-1 max-w-xl">
              <h1 className="relative text-4xl md:text-5xl font-bold text-gray-900 mb-4 inline-block">
                AI built for forms
                <img
                  src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766941370/title-highlight-3_eomnxw.png"
                  alt=""
                  className="absolute -bottom-2 left-16 w-20 pointer-events-none select-none"
                />
              </h1>
              <p className="text-sm md:text-lg text-gray-600 leading-relaxed mt-2">
                Five Gemini-powered features baked directly into<br className="hidden sm:block" />
                your workspace — no extra setup needed.
              </p>
            </div>
            <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
              <img
                src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766941371/designed-for-you_gnpovs.png"
                alt="AI features illustration"
                className="h-44 md:h-60 w-auto object-contain"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mb-8">
              {aiFeatures.map((feature, index) => (
                <div key={index} className="space-y-2">
                  <div className="text-pink-500">{feature.icon}</div>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <ul className="space-y-2">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-600 text-sm leading-relaxed">· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex justify-start">
              <a href="/auth">
                <button className="bg-blue-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center gap-2">
                  Try all AI features free <ArrowRight className="w-4 h-4" />
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Final CTA ── */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="mb-12 relative">
            <img
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766943528/roll-up-sleeves_qv5yko.png"
              alt="Ready to build"
              className="w-120 h-auto mx-auto"
            />
          </div>
          <div className="mt-20">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Build your first form in seconds</h1>
            <p className="text-2xl text-gray-900 mb-10 max-w-2xl mx-auto">
              It's as simple as one-two-three, and the best part?<br />
              It's completely free — no credit card required.
            </p>
            <a href="/auth">
              <button className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-3 rounded-lg inline-flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Create a free form <ArrowRight className="w-5 h-5" />
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* ── Testimonials ── */}
      <div className="pl-30 pr-30 pt-3 mb-3">
        <TestimonialsSection />
      </div>

      {/* ── FAQ ── */}
      <div className="mb-10">
        <FAQSection />
      </div>

      {/* ── Footer ── */}
      <Footer />

    </div>
  );
}