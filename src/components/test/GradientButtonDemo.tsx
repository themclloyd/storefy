import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingActionButton, ExtendedFloatingActionButton } from '@/components/ui/floating-action-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Download, Share, Heart, ShoppingCart, Star } from 'lucide-react';

export function GradientButtonDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Gradient Button Showcase
          </h1>
          <p className="text-xl text-muted-foreground">
            Beautiful green gradient buttons inspired by agricultural productivity
          </p>
        </div>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>
              Different button styles with the new gradient theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Default Gradient Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Gradient Buttons (Default)</h3>
              <div className="flex flex-wrap gap-4">
                <Button>Default Gradient</Button>
                <Button variant="gradient">Explicit Gradient</Button>
                <Button size="sm">Small Gradient</Button>
                <Button size="lg">Large Gradient</Button>
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Solid Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Solid Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="solid">Solid Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Action Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button>
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button>
                  <Heart className="mr-2 h-4 w-4" />
                  Favorite
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Gradient Badges</CardTitle>
            <CardDescription>
              Status indicators and labels with gradient styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Badge>Default Gradient</Badge>
              <Badge variant="solid">Solid Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
            <div className="flex flex-wrap gap-4">
              <Badge>
                <Star className="mr-1 h-3 w-3" />
                Featured
              </Badge>
              <Badge>
                <Plus className="mr-1 h-3 w-3" />
                New
              </Badge>
              <Badge>Premium</Badge>
              <Badge>Best Seller</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Floating Action Buttons</CardTitle>
            <CardDescription>
              Gradient floating action buttons for quick actions
            </CardDescription>
          </CardHeader>
          <CardContent className="relative h-64 bg-muted/20 rounded-lg">
            <p className="text-sm text-muted-foreground p-4">
              Floating action buttons are positioned at the bottom-right corner
            </p>
            
            {/* Regular FAB */}
            <FloatingActionButton
              onClick={() => alert('FAB clicked!')}
              icon={Plus}
              label="Add Item"
              size="md"
              position="bottom-right"
            />
          </CardContent>
        </Card>

        {/* Agricultural Theme Example */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              Agricultural Productivity Theme
            </CardTitle>
            <CardDescription className="text-green-600 dark:text-green-300">
              Buttons designed for agricultural enterprise applications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Analyzing Conditions
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  We develop a scheme for the use of drugs for you, taking into account 
                  the characteristics of your crops and the type of soil.
                </p>
                <Button className="w-full">
                  Start Analysis
                </Button>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Increase Productivity
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  The use of our programs allows you to increase the yield by 10-12% 
                  due to the removal of stress factors.
                </p>
                <Button className="w-full">
                  View Programs
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">🌱</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">Expert works for you</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">💰</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">You only pay for results</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">🛡️</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">We protect the crop</p>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white font-bold">🌾</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">You win under any conditions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
