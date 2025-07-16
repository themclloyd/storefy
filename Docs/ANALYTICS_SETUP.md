# 📊 Advanced Web Analytics Configuration

## Overview

This document describes the comprehensive web analytics setup using @vercel/analytics with advanced tracking capabilities, GDPR compliance, and performance monitoring.

## 🚀 Features

### Core Analytics
- **Page View Tracking** - Automatic tracking of all page visits
- **User Behavior Analytics** - Feature usage, interactions, and user flows
- **Business Metrics** - Transaction tracking, revenue analytics, inventory actions
- **Performance Monitoring** - Core Web Vitals, API response times, error tracking
- **Search Analytics** - Product and customer search behavior

### Privacy & Compliance
- **GDPR Compliant** - Consent management with granular preferences
- **Privacy-First** - No personal data collection without consent
- **Transparent** - Clear privacy controls and data usage information

### Advanced Features
- **Real-time Error Tracking** - Automatic error capture and reporting
- **Custom Event Tracking** - Business-specific event monitoring
- **Performance Insights** - Load times, API performance, user experience metrics
- **Analytics Dashboard** - Built-in visualization of collected data

## 📁 File Structure

```
src/
├── utils/
│   └── analytics.ts              # Core analytics configuration and class
├── hooks/
│   └── useAnalyticsTracking.ts   # React hooks for analytics
├── components/
│   └── analytics/
│       ├── AnalyticsProvider.tsx # Main provider component
│       ├── ConsentBanner.tsx     # GDPR consent management
│       └── AnalyticsDashboard.tsx # Analytics visualization
└── docs/
    └── ANALYTICS_SETUP.md        # This documentation
```

## 🛠️ Implementation

### 1. Analytics Provider Setup

The `AnalyticsProvider` component wraps your entire application and provides:

```tsx
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';

function App() {
  return (
    <AnalyticsProvider>
      {/* Your app content */}
    </AnalyticsProvider>
  );
}
```

### 2. Using Analytics Hooks

```tsx
import { useAnalytics } from '@/hooks/useAnalyticsTracking';

function MyComponent() {
  const { 
    trackTransaction, 
    trackFeatureUsage, 
    trackSearch,
    trackError 
  } = useAnalytics();

  const handlePurchase = (orderData) => {
    // Track successful transaction
    trackTransaction({
      amount: orderData.total,
      itemsCount: orderData.items.length,
      paymentMethod: orderData.paymentMethod,
      customerType: orderData.customer.type
    });
  };

  const handleSearch = (query, results) => {
    trackSearch('product', query, results.length);
  };

  const handleFeatureUse = () => {
    trackFeatureUsage('advanced_filter', 'inventory_page');
  };
}
```

### 3. Environment Configuration

Add these environment variables to your `.env` file:

```bash
# Analytics Configuration
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_DEBUG=false
VITE_REQUIRE_ANALYTICS_CONSENT=true

# Optional: Vercel Analytics (automatically configured if deployed on Vercel)
VITE_VERCEL_ANALYTICS_ID=your_analytics_id
```

## 📊 Tracked Events

### User Authentication
- `user_login` - User login events with method tracking
- `user_logout` - Session end with duration
- `user_signup` - New user registrations
- `store_access` - Store access via direct login or link

### Business Operations
- `transaction_completed` - Successful sales transactions
- `inventory_updated` - Product management actions
- `customer_added` - New customer creation
- `layby_created` - Layby/installment plan creation
- `expense_recorded` - Business expense tracking

### User Interaction
- `page_view` - Page navigation with context
- `feature_used` - Feature interaction tracking
- `search_performed` - Search behavior analysis
- `dashboard_interaction` - Dashboard widget usage

### Performance & Errors
- `performance_metric` - Load times, API response times
- `error_occurred` - Application errors and exceptions

## 🔒 Privacy & Consent Management

### Consent Banner
The consent banner automatically appears for users in regions requiring consent:

```tsx
import { ConsentBanner } from '@/components/analytics/ConsentBanner';

// Automatically included in AnalyticsProvider
// Shows GDPR-compliant consent options
```

### Privacy Settings
Users can manage their privacy preferences:

```tsx
import { PrivacySettings } from '@/components/analytics/ConsentBanner';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PrivacySettings />
    </div>
  );
}
```

### Consent Categories
- **Functional** - Required for core app functionality (always enabled)
- **Analytics** - Page views, feature usage, user behavior
- **Performance** - Load times, API response times, error tracking

## 📈 Analytics Dashboard

View collected analytics data with the built-in dashboard:

