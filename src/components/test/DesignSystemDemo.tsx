import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  ShoppingCart,
  Star,
  Heart,
  Eye,
  Settings,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

export function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-light text-foreground">
            Storefy Design System
          </h1>
          <p className="text-lg text-muted-foreground">
            Modern square design with Lexend Deca font, light headers, fully rounded buttons & badges
          </p>
        </div>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Typography - Lexend Deca Font (Light Headers)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-light">Heading 1 - Light</h1>
              <h2 className="text-3xl font-light">Heading 2 - Light</h2>
              <h3 className="text-2xl font-normal">Heading 3 - Normal</h3>
              <h4 className="text-xl font-normal">Heading 4 - Normal</h4>
              <p className="text-base">Body text - Regular weight with good readability</p>
              <p className="text-sm text-muted-foreground">Small text - Muted foreground</p>
            </div>
          </CardContent>
        </Card>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Buttons - Fully Rounded with Enhanced Padding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="default">
                  <Plus className="h-4 w-4" />
                  Primary Button
                </Button>
                <Button variant="secondary">
                  <Edit className="h-4 w-4" />
                  Secondary
                </Button>
                <Button variant="outline">
                  <Filter className="h-4 w-4" />
                  Outline
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4" />
                  Destructive
                </Button>
                <Button variant="ghost">
                  <Eye className="h-4 w-4" />
                  Ghost
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button size="sm">
                  <Search className="h-4 w-4" />
                  Small
                </Button>
                <Button size="default">
                  <ShoppingCart className="h-4 w-4" />
                  Default
                </Button>
                <Button size="lg">
                  <Package className="h-4 w-4" />
                  Large
                </Button>
                <Button size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Badges - Fully Rounded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Badge variant="default">Default Badge</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="solid">Solid</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Form Elements Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Form Elements - Square Design
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Input</Label>
                  <Input id="email" type="email" placeholder="Enter your email" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">Search Input</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="search" placeholder="Search products..." className="pl-10" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">Square checkbox</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch id="notifications" />
                  <Label htmlFor="notifications">Rounded switch (functional)</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Cards - Square Design
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$12,345</div>
                  <p className="text-sm text-muted-foreground">+20% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-sm text-muted-foreground">+15% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+25%</div>
                  <p className="text-sm text-muted-foreground">Steady growth</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Icons Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Icons - Lucide React
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-4">
              {[
                Search, Filter, Grid3X3, List, Package, Users,
                DollarSign, TrendingUp, ShoppingCart, Star, Heart, Eye,
                Settings, Plus, Edit, Trash2
              ].map((Icon, index) => (
                <div key={index} className="flex flex-col items-center gap-2 p-2">
                  <Icon className="h-6 w-6" />
                  <span className="text-xs text-muted-foreground">{Icon.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
