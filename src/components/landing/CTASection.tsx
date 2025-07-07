import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Store, Smartphone } from 'lucide-react';

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-muted flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="bg-primary rounded-3xl p-12 text-center text-primary-foreground animate-scale-in relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 border border-primary-foreground rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 border border-primary-foreground rounded-full"></div>
            <div className="absolute top-1/2 right-20 w-12 h-12 border border-primary-foreground rounded-full"></div>
          </div>

          <div className="relative space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary-foreground/20 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-4 animate-scale-in">
                <Store className="w-4 h-4" />
                Ready to get started?
              </div>
              <h2 className="text-4xl md:text-5xl font-normal leading-tight animate-fade-in-up animation-delay-200">
                Transform your retail business
                <br />
                <span className="text-primary-light">starting today</span>
              </h2>
              <p className="text-lg text-primary-foreground/80 leading-relaxed max-w-2xl mx-auto animate-fade-in-up animation-delay-400">
                Join thousands of retailers who have streamlined their operations with Storefy.
                Start your free trial and see the difference in just minutes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
              <Button
                size="xl"
                rounded="full"
                onClick={() => navigate('/auth')}
                className="bg-background hover:bg-muted text-primary font-medium transform hover:scale-105 transition-all duration-200 hover:shadow-xl flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="xl"
                rounded="full"
                variant="ghost"
                className="text-primary-foreground hover:bg-primary-foreground/10 font-medium transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Download Mobile App
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 pt-6 animate-fade-in-up animation-delay-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-foreground">14-day</div>
                <div className="text-sm text-primary-foreground/70">Free trial</div>
              </div>
              <div className="w-px h-12 bg-primary-foreground/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-foreground">No</div>
                <div className="text-sm text-primary-foreground/70">Setup fees</div>
              </div>
              <div className="w-px h-12 bg-primary-foreground/20"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-foreground">24/7</div>
                <div className="text-sm text-primary-foreground/70">Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
