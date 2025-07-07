import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, BarChart3, Users, Store, Zap } from 'lucide-react';

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-background min-h-screen flex items-center py-20">
      <div className="max-w-7xl mx-auto px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 animate-scale-in">
                <Store className="w-4 h-4" />
                Unified Retail Hub
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-normal text-foreground leading-[0.95] tracking-tight animate-fade-in-up animation-delay-200">
                Streamline your <span className="text-primary">retail business</span> with ease
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg font-normal animate-fade-in-up animation-delay-400">
                Complete inventory management, POS system, and business analytics in one powerful platform.
                Built for modern retailers who want to focus on growth, not complexity.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4 animate-fade-in-up animation-delay-600">
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="font-medium px-8 text-base transform hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                Start Free Trial
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-muted-foreground hover:text-foreground font-medium px-4 text-base transform hover:scale-105 transition-all duration-200"
              >
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-6 pt-6 animate-fade-in-up animation-delay-800">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">500+</span> businesses trust us
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">99.9%</span> uptime
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">24/7</span> support
              </div>
            </div>
          </div>

          {/* Hero Visual - Retail Dashboard */}
          <div className="relative flex justify-center lg:justify-end animate-fade-in-right animation-delay-800">
            <div className="relative w-full max-w-lg">
              {/* Main Dashboard Card */}
              <div className="bg-card rounded-2xl shadow-2xl border border-card-border p-6 transform hover:scale-105 transition-all duration-300 hover-lift">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-card-foreground">Store Dashboard</h3>
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/10 rounded-xl p-4 animate-fade-in-up animation-delay-1000">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Sales Today</div>
                          <div className="text-lg font-semibold text-foreground">$2,847</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-success/10 rounded-xl p-4 animate-fade-in-up animation-delay-1200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-success-foreground" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Products</div>
                          <div className="text-lg font-semibold text-foreground">1,247</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-muted rounded-xl p-4 animate-fade-in-up animation-delay-1400">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Revenue Trend</span>
                    </div>
                    <div className="flex items-end gap-1 h-16">
                      {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                        <div
                          key={i}
                          className="bg-primary rounded-sm flex-1 animate-scale-in"
                          style={{
                            height: `${height}%`,
                            animationDelay: `${1.6 + i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Feature Cards */}
              <div className="absolute -top-4 -left-4 bg-card rounded-xl shadow-lg border border-card-border p-3 animate-float hover-lift" style={{animationDelay: '0.5s'}}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-secondary rounded-lg flex items-center justify-center">
                    <Users className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-card-foreground">Customer Management</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-card rounded-xl shadow-lg border border-card-border p-3 animate-float hover-lift" style={{animationDelay: '1.8s'}}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-quaternary rounded-lg flex items-center justify-center">
                    <Zap className="w-3 h-3 text-quaternary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-card-foreground">Real-time Analytics</span>
                </div>
              </div>

              {/* Background Elements */}
              <div className="absolute -top-8 right-8 w-20 h-20 bg-primary/20 rounded-full opacity-60 animate-float" style={{animationDelay: '0.8s'}}></div>
              <div className="absolute -bottom-8 left-8 w-16 h-16 bg-success/20 rounded-full opacity-60 animate-float" style={{animationDelay: '2.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
