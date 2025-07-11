# 🏪 Storefy - Unified Retail Hub System Overview

## 📋 Quick Reference
- **Project**: Storefy Unified Retail Hub
- **Build Tool**: **Vite** ⚡ (Fast ES modules-based build tool)
- **Tech Stack**: React 18 + TypeScript + **Vite** + Supabase + Tailwind CSS
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Architecture**: Multi-tenant retail management system

## ⚡ Vite Configuration & Features

### Vite Config (`vite.config.ts`)
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,  // Development server port
    hmr: {
      port: 8080,
      host: 'localhost'  // Improved HMR reliability
    },
    watch: {
      usePolling: true,  // Better file watching
      interval: 100
    }
  },
  plugins: [
    react(),  // Using SWC for faster compilation
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // Path aliases
    },
  },
}));
```

### Vite Development Features
- **⚡ Lightning Fast HMR** - Instant hot module replacement
- **🔥 Fast Refresh** - React state preservation during updates
- **🚀 SWC Compiler** - Faster than Babel for TypeScript/JSX
- **📦 ES Modules** - Native browser module support
- **🌐 Dev Server**: `localhost:8080` with IPv6 support
- **🎯 Instant Cold Start** - No bundling in development

### Build & Scripts
```json
{
  "scripts": {
    "dev": "vite",                    // Start Vite dev server
    "build": "vite build",            // Production build
    "build:dev": "vite build --mode development",
    "preview": "vite preview",        // Preview production build
    "lint": "eslint ."
  }
}
```

## 🗄️ Database Schema (Supabase)

### Core Tables Structure
```
profiles (1 record)
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── display_name (TEXT)
├── avatar_url (TEXT)
└── timestamps

stores (1 record)
├── id (UUID, PK)
├── owner_id (UUID, FK → auth.users)
├── name (TEXT)
├── address, phone, email (TEXT)
├── currency (TEXT, default: 'USD')
├── tax_rate (DECIMAL, default: 0.0825)
├── store_code (TEXT, UNIQUE) ← For team access
└── timestamps

store_members (0 records)
├── id (UUID, PK)
├── store_id (UUID, FK → stores)
├── user_id (UUID, FK → auth.users)
├── role (ENUM: owner|manager|cashier)
├── pin (TEXT) ← For PIN-based login
├── is_active (BOOLEAN)
└── timestamps

categories (3 records)
├── id (UUID, PK)
├── store_id (UUID, FK → stores)
├── name (TEXT)
├── description (TEXT)
└── created_at

products (4 records)
├── id (UUID, PK)
├── store_id (UUID, FK → stores)
├── category_id (UUID, FK → categories)
├── name, sku, description (TEXT)
├── price, cost (DECIMAL)
├── stock_quantity, low_stock_threshold (INTEGER)
├── is_active (BOOLEAN)
└── timestamps

customers (4 records)
├── id (UUID, PK)
├── store_id (UUID, FK → stores)
├── name, email, phone, address (TEXT)
├── total_orders (INTEGER)
├── total_spent (DECIMAL)
├── status (TEXT: active|inactive|vip)
└── timestamps

orders (0 records)
├── id (UUID, PK)
├── store_id (UUID, FK → stores)
├── customer_id (UUID, FK → customers)
├── cashier_id (UUID, FK → auth.users)
├── order_number (TEXT)
├── subtotal, discount_amount, tax_amount, total (DECIMAL)
├── discount_code (TEXT)
├── status (TEXT: pending|completed|cancelled|refunded)
├── payment_method (TEXT)
└── created_at

