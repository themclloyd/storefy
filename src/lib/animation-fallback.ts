/**
 * Animation fallback utility to ensure content is always visible
 * even if CSS animations fail or are disabled
 */

export const initializeAnimationFallback = () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupFallback);
  } else {
    setupFallback();
  }
};

const setupFallback = () => {
  // Set up a timeout to make all animated elements visible after 3 seconds
  setTimeout(() => {
    makeAllAnimatedElementsVisible();
  }, 3000);

  // Also check immediately for any elements that might be stuck
  setTimeout(() => {
    makeAllAnimatedElementsVisible();
  }, 100);

  // Set up intersection observer for elements entering viewport
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          // If element has been in viewport for 2 seconds and still invisible, make it visible
          setTimeout(() => {
            if (entry.isIntersecting && getComputedStyle(element).opacity === '0') {
              makeElementVisible(element);
            }
          }, 2000);
        }
      });
    });

    // Observe all animated elements
    const animatedElements = document.querySelectorAll([
      '.animate-fade-in-up',
      '.animate-fade-in-left', 
      '.animate-fade-in-right',
      '.animate-fade-in',
      '.animate-slide-in-up',
      '.animate-scale-in',
      '.animation-delay-200',
      '.animation-delay-400',
      '.animation-delay-600',
      '.animation-delay-800',
      '.animation-delay-1000',
      '.animation-delay-1200',
      '.animation-delay-1400',
      '.animate-stagger > *'
    ].join(', '));

    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  }
};

const makeAllAnimatedElementsVisible = () => {
  const selectors = [
    '.animate-fade-in-up',
    '.animate-fade-in-left', 
    '.animate-fade-in-right',
    '.animate-fade-in',
    '.animate-slide-in-up',
    '.animate-scale-in',
    '.animation-delay-200',
    '.animation-delay-400',
    '.animation-delay-600',
    '.animation-delay-800',
    '.animation-delay-1000',
    '.animation-delay-1200',
    '.animation-delay-1400',
    '.animate-stagger > *'
  ];

  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const computedStyle = getComputedStyle(htmlElement);
      
      // If element is still invisible, make it visible
      if (computedStyle.opacity === '0' || computedStyle.visibility === 'hidden') {
        makeElementVisible(htmlElement);
      }
    });
  });
};

const makeElementVisible = (element: HTMLElement) => {
  // Use inline styles to override any CSS that might be hiding the element
  element.style.opacity = '1';
  element.style.visibility = 'visible';
  element.style.transform = 'none';
  
  // Add a class to indicate this element has been made visible by fallback
  element.classList.add('animation-fallback-visible');
  
  // Optional: Log for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Animation fallback applied to element:', element);
  }
};

// Export for manual use if needed
export const forceShowAnimatedElements = makeAllAnimatedElementsVisible;
