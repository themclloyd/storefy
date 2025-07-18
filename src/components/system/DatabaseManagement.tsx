import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Terminal, 
  Download, 
  Upload, 
  RefreshCw,
  Play,
  Clock,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InlineLoading } from '@/components/ui/modern-loading';

interface DatabaseStats {
  totalTables: number;
  totalRows: number;
  databaseSize: string;
  lastBackup: string;
  connectionStatus: 'healthy' | 'warning' | 'error';
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

export function DatabaseManagement() {
  const [stats, setStats] = useState<DatabaseStats>({
    totalTables: 0,
    totalRows: 0,
    databaseSize: '0 MB',
    lastBackup: 'Never',
    connectionStatus: 'healthy'
  });
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);

  useEffect(() => {
    fetchDatabaseStats();
    loadQueryHistory();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching database statistics...');

      // Get table information
      const tables = [
        'profiles', 'stores', 'products', 'categories', 'suppliers',
        'transactions', 'transaction_items', 'customers', 'expenses',
        'layby_sales', 'layby_payments'
      ];

      let totalRows = 0;
      let healthyTables = 0;

      // Count rows in each table
      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (!error && count !== null) {
            totalRows += count;
            healthyTables++;
          }
        } catch (error) {
          console.warn(`Could not access table ${table}:`, error);
        }
      }

      const connectionStatus: 'healthy' | 'warning' | 'error' = 
        healthyTables === tables.length ? 'healthy' :
        healthyTables > tables.length / 2 ? 'warning' : 'error';

      setStats({
        totalTables: tables.length,
        totalRows,
        databaseSize: '125 MB', // This would come from database metrics in production
        lastBackup: new Date().toLocaleDateString(),
        connectionStatus
      });

      console.log('📊 Database stats fetched:', { totalRows, healthyTables, connectionStatus });
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast.error('Failed to fetch database statistics');
    } finally {
      setLoading(false);
    }
  };

  const loadQueryHistory = () => {
    const history = localStorage.getItem('admin_query_history');
    if (history) {
      setQueryHistory(JSON.parse(history));
    }
  };

  const saveQueryHistory = (query: string) => {
    const newHistory = [query, ...queryHistory.filter(q => q !== query)].slice(0, 10);
    setQueryHistory(newHistory);
    localStorage.setItem('admin_query_history', JSON.stringify(newHistory));
  };

  const executeQuery = async () => {
    if (!queryText.trim()) {
      toast.error('Please enter a query');
      return;
    }

    setQueryLoading(true);
    const startTime = Date.now();

    try {
      console.log('🔄 Executing query:', queryText);

      // Basic query validation
      const query = queryText.trim().toLowerCase();
      if (query.includes('drop') || query.includes('delete') || query.includes('truncate')) {
        if (!confirm('This query contains potentially destructive operations. Are you sure you want to continue?')) {
          setQueryLoading(false);
          return;
        }
      }

      // Execute the query using Supabase's RPC or direct query
      const { data, error } = await supabase.rpc('execute_sql', { query_text: queryText });

      const executionTime = Date.now() - startTime;

      if (error) {
        console.error('Query error:', error);
        toast.error(`Query failed: ${error.message}`);
        setQueryResult({
          columns: ['Error'],
          rows: [[error.message]],
          rowCount: 0,
          executionTime
        });
        return;
      }

      // Format results
      if (Array.isArray(data) && data.length > 0) {
        const columns = Object.keys(data[0]);
        const rows = data.map(row => columns.map(col => row[col]));
        
        setQueryResult({
          columns,
          rows,
          rowCount: data.length,
          executionTime
        });
      } else {
        setQueryResult({
          columns: ['Result'],
          rows: [['Query executed successfully']],
          rowCount: 0,
          executionTime
        });
      }

      saveQueryHistory(queryText);
      toast.success(`Query executed in ${executionTime}ms`);

    } catch (error) {
      console.error('Query execution error:', error);
      toast.error('Failed to execute query');
      setQueryResult({
        columns: ['Error'],
        rows: [['Failed to execute query']],
        rowCount: 0,
        executionTime: Date.now() - startTime
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="gap-1"><CheckCircle className="w-3 h-3" />Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="gap-1"><AlertTriangle className="w-3 h-3" />Warning</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <InlineLoading />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalTables}</div>
                    <p className="text-sm text-muted-foreground">Tables</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.totalRows.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Rows</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{stats.databaseSize}</div>
                    <p className="text-sm text-muted-foreground">Database Size</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-sm font-bold">{stats.lastBackup}</div>
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    {getStatusBadge(stats.connectionStatus)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Query Console */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            SQL Query Console
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">SQL Query</label>
            <Textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="min-h-[120px] font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={executeQuery} disabled={queryLoading || !queryText.trim()}>
              {queryLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Query
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setQueryText('')}>
              Clear
            </Button>
            <Button variant="outline" onClick={fetchDatabaseStats}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
          </div>

          {/* Query History */}
          {queryHistory.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Recent Queries</label>
              <div className="space-y-1">
                {queryHistory.slice(0, 5).map((query, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto p-2 text-left"
                    onClick={() => setQueryText(query)}
                  >
                    <code className="text-xs">{query.substring(0, 80)}...</code>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Query Results */}
          {queryResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Query Results</label>
                <Badge variant="outline">
                  {queryResult.rowCount} rows • {queryResult.executionTime}ms
                </Badge>
              </div>
              
              <div className="border rounded-lg overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {queryResult.columns.map((column, index) => (
                        <th key={index} className="p-2 text-left font-medium border-b">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2">
                            {cell !== null ? String(cell) : <span className="text-gray-400">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Database Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Database
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Data
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Backup Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
