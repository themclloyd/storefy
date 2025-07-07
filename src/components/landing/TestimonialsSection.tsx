import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Boutique Owner",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    content: "Storefy transformed how I manage my boutique. The inventory tracking is seamless, and the analytics help me make better buying decisions. Sales have increased 40% since we started using it.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Electronics Store Manager",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content: "The POS system is incredibly fast and reliable. Our checkout times have been cut in half, and customers love the smooth experience. The real-time inventory updates are a game-changer.",
    rating: 5
  },
  {
    name: "Emily Thompson",
    role: "Coffee Shop Owner",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content: "Managing multiple locations used to be a nightmare. Now I can see everything from one dashboard - inventory, sales, staff performance. It's like having a business manager in my pocket.",
    rating: 5
  }
];

export const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="min-h-screen bg-background flex items-center py-20">
      <div className="max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6 animate-scale-in">
            <Star className="w-4 h-4" />
            TESTIMONIALS
          </div>
          <h2 className="text-4xl md:text-5xl font-normal text-foreground mb-4 leading-tight animate-fade-in-up animation-delay-200">
            Loved by retail businesses everywhere
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Join thousands of retailers who have transformed their business operations with Storefy's comprehensive retail management platform.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="relative animate-fade-in-up animation-delay-600">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`bg-card rounded-2xl p-8 shadow-lg border border-card-border hover-lift transition-all duration-300 ${
                  index === 0 ? 'animate-fade-in-left animation-delay-800' :
                  index === 1 ? 'animate-fade-in-up animation-delay-1000' :
                  'animate-fade-in-right animation-delay-1200'
                }`}
              >
                <div className="space-y-6">
                  {/* Rating */}
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-card-foreground leading-relaxed text-base">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full overflow-hidden">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-card-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
