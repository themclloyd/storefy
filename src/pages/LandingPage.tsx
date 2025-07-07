import { useEffect } from "react";
import { LandingPage as LandingPageComponent } from "@/components/landing/LandingPage";

const LandingPage = () => {
  useEffect(() => {
    document.title = "Storefy - Unified Retail Management System";
  }, []);

  return <LandingPageComponent />;
};

export default LandingPage;