order_items (0 records)
├── id (UUID, PK)
├── order_id (UUID, FK → orders)
├── product_id (UUID, FK → products)
├── quantity (INTEGER)
├── unit_price, total_price (DECIMAL)
```

### Security Functions
- `user_can_access_store(_store_id)` - Check store access
- `user_owns_store(_store_id)` - Check store ownership
- `has_store_access(_store_id, _min_role)` - Role-based access
- `initialize_sample_data(_store_id)` - Setup new store data

## 🚀 Vite-Based Application Architecture

### Project Structure (Vite + React)
```
├── index.html              # Vite entry point (not in public/)
├── vite.config.ts          # Vite configuration
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind CSS config
├── src/
│   ├── main.tsx           # Vite app entry point
│   ├── App.tsx            # Root React component
│   ├── components/
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard view
│   ├── pos/           # Point of Sale system
│   ├── inventory/     # Product management
│   ├── customers/     # Customer management
│   ├── reports/       # Analytics & reporting
│   ├── settings/      # Store configuration
│   ├── stores/        # Multi-store management
│   ├── layout/        # Sidebar, navigation
│   └── ui/           # shadcn/ui components
├── contexts/
│   ├── AuthContext.tsx    # User authentication
│   └── StoreContext.tsx   # Store selection & management
├── hooks/             # Custom React hooks
├── integrations/
│   └── supabase/      # Database client & types
│   ├── pages/            # Route components
│   └── lib/              # Utilities
├── public/               # Static assets
└── supabase/            # Database migrations
```

### Vite-Specific Features Used
- **Path Aliases**: `@/*` resolves to `./src/*`
- **TypeScript Support**: Native TS compilation
- **CSS Processing**: PostCSS + Tailwind integration
- **Asset Handling**: Automatic optimization
- **Environment Variables**: `.env` file support
- **Tree Shaking**: Dead code elimination

### Key Features
1. **Multi-Store Support** - Users can own/manage multiple stores
2. **Role-Based Access** - Owner, Manager, Cashier permissions
3. **PIN Authentication** - Quick staff login without accounts
4. **Store Codes** - Team members join via unique codes
5. **Real-time Updates** - Supabase real-time subscriptions
6. **Inventory Management** - Stock tracking, low-stock alerts
7. **POS System** - Transaction processing
8. **Customer Management** - CRM with purchase history
9. **Reporting** - Sales analytics and insights
10. **Responsive Design** - Mobile-friendly interface

### Authentication Flow
```
1. Email/Password → Full user account
2. PIN Login → Staff quick access (no account needed)
3. Store Code → Join existing store as team member
```

## 🔧 Vite Development Workflow

### Starting Development
```bash
npm run dev          # Starts Vite dev server on :8080
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

### Environment
- **Vite Dev Server** on port 8080 with HMR
- **TypeScript** with path aliases (`@/*` → `./src/*`)
- **Supabase Project**: `irmuaqhwmtgbkftqlohx`
- **Database**: PostgreSQL 17.4.1

### Key Dependencies (Vite Ecosystem)
```json
{
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.5.0",  // React + SWC
    "vite": "^5.4.1",                      // Build tool
    "typescript": "^5.5.3",               // TypeScript
    "tailwindcss": "^3.4.11",             // CSS framework
    "postcss": "^8.4.47",                 // CSS processing
    "eslint": "^9.9.0"                    // Code linting
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.50.3",   // Database client
    "@tanstack/react-query": "^5.56.2",   // Data fetching
    "react-router-dom": "^6.26.2",        // Routing
    "react-hook-form": "^7.53.0",         // Forms
    "zod": "^3.23.8"                      // Validation
  }
}
```

## 📊 Current Data Status
- **1 Store** configured with sample data
- **3 Categories**: Beverages, Food, Accessories
- **4 Products**: Coffee, Tea, Mug, Cookies (with pricing/inventory)
- **4 Customers**: Various status levels (active, vip, inactive)
- **0 Orders**: Ready for first transactions
- **System Status**: Production-ready for POS operations

## 🔐 Security & Performance
- **Vite Build Optimization** - Code splitting, tree shaking
- **Supabase RLS** - Row-level security for data isolation
- **TypeScript** - Type safety throughout application
- **React Query** - Efficient data caching and synchronization
- **JWT Authentication** - Secure user sessions

## 🚨 Important Vite Notes
- Entry point is `index.html` in root (not `public/index.html`)
- Uses ES modules natively in development
- Fast cold start and instant HMR
- Optimized production builds with Rollup
- Native TypeScript support without additional configuration
- CSS imports work directly in components

## 📞 Quick Commands
```bash
# Development
npm run dev              # Start Vite dev server
npm run build           # Production build
npm run preview         # Preview build locally

# Database
supabase start          # Start local Supabase
supabase db reset       # Reset database with migrations
```

## 📞 Support & Maintenance
- **Vite Version**: 5.4.1 with React SWC plugin
- **Supabase project region**: `ca-central-1`
- **Database version**: PostgreSQL 17.4.1
- **All migrations tracked** in `supabase/migrations/`
- **TypeScript types auto-generated** in `src/integrations/supabase/types.ts`

This **Vite-based architecture** provides lightning-fast development experience with instant hot reloading and optimized production builds for your retail management system.
