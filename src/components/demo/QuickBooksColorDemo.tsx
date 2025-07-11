/**
 * QuickBooks Color Demo Component
 * 
 * Demonstrates the applied QuickBooks color palette across all UI components
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  TrendingUp,
  DollarSign,
  Package,
  Users
} from 'lucide-react'

export function QuickBooksColorDemo() {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          QuickBooks Color Palette Applied
        </h1>
        <p className="text-muted-foreground">
          Showcasing the #2CA01C primary color and full QuickBooks palette across all components
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons with QuickBooks Colors</CardTitle>
          <CardDescription>
            Primary actions use QuickBooks Green (#2CA01C), secondary uses QuickBooks Blue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button>Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="link">Link Button</Button>
            <Button variant="destructive">Delete Action</Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges with Semantic Colors</CardTitle>
          <CardDescription>
            Status indicators using QuickBooks color palette
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Error</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Components</CardTitle>
          <CardDescription>
            Feedback messages using QuickBooks semantic colors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your store settings have been updated successfully.
            </AlertDescription>
          </Alert>

          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              You have 3 products with low stock levels.
            </AlertDescription>
          </Alert>

          <Alert variant="info">
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              New features are available in your dashboard.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to sync inventory. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dashboard Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Metrics</CardTitle>
          <CardDescription>
            Key performance indicators with QuickBooks styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-qb-green-50 to-qb-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-qb-green-600 font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-qb-green-800">$12,345</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-qb-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-qb-blue-50 to-qb-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-qb-blue-600 font-medium">Orders</p>
                    <p className="text-2xl font-bold text-qb-blue-800">1,234</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-qb-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-qb-orange-50 to-qb-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-qb-orange-600 font-medium">Products</p>
                    <p className="text-2xl font-bold text-qb-orange-800">567</p>
                  </div>
                  <Package className="h-8 w-8 text-qb-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-qb-purple-50 to-qb-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-qb-purple-600 font-medium">Customers</p>
                    <p className="text-2xl font-bold text-qb-purple-800">890</p>
                  </div>
                  <Users className="h-8 w-8 text-qb-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Indicators</CardTitle>
          <CardDescription>
            Progress bars using QuickBooks Green
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sales Target Progress</Label>
            <Progress value={75} className="h-3" />
            <p className="text-sm text-muted-foreground">75% of monthly target achieved</p>
          </div>
          <div className="space-y-2">
            <Label>Inventory Sync</Label>
            <Progress value={45} className="h-3" />
            <p className="text-sm text-muted-foreground">45% complete</p>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>
            Input fields with QuickBooks focus states
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store Name</Label>
              <Input id="store-name" placeholder="Enter store name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Swatches */}
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Color Palette</CardTitle>
          <CardDescription>
            Official QuickBooks colors now applied throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-qb-green-500 rounded-lg mx-auto shadow-md"></div>
              <div className="text-sm">
                <div className="font-semibold">QuickBooks Green</div>
                <div className="text-muted-foreground">#2CA01C</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-qb-blue-500 rounded-lg mx-auto shadow-md"></div>
              <div className="text-sm">
                <div className="font-semibold">QuickBooks Blue</div>
                <div className="text-muted-foreground">Secondary</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-qb-orange-500 rounded-lg mx-auto shadow-md"></div>
              <div className="text-sm">
                <div className="font-semibold">QuickBooks Orange</div>
                <div className="text-muted-foreground">Warning</div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-qb-purple-500 rounded-lg mx-auto shadow-md"></div>
              <div className="text-sm">
                <div className="font-semibold">QuickBooks Purple</div>
                <div className="text-muted-foreground">Accent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
