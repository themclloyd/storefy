import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, 
  Calendar, 
  Zap, 
  AlertTriangle, 
  Gift,
  CreditCard,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarSubscriptionStatus() {
  // Component disabled - subscription management moved to settings
  return null;
}

// Compact version for when sidebar is collapsed
export function SidebarSubscriptionBadge() {
  // Component disabled - subscription management moved to settings
  return null;
}
