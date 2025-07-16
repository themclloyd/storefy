import { useStore } from '@/contexts/StoreContext';
import { ChevronRight, Building2 } from 'lucide-react';

interface BreadcrumbsProps {
  activeView: string;
}

export function Breadcrumbs({ activeView }: BreadcrumbsProps) {
  const { currentStore } = useStore();

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const pinData = pinSession ? JSON.parse(pinSession) : null;

  // Get store name
  const storeName = pinData?.store_name || currentStore?.name || 'Store';

  // Get page name mapping
  const getPageName = (view: string) => {
    switch (view) {
      case 'dashboard':
        return 'Overview';
      case 'pos':
        return 'POS System';
      case 'inventory':
        return 'Inventory';
      case 'customers':
        return 'Customers';
      case 'transactions':
        return 'Transactions';
      case 'expenses':
        return 'Expenses';
      case 'layby':
        return 'Layby';
      case 'reports':
        return 'Reports';
      case 'settings':
        return 'Settings';
      case 'stores':
        return 'Store Management';
      case 'categories':
        return 'Categories';
      case 'suppliers':
        return 'Suppliers';
      default:
        return 'Dashboard';
    }
  };

  // Get section name (parent category)
  const getSectionName = (view: string) => {
    switch (view) {
      case 'dashboard':
      case 'pos':
        return 'Dashboard';
      case 'inventory':
      case 'categories':
      case 'suppliers':
        return 'Inventory';
      case 'customers':
      case 'transactions':
      case 'layby':
        return 'Sales';
      case 'expenses':
        return 'Dashboard';
      case 'reports':
        return 'Analytics';
      case 'settings':
      case 'stores':
        return 'Management';
      default:
        return 'Dashboard';
    }
  };

  const sectionName = getSectionName(activeView);
  const pageName = getPageName(activeView);
  const showSection = sectionName !== pageName;

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      {/* Store Name */}
      <div className="flex items-center gap-1">
        <Building2 className="w-4 h-4" />
        <span className="font-medium text-foreground">{storeName}</span>
      </div>

      <ChevronRight className="w-4 h-4" />

      {/* Section (if different from page) */}
      {showSection && (
        <>
          <span className="hover:text-foreground transition-colors">
            {sectionName}
          </span>
          <ChevronRight className="w-4 h-4" />
        </>
      )}

      {/* Current Page */}
      <span className="text-foreground font-medium">
        {pageName}
      </span>
    </nav>
  );
}
