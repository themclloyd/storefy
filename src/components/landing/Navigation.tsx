import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Store, Menu, X } from 'lucide-react';

export const Navigation = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-medium text-foreground">Storefy</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-normal">Home</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-normal">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-normal">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-normal">About</a>
            </div>

            <div className="hidden md:flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/auth')}
                className="text-muted-foreground hover:text-foreground font-normal text-sm"
              >
                Sign In
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background border-t border-border">
            <div className="px-6 py-6 space-y-4">
              <a href="#" className="block text-muted-foreground hover:text-foreground font-normal">Home</a>
              <a href="#features" className="block text-muted-foreground hover:text-foreground font-normal">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground font-normal">Pricing</a>
              <a href="#testimonials" className="block text-muted-foreground hover:text-foreground font-normal">About</a>
              <div className="pt-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/auth')}
                  className="w-full justify-start text-muted-foreground font-normal"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
