import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Eye, Activity, Lock, Users } from 'lucide-react';
import { securityAlertManager, SecurityEvent } from '@/lib/securityAlerts';
import { auditTrailManager, AuditEvent } from '@/lib/auditTrail';
import { authSecurityManager } from '@/lib/authSecurity';
import { useStore } from '@/contexts/StoreContext';

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
  const { currentStore } = useStore();
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentStore) {
      loadSecurityData();
    }
  }, [currentStore]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      
      // Load security statistics
      const [secStats, audStats] = await Promise.all([
        securityAlertManager.getSecurityStats(),
        auditTrailManager.getAuditStats(currentStore!.id)
      ]);

      setSecurityStats(secStats);
      setAuditStats(audStats);

      // Load recent events (would need to implement these methods)
      // setRecentEvents(await securityAlertManager.getRecentEvents(10));
      // setRecentAudits(await auditTrailManager.queryAuditTrail({ 
      //   store_id: currentStore!.id, 
      //   limit: 10 
      // }));

    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSecurityScore = (): { score: number; level: string; color: string } => {
    if (!securityStats) return { score: 0, level: 'Unknown', color: 'gray' };

    let score = 100;
    
    // Deduct points for security issues
    score -= securityStats.criticalEvents * 20;
    score -= securityStats.unresolvedEvents * 5;
    
    // Add points for good security practices
    const authMetrics = authSecurityManager.getSecurityMetrics();
    if (authMetrics.failedAttempts === 0) score += 10;

    score = Math.max(0, Math.min(100, score));

    let level = 'Excellent';
    let color = 'green';

    if (score < 60) {
      level = 'Poor';
      color = 'red';
    } else if (score < 80) {
      level = 'Fair';
      color = 'yellow';
    } else if (score < 90) {
      level = 'Good';
      color = 'blue';
    }

    return { score, level, color };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const securityScore = getSecurityScore();

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Security Dashboard
        </h2>
        <Button onClick={loadSecurityData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Security Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore.score}/100</div>
            <Badge variant={getSeverityColor(securityScore.color)}>
              {securityScore.level}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityStats?.criticalEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Unresolved Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityStats?.unresolvedEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityStats?.totalEvents || 0}
            </div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {securityStats?.criticalEvents > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {securityStats.criticalEvents} critical security events that require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="text-muted-foreground">No recent security events</p>
              ) : (
                <div className="space-y-2">
                  {recentEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">{event.description}</div>
                      </div>
                      <Badge variant={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold">{auditStats?.totalEvents || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{auditStats?.topActors?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Object.keys(auditStats?.eventsByType || {}).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Event Types</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Object.keys(auditStats?.eventsByAction || {}).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Action Types</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Authentication Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {authSecurityManager.getSecurityMetrics().totalAttempts}
                    </div>
                    <p className="text-sm text-muted-foreground">Login Attempts</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {authSecurityManager.getSecurityMetrics().failedAttempts}
                    </div>
                    <p className="text-sm text-muted-foreground">Failed Attempts</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {authSecurityManager.getSecurityMetrics().lockedAccounts}
                    </div>
                    <p className="text-sm text-muted-foreground">Locked Accounts</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {authSecurityManager.getSecurityMetrics().recentAttempts}
                    </div>
                    <p className="text-sm text-muted-foreground">Recent Activity</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      Require 2FA for admin accounts
                    </div>
                  </div>
                  <Badge variant="secondary">Recommended</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Account Lockout</div>
                    <div className="text-sm text-muted-foreground">
                      Lock accounts after 5 failed attempts
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Session Timeout</div>
                    <div className="text-sm text-muted-foreground">
                      Auto-logout after 1 hour of inactivity
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">CSRF Protection</div>
                    <div className="text-sm text-muted-foreground">
                      Protect against cross-site request forgery
                    </div>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
