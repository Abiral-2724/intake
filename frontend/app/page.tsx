import ComingSoon from "@/components/ComingSoon";
import CTASection from "@/components/CTASection";
import { FAQSection } from "@/components/FAQSection";
import { Footer } from "@/components/Footer";
import { HandWrittenTitle } from "@/components/HandWrittenText";
import LoaderOne from "@/components/Loader-one";
import { LoaderTwo} from "@/components/Loader-two";
import LoginPage from "@/components/Login";
import PricingSection from "@/components/PricingSection";
import { BankingScaleHero } from "@/components/ScaleHero";
import TestimonialsSection from "@/components/testimonials";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/Wishlist";
import Image from "next/image";

export default function Home() {
  return (
   <div>
    <HeroSection
  distortion={1.2}
  speed={0.8}
/>;
    <HandWrittenTitle title="Kokonut UI" subtitle="Optional subtitle" ></HandWrittenTitle>
    <LoaderTwo></LoaderTwo>
    <LoaderOne></LoaderOne>
    <ComingSoon></ComingSoon>
    <LoginPage></LoginPage>
    <BankingScaleHero></BankingScaleHero>
    <CTASection></CTASection>
    <FAQSection></FAQSection>
    
    <PricingSection></PricingSection>
    <TestimonialsSection></TestimonialsSection>
    <Footer></Footer>
   </div>
  );
}