```tsx
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
```

### Dashboard Features
- **Traffic Analytics** - Page views, user activity trends
- **Performance Metrics** - Core Web Vitals, load times
- **Feature Usage** - Most used features and user flows
- **Error Tracking** - Application errors and trends

## 🚀 Performance Monitoring

### Automatic Tracking
- **Core Web Vitals** - LCP, FID, CLS
- **Navigation Timing** - DNS, TCP, TTFB, DOM load
- **Resource Loading** - Failed resource tracking
- **API Performance** - Response time monitoring

### Custom Performance Tracking
```tsx
const { trackPerformance } = useAnalytics();

// Track custom performance metrics
trackPerformance('custom_operation', duration, 'context');
```

## 🔧 Configuration Options

### Analytics Config (`src/utils/analytics.ts`)
```typescript
export const analyticsConfig = {
  enabled: import.meta.env.PROD || import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  debug: import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_DEBUG === 'true',
  performanceSampleRate: 0.1, // Sample 10% of performance events
  requireConsent: import.meta.env.VITE_REQUIRE_ANALYTICS_CONSENT === 'true',
};
```

### Sampling Rates
- **Performance Events** - 10% sampling to reduce noise
- **Error Events** - 100% tracking for critical issues
- **User Events** - 100% tracking for business insights

## 🛡️ Security & Privacy

### Data Protection
- **No PII Collection** - Personal data is never tracked without consent
- **Anonymized Data** - User identifiers are hashed or anonymized
- **Secure Transmission** - All data sent over HTTPS
- **Data Retention** - Configurable retention periods

### GDPR Compliance
- **Consent Management** - Granular consent options
- **Right to Withdraw** - Easy consent revocation
- **Data Transparency** - Clear data usage information
- **Privacy by Design** - Default privacy-first configuration

## 📊 Business Intelligence

### Key Metrics Tracked
- **Revenue Analytics** - Transaction amounts, payment methods
- **User Engagement** - Session duration, feature usage
- **Inventory Performance** - Product views, stock movements
- **Customer Behavior** - Search patterns, purchase flows

### Custom Business Events
```tsx
// Track business-specific metrics
analytics.trackBusinessMetric({
  type: 'revenue',
  value: transactionAmount,
  metadata: {
    store_id: currentStore.id,
    payment_method: paymentMethod,
    customer_segment: customerType
  }
});
```

## 🔍 Debugging & Development

### Debug Mode
Enable debug mode in development:
```bash
VITE_ANALYTICS_DEBUG=true
```

This will log all analytics events to the console for debugging.

### Testing Analytics
```typescript
// Test analytics in development
import { analytics } from '@/utils/analytics';

// Manually trigger events for testing
analytics.trackEvent('test_event', { test: true });
```

## 📚 Best Practices

### Event Naming
- Use descriptive, consistent event names
- Follow the pattern: `category_action` (e.g., `pos_add_to_cart`)
- Include relevant context in event properties

### Performance
- Use debouncing for frequent events (search, scroll)
- Sample high-frequency events to reduce noise
- Batch related events when possible

### Privacy
- Always check consent before tracking
- Minimize data collection to essential metrics
- Provide clear opt-out mechanisms

## 🚀 Deployment

### Vercel Deployment
When deployed on Vercel, analytics are automatically configured. The CSP headers are configured to allow:
- Vercel Analytics: `https://vitals.vercel-analytics.com`
- Google Fonts: `https://fonts.googleapis.com` and `https://fonts.gstatic.com`
- Plausible Analytics: `https://plausible.io`

### Other Platforms
For other platforms, ensure environment variables are properly set:
```bash
VITE_ENABLE_ANALYTICS=true
VITE_REQUIRE_ANALYTICS_CONSENT=true
```

### Content Security Policy
The application includes a comprehensive CSP that allows analytics while maintaining security:
```
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://plausible.io https://vercel.live;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-analytics.com https://plausible.io;
  frame-ancestors 'none'
```

## 📞 Support

For questions or issues with the analytics implementation:
1. Check the console for debug logs (if debug mode is enabled)
2. Verify environment variables are correctly set
3. Ensure consent has been granted for tracking
4. Review the analytics dashboard for data verification

## 🔄 Updates & Maintenance

### Regular Tasks
- Review analytics data for insights
- Update consent preferences as needed
- Monitor performance metrics
- Check for and resolve tracking errors

### Version Updates
When updating @vercel/analytics:
1. Test analytics functionality
2. Verify consent management still works
3. Check dashboard compatibility
4. Update documentation if needed
