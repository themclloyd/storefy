# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the comprehensive Role-Based Access Control (RBAC) system implemented for the Storefy application. The system ensures that cashiers, managers, and shop owners have appropriate access levels with proper security measures.

## Security Architecture

### 1. Database Security Functions

#### Enhanced Security Functions
- `validate_pin_session()` - Securely validates PIN-based login sessions
- `check_user_permission()` - Comprehensive permission checking for actions
- `get_user_effective_role()` - Gets user's role considering PIN sessions
- `can_access_page()` - Page-level access control
- `log_security_event()` - Security audit logging

#### Row Level Security (RLS)
- Enhanced RLS policies for all tables
- Role-based data access restrictions
- Secure data isolation between stores

### 2. Frontend Security Components

#### Permission Context (`PermissionContext.tsx`)
- Centralized permission management
- Real-time permission validation
- PIN session security validation
- Security audit logging integration

#### Route Protection (`ProtectedRoute.tsx`)
- Page-level access control
- Unauthorized access prevention
- Automatic redirection for unauthorized users
- Security event logging

#### Secure Action Components (`SecureAction.tsx`)
- `SecureAction` - Conditional component rendering
- `SecureButton` - Permission-checked buttons
- `SecureForm` - Permission-validated forms
- `SecureField` - Role-based field access
- `SecureData` - Protected data rendering

### 3. Role-Based Access Hooks (`useRoleBasedAccess.ts`)
- `usePermission()` - Check specific permissions
- `usePageAccess()` - Validate page access
- `useRoleBasedRendering()` - Conditional rendering utilities
- `useSecureAction()` - Execute actions with permission checks
- `useRouteProtection()` - Route-level security
- `useRoleBasedNavigation()` - Dynamic navigation based on roles

## Role Permissions Matrix

### Shop Owner (Full Access)
- ✅ All system features
- ✅ Store management and settings
- ✅ Team member management
- ✅ Financial reports and data export
- ✅ Billing and subscription management
- ✅ Store deletion and ownership transfer

### Manager (Limited Administrative Access)
- ✅ Dashboard and analytics
- ✅ POS operations
- ✅ Inventory management
- ✅ Customer management
- ✅ Transaction processing
- ✅ Layby management
- ✅ Reports and analytics
- ✅ Expense management
- ✅ Category and supplier management
- ✅ Team member management (add/edit/remove)
- ❌ Store settings and configuration
- ❌ Billing and subscription management
- ❌ Store deletion or ownership transfer
- ❌ Critical system settings

### Cashier (Operational Access)
- ✅ Dashboard (basic view)
- ✅ POS operations
- ✅ Basic inventory viewing
- ✅ Customer management (basic)
- ✅ Transaction processing
- ✅ Layby operations
- ✅ Basic reporting
- ❌ Inventory management (add/edit/delete products)
- ❌ Category and supplier management
- ❌ Expense management
- ❌ Advanced reports
- ❌ Team member management
- ❌ Store settings

## Page Access Control

### Public Pages
- Landing page
- Authentication pages
- PIN login pages

### Protected Pages (Role-Based)
- **Dashboard**: All roles
- **POS**: All roles
- **Inventory**: Manager+ (Cashiers: view-only)
- **Products**: Manager+ (Cashiers: view-only)
- **Categories**: Manager+ only
- **Suppliers**: Manager+ only
- **Customers**: All roles
- **Transactions**: All roles (view permissions vary)
- **Layby**: All roles
- **Reports**: Manager+ only
- **Expenses**: Manager+ only
- **Settings**: Owner only

## Security Features

### 1. PIN Session Security
- Server-side PIN validation
- Session integrity checks
- Automatic session invalidation
- Tamper detection and prevention

### 2. Action-Level Security
- Permission checks before action execution
- Security audit logging for all actions
- Unauthorized action prevention
- Real-time permission validation

### 3. Data Protection
- Row-level security (RLS) policies
- Role-based data filtering
- Sensitive data masking
- Secure data access patterns

### 4. Audit Logging
- Comprehensive security event logging
- Failed access attempt tracking
- Suspicious activity detection
- Security report generation

## Implementation Examples

### Securing a Button
```tsx
<SecureButton 
  permission="manage_inventory" 
  onClick={handleDeleteProduct}
>
  Delete Product
</SecureButton>
```

### Conditional Component Rendering
```tsx
<SecureAction permission="manage_team">
  <TeamManagementPanel />
</SecureAction>
```

### Route Protection
```tsx
<ProtectedRoute requiredPage="settings">
  <SettingsView />
</ProtectedRoute>
```

### Permission Checking
```tsx
const { hasPermission } = usePermissions();
const canManageInventory = hasPermission('manage_inventory');
```

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security (database, API, frontend)
2. **Principle of Least Privilege**: Users get minimum required permissions
3. **Secure by Default**: All actions require explicit permission grants
4. **Audit Trail**: Comprehensive logging of all security-relevant events
5. **Session Security**: Secure PIN session management and validation
6. **Input Validation**: All user inputs validated and sanitized
7. **Error Handling**: Secure error messages without information leakage

## Manual Testing Checklist

### Role Switching Tests
- [ ] Test cashier cannot access manager features
- [ ] Test manager cannot access owner-only features
- [ ] Test PIN session role validation
- [ ] Test unauthorized page access attempts

### Action Security Tests
- [ ] Test secured buttons hide for unauthorized users
- [ ] Test secured forms prevent unauthorized submissions
- [ ] Test API calls respect role permissions
- [ ] Test data filtering works correctly

### Session Security Tests
- [ ] Test PIN session validation
- [ ] Test invalid PIN session handling
- [ ] Test session timeout behavior
- [ ] Test concurrent session management

### Audit Logging Tests
- [ ] Test security events are logged
- [ ] Test unauthorized access attempts logged
- [ ] Test successful actions logged
- [ ] Test audit log integrity

## Deployment Notes

1. Apply database migration: `20250715000001-enhance-rbac-security.sql`
2. Update frontend components to use secure components
3. Test role permissions thoroughly
4. Monitor security audit logs
5. Review and adjust permissions as needed

## Maintenance

- Regularly review audit logs for suspicious activity
- Update permissions as business requirements change
- Monitor for security vulnerabilities
- Keep security functions up to date
- Regular security assessments
