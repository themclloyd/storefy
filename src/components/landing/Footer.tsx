import { Store } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-background py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-medium text-foreground">Storefy</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Empowering retail businesses with comprehensive inventory management, POS systems, and analytics to drive growth and efficiency.
            </p>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-primary text-sm font-bold">f</span>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-primary text-sm font-bold">t</span>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer">
                <span className="text-primary text-sm font-bold">in</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Product</h4>
            <div className="space-y-2">
              <a href="#features" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Features</a>
              <a href="#pricing" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Pricing</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Inventory Management</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">POS System</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Analytics</a>
            </div>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Company</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">About</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Careers</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Blog</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Press</a>
            </div>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Support</h4>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Help Center</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Documentation</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Contact Support</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground text-sm transition-colors">Training</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Storefy. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Terms of Service</a>
            <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
