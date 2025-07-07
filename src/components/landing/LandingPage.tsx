import {
  Navigation,
  HeroSection,
  FeaturesSection,
  PricingSection,
  TestimonialsSection,
  CTASection,
  Footer
} from './index';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};