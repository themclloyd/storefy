#!/usr/bin/env node

/**
 * Comprehensive script to fix all remaining lint issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting comprehensive lint fix...\n');

// Configuration for fixing issues
const fixConfig = {
  // Remove unused imports
  removeUnusedImports: [
    { file: 'src/components/customers/CustomerStatusDialog.tsx', imports: ['isPinSession'] },
    { file: 'src/components/customers/CustomersView.tsx', imports: ['Input', 'Search'] },
    { file: 'src/components/dashboard/SimpleDashboard.tsx', imports: ['cn', 'Legend'] },
    { file: 'src/components/dashboard/widgets/CustomersWidget.tsx', imports: ['cn'] },
    { file: 'src/components/dashboard/widgets/ExpensesWidget.tsx', imports: ['cn'] },
    { file: 'src/components/dashboard/widgets/InventoryWidget.tsx', imports: ['Progress', 'TrendingDown', 'cn'] },
    { file: 'src/components/dashboard/widgets/LaybyWidget.tsx', imports: ['Plus', 'cn'] },
    { file: 'src/components/dashboard/widgets/SalesWidget.tsx', imports: ['cn'] },
    { file: 'src/components/dashboard/widgets/TransactionsWidget.tsx', imports: ['cn'] },
    { file: 'src/components/data-table.tsx', imports: ['CheckCircleIcon'] },
    { file: 'src/components/expenses/ExpenseDetailsModal.tsx', imports: ['Separator', 'Download', 'XCircle', 'AlertCircle', 'useStore', 'toast'] },
    { file: 'src/components/expenses/ExpenseView.tsx', imports: ['Filter', 'XCircle', 'SecureAction'] },
    { file: 'src/components/expenses/RecurringExpensesView.tsx', imports: ['Edit', 'AlertCircle', 'CheckCircle', 'isAfter'] },
    { file: 'src/components/inventory/AdvancedFilters.tsx', imports: ['X', 'ArrowUpDown'] },
    { file: 'src/components/inventory/BulkOperationsBar.tsx', imports: ['Edit'] },
    { file: 'src/components/inventory/InventoryView.tsx', imports: ['Input', 'Search', 'CheckSquare', 'SecureAction'] },
    { file: 'src/components/landing/TestimonialsSection.tsx', imports: ['ChevronLeft', 'ChevronRight'] },
    { file: 'src/components/layout/MobileBottomNav.tsx', imports: ['Home', 'Clock', 'Settings', 'DollarSign'] },
    { file: 'src/components/layout/Sidebar.tsx', imports: ['BarChart3', 'LogOut', 'Clock', 'FileText', 'DollarSign', 'ChevronLeft', 'PanelLeft', 'Home', 'ShoppingBag', 'BarChart4', 'cn', 'SidebarTrigger', 'Button', 'Tooltip', 'TooltipContent', 'TooltipProvider', 'TooltipTrigger'] },
    { file: 'src/components/navigation/AppHeader.tsx', imports: ['Plus'] },
    { file: 'src/components/pos/AddCustomerDialog.tsx', imports: ['Label'] },
    { file: 'src/components/reports/ReportsView.tsx', imports: ['Filter', 'Eye', 'Legend'] },
    { file: 'src/components/settings/PaymentMethodsSettings.tsx', imports: ['Building', 'Hash'] },
    { file: 'src/components/settings/SettingsView.tsx', imports: ['AlertDialogTrigger', 'Globe'] },
    { file: 'src/components/storefy-sidebar.tsx', imports: ['Clock', 'Layers', 'HelpCircle', 'Search', 'LogOut'] },
    { file: 'src/components/stores/CompactStoreSelector.tsx', imports: ['useState'] },
    { file: 'src/components/stores/CreateStoreDialog.tsx', imports: ['MapPin'] },
    { file: 'src/components/stores/StoreManagementView.tsx', imports: ['Trash2'] },
    { file: 'src/components/stores/StoreSelector.tsx', imports: ['Store', 'Sparkles', 'ArrowRight', 'LogOut', 'ShoppingBag', 'MapPin', 'User'] },
    { file: 'src/contexts/PermissionContext.tsx', imports: ['toast'] },
    { file: 'src/hooks/useRoleBasedAccess.ts', imports: ['FolderOpen', 'Truck', 'Clock'] },
    { file: 'src/pages/Index.tsx', imports: ['usePermissions'] },
    { file: 'src/pages/StoreLoginPage.tsx', imports: ['Store'] }
  ],
  
  // Prefix unused variables with underscore
  prefixUnusedVars: [
    { file: 'src/components/customers/CustomerStatusDialog.tsx', vars: ['isPinSession'] },
    { file: 'src/components/dashboard/widgets/ExpensesWidget.tsx', vars: ['from', 'currentStoreId', 'isPinSession'] },
    { file: 'src/components/expenses/ExpenseCategoriesView.tsx', vars: ['user'] },
    { file: 'src/components/expenses/ExpenseView.tsx', vars: ['user'] },
    { file: 'src/components/expenses/RecurringExpenseDialog.tsx', vars: ['expenseData'] },
    { file: 'src/components/expenses/RecurringExpensesView.tsx', vars: ['user'] },
    { file: 'src/components/inventory/AddProductDialog.tsx', vars: ['imageUrl'] },
    { file: 'src/components/inventory/DeleteProductDialog.tsx', vars: ['error'] },
    { file: 'src/components/inventory/InventoryView.tsx', vars: ['searchTerm', 'selectedCategory', 'categories'] },
    { file: 'src/components/inventory/ProductHistoryModal.tsx', vars: ['adjustmentTypeColors'] },
    { file: 'src/components/inventory/StockAdjustmentDialog.tsx', vars: ['quickAdjustment'] },
    { file: 'src/components/layby/LaybyView.tsx', vars: ['user'] },
    { file: 'src/components/layout/Sidebar.tsx', vars: ['mainNavItems', 'secondaryNavItems', 'currentStore', 'pinData', 'handleSignOut'] },
    { file: 'src/components/pos/POSView.tsx', vars: ['formatPaymentMethodDisplay', 'cartItems'] },
    { file: 'src/components/reports/ReportsView.tsx', vars: ['index'] },
    { file: 'src/components/settings/SettingsView.tsx', vars: ['getRolePermissions'] },
    { file: 'src/components/stores/CompactStoreSelector.tsx', vars: ['user'] },
    { file: 'src/components/stores/StoreSelector.tsx', vars: ['clearStoreSelection', 'signOut'] },
    { file: 'src/components/transactions/TransactionDetailsModal.tsx', vars: ['loading', 'transactionHistory', 'loadingHistory'] },
    { file: 'src/components/transactions/TransactionView.tsx', vars: ['user'] },
    { file: 'src/contexts/PermissionContext.tsx', vars: ['error'] },
    { file: 'src/hooks/use-toast.ts', vars: ['actionTypes'] },
    { file: 'src/hooks/useSupabaseClient.ts', vars: ['user'] },
    { file: 'src/lib/activityLogger.ts', vars: ['error'] },
    { file: 'src/lib/healthCheck.ts', vars: ['error'] },
    { file: 'src/lib/pinSessionFix.ts', vars: ['error'] },
    { file: 'src/lib/security.ts', vars: ['error'] },
    { file: 'src/pages/Index.tsx', vars: ['searchParams', 'setSearchParams'] },
    { file: 'src/utils/securityAudit.ts', vars: ['dbError', 'error', 'event'] }
  ]
};

// Function to fix unused imports
function fixUnusedImports(filePath, unusedImports) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  unusedImports.forEach(importName => {
    // Remove from import lists
    const patterns = [
      new RegExp(`,\\s*${importName}\\s*,`, 'g'),
      new RegExp(`,\\s*${importName}\\s*}`, 'g'),
      new RegExp(`{\\s*${importName}\\s*,`, 'g'),
      new RegExp(`{\\s*${importName}\\s*}`, 'g')
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          if (match.includes(',')) {
            return match.replace(new RegExp(`\\s*${importName}\\s*,?`), '');
          }
          return match.replace(new RegExp(`\\s*${importName}\\s*`), '');
        });
        modified = true;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed unused imports in ${filePath}`);
  }
}

// Function to prefix unused variables
function prefixUnusedVars(filePath, variables) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  variables.forEach(varName => {
    // Pattern to find variable declarations
    const patterns = [
      new RegExp(`const\\s+${varName}\\s*=`, 'g'),
      new RegExp(`let\\s+${varName}\\s*=`, 'g'),
      new RegExp(`var\\s+${varName}\\s*=`, 'g'),
      new RegExp(`const\\s+{[^}]*${varName}[^}]*}`, 'g'),
      new RegExp(`\\(([^)]*,\\s*)?${varName}(\\s*,[^)]*)?\\)\\s*=>`, 'g')
    ];

    patterns.forEach(pattern => {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          return match.replace(new RegExp(`\\b${varName}\\b`), `_${varName}`);
        });
        modified = true;
      }
    });
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Prefixed unused variables in ${filePath}`);
  }
}

// Apply fixes
console.log('🔧 Fixing unused imports...');
fixConfig.removeUnusedImports.forEach(({ file, imports }) => {
  fixUnusedImports(file, imports);
});

console.log('\n🔧 Prefixing unused variables...');
fixConfig.prefixUnusedVars.forEach(({ file, vars }) => {
  prefixUnusedVars(file, vars);
});

// Run ESLint fix again
console.log('\n🔧 Running ESLint fix...');
try {
  execSync('npm run lint:fix', { stdio: 'inherit' });
} catch (error) {
  console.log('ESLint fix completed with warnings');
}

// Final lint check
console.log('\n📊 Final lint check...');
try {
  const result = execSync('npm run lint', { encoding: 'utf8' });
  console.log(result);
} catch (error) {
  console.log(error.stdout);
}

console.log('\n🎉 Comprehensive lint fix completed!');
