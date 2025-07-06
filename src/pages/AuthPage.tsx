import { useEffect } from "react";
import { AuthPage as AuthPageComponent } from "@/components/auth/AuthPage";

const AuthPage = () => {
  useEffect(() => {
    document.title = "Sign In - Storefy";
  }, []);

  return <AuthPageComponent />;
};

export default AuthPage;