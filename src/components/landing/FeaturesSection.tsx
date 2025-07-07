import { Package, BarChart3, Users, Shield, Zap, Smartphone } from 'lucide-react';

const features = [
  {
    icon: <Package className="w-6 h-6 text-primary-foreground" />,
    title: "Inventory Management",
    description: "Track stock levels, manage suppliers, and automate reordering with intelligent inventory control.",
    color: "bg-primary"
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-success-foreground" />,
    title: "Real-time Analytics",
    description: "Get instant insights into sales performance, customer behavior, and business trends.",
    color: "bg-success"
  },
  {
    icon: <Users className="w-6 h-6 text-secondary-foreground" />,
    title: "Customer Management",
    description: "Build customer profiles, track purchase history, and create targeted marketing campaigns.",
    color: "bg-secondary"
  },
  {
    icon: <Shield className="w-6 h-6 text-info-foreground" />,
    title: "Secure & Reliable",
    description: "Enterprise-grade security ensures your business data and customer information stay protected.",
    color: "bg-info"
  },
  {
    icon: <Zap className="w-6 h-6 text-warning-foreground" />,
    title: "Fast POS System",
    description: "Lightning-fast checkout process with barcode scanning and multiple payment options.",
    color: "bg-warning"
  },
  {
    icon: <Smartphone className="w-6 h-6 text-tertiary-foreground" />,
    title: "Mobile Ready",
    description: "Manage your store from anywhere with our mobile app and cloud-based platform.",
    color: "bg-tertiary"
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="min-h-screen bg-background flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-scale-in">
            <Package className="w-4 h-4" />
            FEATURES
          </div>
          <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-4 leading-tight animate-fade-in-up animation-delay-200">
            Everything you need to run your retail business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            From inventory management to customer analytics, Storefy provides all the tools you need to streamline operations and grow your business.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-stagger">
          {features.map((feature, index) => (
            <div key={index} className="bg-card rounded-2xl p-6 text-center group hover:shadow-lg transition-all duration-300 border border-card-border animate-fade-in-up hover-lift">
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-medium text-card-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
