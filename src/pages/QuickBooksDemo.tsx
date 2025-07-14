import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Bell,
  Settings,
  HelpCircle,
  Plus,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Building,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  Filter,
  Zap,
  Shield,
  Brain,
  Moon,
  Sun,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from "lucide-react";

const QuickBooksDemo = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("This month");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [notifications, setNotifications] = useState(3);

  // Mock QuickBooks data
  const businessSnapshot = {
    bankBalance: 84684.23,
    accountsReceivable: 5281.52,
    accountsPayable: 1602.00,
    netIncome: 15618.94
  };

  const salesData = {
    thisMonth: 25000,
    lastMonth: 22000,
    growth: 13.6
  };

  const expensesData = {
    thisMonth: 9381.06,
    lastMonth: 8200,
    growth: 14.4
  };

  const recentTransactions = [
    { id: 1, date: "01/15/2025", description: "Starbucks", category: "Meals & Entertainment", amount: -12.50, type: "expense" },
    { id: 2, date: "01/15/2025", description: "ABC Company", category: "Sales", amount: 1250.00, type: "income" },
    { id: 3, date: "01/14/2025", description: "Office Depot", category: "Office Supplies", amount: -89.99, type: "expense" },
    { id: 4, date: "01/14/2025", description: "XYZ Corp", category: "Consulting", amount: 2500.00, type: "income" },
    { id: 5, date: "01/13/2025", description: "Verizon", category: "Phone", amount: -156.78, type: "expense" }
  ];

  const invoices = [
    { id: "INV-001", customer: "Acme Corp", amount: 2500.00, dueDate: "01/30/2025", status: "sent" },
    { id: "INV-002", customer: "Beta LLC", amount: 1800.00, dueDate: "02/05/2025", status: "draft" },
    { id: "INV-003", customer: "Gamma Inc", amount: 3200.00, dueDate: "01/25/2025", status: "overdue" }
  ];

  // AI-Powered Insights (2025 Feature)
  const aiInsights = [
    {
      type: "prediction",
      title: "Cash Flow Forecast",
      message: "You'll have $12,500 more cash next month based on pending invoices",
      confidence: 94,
      action: "View forecast",
      icon: Target,
      color: "text-blue-600"
    },
    {
      type: "alert",
      title: "Payment Risk",
      message: "Gamma Inc invoice is 5 days overdue - consider following up",
      confidence: 87,
      action: "Send reminder",
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      type: "opportunity",
      title: "Tax Savings",
      message: "You could save $890 by categorizing recent office supplies",
      confidence: 92,
      action: "Review expenses",
      icon: Sparkles,
      color: "text-green-600"
    }
  ];

  // Modern Features (2025)
  const modernFeatures = [
    { name: "Payment Dispute Protection", status: "active", description: "Up to $25K coverage" },
    { name: "AI Expense Categorization", status: "active", description: "99.2% accuracy" },
    { name: "Real-time Bank Sync", status: "active", description: "Updated 2 min ago" },
    { name: "QuickBooks Checking", status: "available", description: "3.00% APY" }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Enhanced QuickBooks Header */}
      <header className={`border-b px-6 py-4 transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">QB</span>
              </div>
              <span className={`text-xl font-semibold transition-colors ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>QuickBooks</span>
              <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
                <Zap className="w-3 h-3 mr-1" />
                AI Enhanced
              </Badge>
            </div>

            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-1">Dashboard</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Banking</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Sales</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Expenses</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Projects</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Workers</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Reports</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Taxes</a>
              <a href="#" className={`hover:text-blue-600 transition-colors ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>Accounting</a>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Ask AI or search anything..."
                className={`pl-10 w-80 transition-colors ${
                  isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300'
                }`}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Brain className="w-4 h-4 text-blue-600" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="relative"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {notifications}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="sm">
              <Shield className="w-5 h-5 text-green-600" />
            </Button>

            <Button variant="ghost" size="sm">
              <HelpCircle className="w-5 h-5" />
            </Button>

            <Button variant="ghost" size="sm">
              <Settings className="w-5 h-5" />
            </Button>

            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-blue-200">
              <span className="text-white text-sm font-medium">JD</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-6">
        {/* AI Insights Banner */}
        {showAIInsights && (
          <div className={`mb-6 p-4 rounded-lg border transition-colors ${
            isDarkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Insights Ready
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    3 new recommendations to improve your business
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  View All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAIInsights(false)}
                >
                  ×
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Get a snapshot of your business</p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            >
              <option>This month</option>
              <option>Last month</option>
              <option>This quarter</option>
              <option>This year</option>
            </select>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        {/* Business Snapshot Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Bank accounts</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(businessSnapshot.bankBalance)}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Accounts receivable</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(businessSnapshot.accountsReceivable)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Accounts payable</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(businessSnapshot.accountsPayable)}</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Net income</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(businessSnapshot.netIncome)}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales and Expenses Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Sales</CardTitle>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(salesData.thisMonth)}</span>
                  <div className="flex items-center space-x-1 text-green-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm font-medium">{salesData.growth}%</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  vs {formatCurrency(salesData.lastMonth)} last month
                </div>
                <div className="h-20 bg-gradient-to-r from-green-100 to-green-50 rounded-lg flex items-end justify-center">
                  <div className="text-xs text-gray-500 mb-2">Sales trend visualization</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Expenses</CardTitle>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(expensesData.thisMonth)}</span>
                  <div className="flex items-center space-x-1 text-red-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm font-medium">{expensesData.growth}%</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  vs {formatCurrency(expensesData.lastMonth)} last month
                </div>
                <div className="h-20 bg-gradient-to-r from-red-100 to-red-50 rounded-lg flex items-end justify-center">
                  <div className="text-xs text-gray-500 mb-2">Expenses trend visualization</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - Recent Activity and Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Recent transactions</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Filter className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{transaction.description}</span>
                        <span className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{transaction.category}</span>
                        <span>{transaction.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-3">
                  <Button variant="outline" className="w-full">
                    View all transactions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="bg-white border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Invoices</CardTitle>
                <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Create invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{invoice.id}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{invoice.customer}</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              invoice.status === 'sent' ? 'default' :
                              invoice.status === 'overdue' ? 'destructive' :
                              'secondary'
                            }
                            className="text-xs"
                          >
                            {invoice.status}
                          </Badge>
                          <span>Due {invoice.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-3">
                  <Button variant="outline" className="w-full">
                    View all invoices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI-Powered Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {aiInsights.map((insight, index) => (
            <Card key={index} className={`transition-all duration-300 hover:shadow-lg ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    insight.type === 'prediction' ? 'bg-blue-100' :
                    insight.type === 'alert' ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <insight.icon className={`w-5 h-5 ${insight.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {insight.title}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {insight.confidence}% confident
                      </Badge>
                    </div>
                    <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {insight.message}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {insight.action}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modern Features Status */}
        <Card className={`mb-8 transition-colors ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <CardHeader>
            <CardTitle className={`flex items-center space-x-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>QuickBooks 2025 Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modernFeatures.map((feature, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div>
                    <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {feature.name}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {feature.description}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {feature.status === 'active' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced QuickBooks Footer Actions */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get more done with QuickBooks</h3>
            <p className="text-gray-600 mb-4">Explore features to help grow your business</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Accept payments
              </Button>
              <Button variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Manage employees
              </Button>
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Track inventory
              </Button>
              <Button variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule appointments
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickBooksDemo;
