// import ComingSoon from "@/components/ComingSoon";
// import CTASection from "@/components/CTASection";
// import { FAQSection } from "@/components/FAQSection";
// import { Footer } from "@/components/Footer";
// import { HandWrittenTitle } from "@/components/HandWrittenText";
// import LoaderOne from "@/components/Loader-one";
// import { LoaderTwo} from "@/components/Loader-two";
// import LoginPage from "@/components/Login";
// import PricingSection from "@/components/PricingSection";
// import { BankingScaleHero } from "@/components/ScaleHero";
// import TestimonialsSection from "@/components/testimonials";
// import { Button } from "@/components/ui/button";
// import { HeroSection } from "@/components/Wishlist";
// import Image from "next/image";

// export default function Home() {
//   return (
//    <div>
//     {/* <HeroSection
//   distortion={1.2}
//   speed={0.8}
// />; */}
//     <HandWrittenTitle title="Kokonut UI" subtitle="Optional subtitle" ></HandWrittenTitle>
//     <LoaderTwo></LoaderTwo>
//     <LoaderOne></LoaderOne>
//     <ComingSoon></ComingSoon>
//     <LoginPage></LoginPage>
//     <BankingScaleHero></BankingScaleHero>
//     <CTASection></CTASection>
//     <FAQSection></FAQSection>
    
//     <PricingSection></PricingSection>
//     <TestimonialsSection></TestimonialsSection>
//     <Footer></Footer>
//    </div>
//   );
// }
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight ,Command, Lock ,Scissors, FlaskConical, Sparkles, UserCircle, Building2, Smile  } from 'lucide-react';
import TestimonialsSection from '@/components/testimonials';
import { FAQSection } from '@/components/FAQSection';
import { Footer } from '@/components/Footer';
import { BankingScaleHero } from '@/components/ScaleHero';

