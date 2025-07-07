import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const pricingPlans = [
  {
    name: "Starter",
    price: "$19",
    period: "per month",
    features: [
      "Up to 1,000 products",
      "Basic inventory tracking",
      "POS system",
      "Email support",
      "Mobile app access"
    ],
    popular: false
  },
  {
    name: "Professional",
    price: "$49",
    period: "per month",
    discount: "Most Popular",
    features: [
      "Up to 10,000 products",
      "Advanced analytics & reports",
      "Customer management",
      "Multi-location support",
      "Priority support",
      "API access"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "$149",
    period: "per month",
    features: [
      "Unlimited products",
      "Custom integrations",
      "Dedicated account manager",
      "Advanced reporting",
      "White-label solution",
      "24/7 phone support"
    ],
    popular: false
  }
];

export const PricingSection = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="min-h-screen bg-muted flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-scale-in">
            <CheckCircle className="w-4 h-4" />
            PRICING PLANS
          </div>
          <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-4 leading-tight animate-fade-in-up animation-delay-200">
            Choose the perfect plan for your business
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-in-up animation-delay-400">
            Start with our free trial and scale as your business grows. All plans include core features with no setup fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-muted rounded-full p-1 mb-8 animate-scale-in animation-delay-600">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                !isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                isAnnual ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Annually
              <span className="ml-2 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto animate-stagger">
          {pricingPlans.map((plan, index) => (
            <div key={index} className={`relative ${plan.popular ? 'bg-primary text-primary-foreground shadow-xl scale-105' : 'bg-card text-card-foreground shadow-lg'} rounded-2xl p-8 transition-all duration-300 border ${plan.popular ? 'border-primary' : 'border-card-border'} animate-fade-in-up hover-lift`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-dark text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <h3 className="text-xl font-medium">{plan.name}</h3>
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className={`text-sm ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>/{plan.period.split(' ')[1]}</span>
                    </div>
                    <p className={`text-sm ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{plan.period}</p>
                  </div>
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${plan.popular ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
                        <CheckCircle className={`w-3 h-3 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                      </div>
                      <span className={`text-sm leading-relaxed ${plan.popular ? 'text-primary-foreground' : 'text-card-foreground'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  rounded="full"
                  className={`w-full h-12 font-medium ${plan.popular
                    ? 'bg-background hover:bg-muted text-primary shadow-lg'
                    : 'bg-primary hover:bg-primary-dark text-primary-foreground'
                  } transform hover:scale-105 transition-all duration-200`}
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
