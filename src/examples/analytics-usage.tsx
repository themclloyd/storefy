/**
 * Analytics Usage Examples
 * 
 * This file demonstrates how to use the advanced analytics system
 * in different components throughout the Storefy application.
 */

import { useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalyticsTracking';

// Example 1: Basic Page Component with Analytics
export function ExamplePageComponent() {
  const { trackFeatureUsage, trackError } = useAnalytics();

  useEffect(() => {
    // Track when user views this page
    trackFeatureUsage('example_page', 'view');
  }, [trackFeatureUsage]);

  const handleButtonClick = () => {
    try {
      // Your business logic here
      console.log('Button clicked');
      
      // Track feature usage
      trackFeatureUsage('example_button', 'click');
    } catch (error) {
      // Track errors automatically
      trackError(error as Error, {
        type: 'ui',
        page: 'example_page',
        additionalData: { action: 'button_click' }
      });
    }
  };

  return (
    <div>
      <h1>Example Page</h1>
      <button onClick={handleButtonClick}>
        Click Me (Tracked)
      </button>
    </div>
  );
}

// Example 2: E-commerce Transaction Tracking
export function ExampleCheckoutComponent() {
  const { trackTransaction, trackFeatureUsage } = useAnalytics();

  const handleCheckout = async (orderData: any) => {
    try {
      // Process the order
      const result = await processOrder(orderData);
      
      // Track successful transaction
      trackTransaction({
        amount: orderData.total,
        itemsCount: orderData.items.length,
        paymentMethod: orderData.paymentMethod,
        customerType: orderData.customer.isNew ? 'new' : 'returning'
      });

      // Track checkout completion
      trackFeatureUsage('checkout', 'completed');
      
    } catch (error) {
      // Error tracking is automatic via AnalyticsProvider
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div>
      {/* Your checkout UI */}
    </div>
  );
}

// Example 3: Search Component with Analytics
export function ExampleSearchComponent() {
  const { trackSearch, trackFeatureUsage } = useAnalytics();

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;

    try {
      // Perform search
      const results = await searchProducts(query);
      
      // Track search with results count
      trackSearch('product', query, results.length);
      
      // Track search feature usage
      trackFeatureUsage('product_search', 'performed');
      
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div>
      <input 
        type="text"
        placeholder="Search products..."
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}

// Example 4: Inventory Management with Analytics
export function ExampleInventoryComponent() {
  const { trackInventoryAction, trackFeatureUsage } = useAnalytics();

  const handleAddProduct = async (productData: any) => {
    try {
      // Add product to inventory
      await addProduct(productData);
      
      // Track inventory action
      trackInventoryAction('add', 1);
      
      // Track feature usage
      trackFeatureUsage('inventory_management', 'add_product');
      
    } catch (error) {
      console.error('Failed to add product:', error);
    }
  };

  const handleBulkUpdate = async (products: any[]) => {
    try {
      // Update multiple products
      await updateProducts(products);
      
      // Track bulk inventory action
      trackInventoryAction('stock_update', products.length);
      
      // Track bulk operation
      trackFeatureUsage('inventory_management', 'bulk_update');
      
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  return (
    <div>
      {/* Your inventory management UI */}
    </div>
  );
}

// Example 5: Customer Management with Analytics
export function ExampleCustomerComponent() {
  const { trackCustomerAction, trackFeatureUsage } = useAnalytics();

  const handleAddCustomer = async (customerData: any) => {
    try {
      // Add customer
      await addCustomer(customerData);
      
      // Track customer addition
      trackCustomerAction('manual');
      
      // Track feature usage
      trackFeatureUsage('customer_management', 'add_customer');
      
    } catch (error) {
      console.error('Failed to add customer:', error);
    }
  };

  const handleImportCustomers = async (csvData: any) => {
    try {
      // Import customers from CSV
      const imported = await importCustomers(csvData);
      
      // Track bulk customer import
      for (let i = 0; i < imported.length; i++) {
        trackCustomerAction('import');
      }
      
      // Track import feature
      trackFeatureUsage('customer_management', 'bulk_import');
      
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div>
      {/* Your customer management UI */}
    </div>
  );
}

// Example 6: Dashboard Component with Analytics
export function ExampleDashboardComponent() {
  const { trackDashboardInteraction, trackFeatureUsage } = useAnalytics();

  const handleWidgetView = (widgetName: string) => {
    trackDashboardInteraction(widgetName, 'view');
  };

  const handleFilterChange = (widgetName: string, filterValue: string) => {
    trackDashboardInteraction(widgetName, 'filter');
    trackFeatureUsage('dashboard_filter', `${widgetName}_${filterValue}`);
  };

  const handleExport = (widgetName: string) => {
    trackDashboardInteraction(widgetName, 'export');
    trackFeatureUsage('data_export', widgetName);
  };

  return (
    <div>
      {/* Your dashboard widgets */}
    </div>
  );
}

// Example 7: Performance Tracking
export function ExamplePerformanceComponent() {
  const { trackApiCall, trackPageLoadTime } = useAnalytics();

  useEffect(() => {
    // Track page load time
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      trackPageLoadTime('example_page', loadTime);
    };
  }, [trackPageLoadTime]);

  const handleApiCall = async () => {
    const startTime = performance.now();
    
    try {
      // Make API call
      const response = await fetch('/api/data');
      const duration = performance.now() - startTime;
      
      // Track successful API call
      trackApiCall('/api/data', duration, true);
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Track failed API call
      trackApiCall('/api/data', duration, false);
      
      throw error;
    }
  };

  return (
    <div>
      {/* Your component UI */}
    </div>
  );
}

// Example 8: Business Metrics Tracking
export function ExampleBusinessMetricsComponent() {
  const { trackBusinessMetric, trackReportGeneration } = useAnalytics();

  const handleGenerateReport = async (reportType: 'sales' | 'inventory' | 'customer' | 'financial') => {
    try {
      // Generate report
      const report = await generateReport(reportType);
      
      // Track report generation
      trackReportGeneration(reportType, 'last_30_days');
      
      // Track business metric
      trackBusinessMetric({
        type: 'revenue',
        value: report.totalRevenue,
        metadata: {
          report_type: reportType,
          period: 'last_30_days',
          records_count: report.recordsCount
        }
      });
      
    } catch (error) {
      console.error('Report generation failed:', error);
    }
  };

  return (
    <div>
      {/* Your reporting UI */}
    </div>
  );
}

// Mock functions for examples
async function processOrder(orderData: any) {
  // Mock implementation
  return { success: true };
}

async function searchProducts(query: string) {
  // Mock implementation
  return [{ id: 1, name: 'Product 1' }];
}

async function addProduct(productData: any) {
  // Mock implementation
  return { success: true };
}

async function updateProducts(products: any[]) {
  // Mock implementation
  return { success: true };
}

async function addCustomer(customerData: any) {
  // Mock implementation
  return { success: true };
}

async function importCustomers(csvData: any) {
  // Mock implementation
  return [{ id: 1 }, { id: 2 }];
}

async function generateReport(type: string) {
  // Mock implementation
  return {
    totalRevenue: 10000,
    recordsCount: 100
  };
}
