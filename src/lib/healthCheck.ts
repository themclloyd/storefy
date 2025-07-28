/**
 * Production health check utilities
 */

import React from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: HealthCheckResult[];
  timestamp: string;
}

/**
 * Check Supabase database connectivity
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const { data, _error } = await supabase
      .from('stores')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - start;
    
    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }
    
    return {
      service: 'database',
      status: responseTime < 1000 ? 'healthy' : 'degraded',
      responseTime,
      details: { recordCount: data?.length || 0 }
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check authentication service
 */
async function checkAuth(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const { data, _error } = await supabase.auth.getSession();
    const responseTime = Date.now() - start;
    
    if (error) {
      return {
        service: 'authentication',
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }
    
    return {
      service: 'authentication',
      status: responseTime < 500 ? 'healthy' : 'degraded',
      responseTime,
      details: { hasSession: !!data.session }
    };
  } catch (error) {
    return {
      service: 'authentication',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check local storage availability
 */
function checkLocalStorage(): HealthCheckResult {
  const start = Date.now();
  
  try {
    const testKey = '__health_check__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    const responseTime = Date.now() - start;
    
    if (retrieved !== testValue) {
      return {
        service: 'localStorage',
        status: 'unhealthy',
        responseTime,
        error: 'localStorage read/write failed'
      };
    }
    
    return {
      service: 'localStorage',
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      service: 'localStorage',
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'localStorage not available'
    };
  }
}

/**
 * Check if required environment variables are present
 */
function checkEnvironment(): HealthCheckResult {
  const start = Date.now();
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];
  
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  const responseTime = Date.now() - start;
  
  if (missing.length > 0) {
    return {
      service: 'environment',
      status: 'unhealthy',
      responseTime,
      error: `Missing environment variables: ${missing.join(', ')}`
    };
  }
  
  return {
    service: 'environment',
    status: 'healthy',
    responseTime,
    details: { configuredVars: requiredVars.length }
  };
}

/**
 * Perform comprehensive system health check
 */
export async function performHealthCheck(): Promise<SystemHealth> {
  const checks: HealthCheckResult[] = [];
  
  // Run all health checks
  checks.push(checkEnvironment());
  checks.push(checkLocalStorage());
  checks.push(await checkAuth());
  checks.push(await checkDatabase());
  
  // Determine overall health
  const unhealthyCount = checks.filter(check => check.status === 'unhealthy').length;
  const degradedCount = checks.filter(check => check.status === 'degraded').length;
  
  let overall: 'healthy' | 'unhealthy' | 'degraded';
  if (unhealthyCount > 0) {
    overall = 'unhealthy';
  } else if (degradedCount > 0) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  return {
    overall,
    checks,
    timestamp: new Date().toISOString()
  };
}

/**
 * Quick health check for critical services only
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    // Check environment
    const envCheck = checkEnvironment();
    if (envCheck.status === 'unhealthy') return false;
    
    // Quick database ping
    const { _error } = await supabase
      .from('stores')
      .select('count')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

/**
 * Health check component for development/admin use
 */
export function useHealthCheck() {
  const [health, setHealth] = React.useState<SystemHealth | null>(null);
  const [loading, setLoading] = React.useState(false);
  
  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const result = await performHealthCheck();
      setHealth(result);
    } catch (error) {
      setHealth({
        overall: 'unhealthy',
        checks: [{
          service: 'system',
          status: 'unhealthy',
          responseTime: 0,
          error: 'Health check failed to run'
        }],
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };
  
  return { health, loading, runHealthCheck };
}
