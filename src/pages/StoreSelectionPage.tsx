import React from 'react';
import { useUser, useAuthLoading } from '@/stores/authStore';
import { useStores, useStoreLoading } from '@/stores/storeStore';
import { Navigate } from 'react-router-dom';
import { PremiumStoreSelector } from '@/components/stores/PremiumStoreSelector';
import { Loader2 } from 'lucide-react';

export default function StoreSelectionPage() {
  const { user, loading: authLoading } = useAuth();
  const { currentStore, loading: storeLoading } = useStore();

  // Check for PIN session
  const pinSession = localStorage.getItem('pin_session');
  const hasPinSession = pinSession !== null;

  // Show loading while checking authentication
  if (authLoading || storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to landing page if not authenticated and no PIN session
  if (!user && !hasPinSession) {
    return <Navigate to="/" replace />;
  }

  // PIN users should not access this page - they have direct store access
  if (hasPinSession) {
    return <Navigate to="/dashboard" replace />;
  }

  // If user already has a store selected, redirect to dashboard
  if (currentStore) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show premium store selector for main users without a selected store
  return <PremiumStoreSelector />;
}