export default function IntakeLandingPage() {
  const categories = [
    {
      icon: <Scissors className="w-6 h-6" />,
      title: "Creators",
      items: [
        "Sell products online",
        "Grow your newsletter",
        "Receive contact form messages"
      ],
      color: "text-pink-600"
    },
    {
      icon: <FlaskConical className="w-6 h-6" />,
      title: "Product",
      items: [
        "Gather audience feedback",
        "Receive feature requests",
        "Conduct user research"
      ],
      color: "text-pink-600"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Marketing",
      items: [
        "Generate leads",
        "Register users",
        "Measure customer satisfaction"
      ],
      color: "text-pink-600"
    },
    {
      icon: <UserCircle className="w-6 h-6" />,
      title: "HR",
      items: [
        "Evaluate employee engagement",
        "Receive job applications",
        "Create exit surveys"
      ],
      color: "text-pink-600"
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "Office",
      items: [
        "Organize team events",
        "Receive help desk tickets",
        "Collect internal suggestions"
      ],
      color: "text-pink-600"
    },
    {
      icon: <Smile className="w-6 h-6" />,
      title: "Personal",
      items: [
        "Create an online quiz",
        "Send an RSVP form",
        "Organize a volunteer signup"
      ],
      color: "text-pink-600"
    }
  ];
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-12 py-5">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-white flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" width="160" height="50" viewBox="0 0 600 160">
              <text x="40" y="110"
                    fill="#000000"
                    fontSize="104"
                    fontWeight="700"
                    letterSpacing="-4"
                    fontFamily="Arial, Helvetica, sans-serif">
                intake
              </text>
            </svg>
            <img 
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766659954/favicon_wghbca.svg" 
              alt="" 
              className="w-2.5 h-2.5 mt-3 ml-[-74px]"
            />
          </h1>
        </div>
        <div className="flex items-center gap-8">
          <a href="/pricing" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Pricing</a>
          <Button className='text-white'>
          <a href="/auth" className="text-sm font-medium">Log in</a>
          
          </Button>
          
          <Button className='text-white'>
          <a href="/auth" className="text-sm font-medium">Sign up</a>
          
          </Button>
         
          
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-5 py-2 text-sm font-medium">
            Create form
          </Button>
        </div>
      </nav>

 
    <section className="relative min-h-screen bg-gray-50 px-8 pt-12 pb-24 overflow-hidden">
      {/* Decorative faces - Top center */}
      <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[800px] h-[250px]">
        <img 
          src="https://tally.so/images/demo/v2/faces-mobile.png"
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

     
      {/* Main content */}
      <div className="relative max-w-5xl mx-auto text-center pt-60">
        <h1 className="text-7xl leading-tight font-bold mb-6 tracking-tight">
          The <span className="relative inline-block">
            simplest
            <img 
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766922864/title-highlight-2_fk9bq6.png"
              alt=""
              className="absolute left-0 right-0 -bottom-2 w-[90%] ml-3 h-3 object-fill"
            />
          </span> way to create forms
        </h1>
        
        <p className="text-xl text-gray-950 mb-5 leading-relaxed max-w-3xl mx-auto">
          Say goodbye to boring forms. Meet Intake — the free,<br />
          intuitive form builder you've been looking for.
        </p>

        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 text-sm font-medium shadow-lg transition-colors inline-flex items-center gap-2">
          Create a free form <ArrowRight className="h-5 w-5" />
        </button>
       
      </div>

     
    </section>


      {/* Form Preview Section with Video */}
      <section className="relative px-8 py-16 pb-32 mt-[-330px] mb-10">
        <div className="max-w-5xl mx-auto">
          {/* Browser Window - Video */}
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] p-6 mb-[-120px] relative z-10">
            <div className="flex gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <div className="w-3 h-3 rounded-full bg-gray-300" />
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <video 
                className="w-full"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="https://res.cloudinary.com/dci6nuwrm/video/upload/v1766922650/intro_mi5d3n.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Form Preview */}
          
        </div>
      </section>

      {/* Companies Section */}
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            A form builder like no other
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-3xl">
            Tally makes it simple for anyone to build free online forms. No need to code — just type your questions like you would in a doc.
          </p>
        </div>

        {/* Feature Highlight Card */}
        <div className="relative rounded-2xl sm:rounded-3xl border border-pink-200 p-6 sm:pl-10 md:pl-14 sm:pt-8 md:pt-10 sm:pr-6 md:pr-8 pb-0 bg-gradient-to-br from-pink-50 to-white overflow-hidden">
          <div className="relative z-10 max-w-3xl mb-4 sm:mb-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600 mb-2 sm:mb-3">
              Unlimited forms and submissions for free
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-800 mb-4 sm:mb-0">
              Paywalls getting in the way? Not anymore. Tally gives you unlimited forms and submissions, completely free, as long as you stay within our{' '}
              <a href="#" className="underline hover:text-pink-600 transition">
                fair usage guidelines
              </a>
              .
            </p>
          </div>
          
          {/* Wave decoration */}
          <div className="relative">
            <img
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766937242/dive-in_nzwydi.png"
              alt=""
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>

      {/* Feature Cards Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-24">
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mt-[-40px] sm:mt-[-60px] md:mt-[-70px]">
          
          {/* Just Start Typing Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Command className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Just start typing
            </h3>

            <p className="text-gray-700 text-base sm:text-lg mb-6 sm:mb-8">
              Tally is a new type of online form builder that works like a text document. Just start typing on the page and insert blocks same as Notion.
            </p>

            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1 text-gray-600">
                <span className="text-sm font-mono">/phone</span>
              </div>

              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-lg"
              >
                <source
                  src="https://res.cloudinary.com/dci6nuwrm/video/upload/v1766937274/just-type-card_vrgckn.mp4"
                  type="video/mp4"
                />
              </video>
            </div>
          </div>

          {/* Privacy-Friendly Card */}
          <div className="relative bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                Privacy-friendly form builder
              </h3>

              <p className="text-gray-700 text-base sm:text-lg mb-4 sm:mb-6">
                Your data privacy and security are our top priorities. We are{' '}
                <span className="font-semibold">GDPR compliant</span> and treat your data with care and confidentiality.
              </p>

              <p className="text-gray-700 text-base sm:text-lg">
                Tally is <span className="font-semibold">hosted in Europe</span>, we don't use cookie-tracking, and all form data is securely stored and{' '}
                <span className="font-semibold">encrypted</span> both in transit and at rest.{' '}
                <a href="#" className="underline hover:text-pink-600 transition">
                  Learn more about Tally & GDPR
                </a>
                .
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div>
    <BankingScaleHero></BankingScaleHero>
    </div>

    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white px-4 md:px-8 py-6">
    <div className="max-w-5xl mx-auto">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 gap-10">
        
        {/* Text */}
        <div className="flex-1 max-w-xl">
          <h1 className="relative text-4xl md:text-5xl font-bold text-gray-900 mb-4 inline-block">
            Designed for you
            {/* Highlight */}
            <img
              src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766941370/title-highlight-3_eomnxw.png"
              alt=""
              className="absolute -bottom-2 left-20 w-20 pointer-events-none select-none"
            />
          </h1>
  
          <p className="text-sm md:text-lg text-gray-600 leading-relaxed">
            Start from scratch or explore templates
            <br className="hidden sm:block" />
            created by our community.
          </p>
        </div>
  
        {/* Illustration */}
        <div className="flex-shrink-0 w-full lg:w-auto flex justify-center lg:justify-end">
          <img
            src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766941371/designed-for-you_gnpovs.png"
            alt="Designed for you illustration"
            className="h-44 md:h-60 w-auto object-contain"
          />
        </div>
      </div>
  
      {/* Categories Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 mb-8">
          {categories.map((category, index) => (
            <div key={index} className="space-y-2">
              
              <div className='text-pink-500'>
                {category.icon}
              </div>
  
              <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                {category.title}
              </h3>
  
              <ul className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <li
                    key={itemIndex}
                    className="text-gray-600 text-sm leading-relaxed"
                  >
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
  
        {/* Browse Templates Button */}
        <div className="flex justify-start">
          <button className="bg-blue-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
            Browse templates
          </button>
        </div>
      </div>
    </div>
  </div>
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8 relative overflow-hidden">
     
     {/* Main content */}
     <div className="max-w-4xl mx-auto text-center relative z-10">
       {/* Illustration */}
       <div className="mb-12 relative">
         <img 
           src="https://res.cloudinary.com/dci6nuwrm/image/upload/v1766943528/roll-up-sleeves_qv5yko.png" 
           alt="Person rolling up sleeves ready to work"
           className="w-120 h-auto mx-auto"
         />
         
        
         
        
       </div>
       
       {/* Text content */}
       <div className="mt-20">
         <h1 className="text-5xl font-bold text-gray-900 mb-4">
           Build stunning forms for free
         </h1>
         
         <p className="text-2xl text-gray-900 mb-10 max-w-2xl mx-auto">
           It's as simple as one-two-three, and guess what?
           <br />
            You don't even need an account to try it out!
         </p>
         
         {/* CTA Button */}
         <button className="bg-blue-900 hover:bg-blue-800 text-white font-semibold px-4 py-3 rounded-lg inline-flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
           Create a free form
           <ArrowRight className="w-5 h-5" />
         </button>
       </div>
     </div>
     
     {/* Help button */}
     
   </div>
   <div className='pl-30 pr-30 pt-3 mb-3'>
    <TestimonialsSection></TestimonialsSection>
   </div>
   <div className='mb-10'>
    <FAQSection></FAQSection>
   </div>
   <div>
    <Footer></Footer>
   </div>
    </div>
  );
}


