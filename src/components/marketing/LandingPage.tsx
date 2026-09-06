import Navbar from "./Navbar";
import Hero from "./Hero";
import Quote from "./Quote";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import Pricing from "./Pricing";
import CtaSection from "./CtaSection";
import Footer from "./Footer";

export default function LandingPage() {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <Quote />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaSection />
      <Footer />
    </div>
  );
}
