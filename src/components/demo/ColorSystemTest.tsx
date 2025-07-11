import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Color System Test Component
 * Tests all QuickBooks color classes to ensure they render correctly
 */
export function ColorSystemTest() {
  const colorTests = [
    {
      name: 'QuickBooks Green',
      prefix: 'qb-green',
      description: 'Primary brand color #2CA01C'
    },
    {
      name: 'QuickBooks Blue', 
      prefix: 'qb-blue',
      description: 'Secondary brand color'
    },
    {
      name: 'QuickBooks Orange',
      prefix: 'qb-orange', 
      description: 'Warning/accent color'
    },
    {
      name: 'QuickBooks Purple',
      prefix: 'qb-purple',
      description: 'Accent color'
    }
  ]

  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-qb-green-600 mb-2">Color System Test</h1>
        <p className="text-muted-foreground">
          Testing all QuickBooks color classes to ensure proper rendering
        </p>
      </div>

      {/* Color Palette Test */}
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Color Palette</CardTitle>
          <CardDescription>
            All color shades should render correctly with consistent naming
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {colorTests.map((color) => (
              <div key={color.prefix}>
                <h3 className="text-lg font-semibold mb-3">{color.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{color.description}</p>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {shades.map((shade) => (
                    <div key={shade} className="text-center">
                      <div 
                        className={`w-12 h-12 rounded-lg shadow-sm bg-${color.prefix}-${shade} border border-border`}
                        title={`${color.prefix}-${shade}`}
                      />
                      <div className="text-xs mt-1 text-muted-foreground">{shade}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Component Test */}
      <Card>
        <CardHeader>
          <CardTitle>Component Color Test</CardTitle>
          <CardDescription>
            Testing colors in actual UI components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Buttons */}
            <div>
              <h4 className="font-medium mb-2">Buttons</h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="default">Primary (QB Green)</Button>
                <Button variant="secondary">Secondary (QB Blue)</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <h4 className="font-medium mb-2">Badges</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            {/* Alerts */}
            <div>
              <h4 className="font-medium mb-2">Alerts</h4>
              <div className="space-y-2">
                <Alert variant="default">
                  <AlertDescription>Default alert using QuickBooks colors</AlertDescription>
                </Alert>
                <Alert variant="success">
                  <AlertDescription>Success alert with QuickBooks green</AlertDescription>
                </Alert>
                <Alert variant="warning">
                  <AlertDescription>Warning alert with QuickBooks orange</AlertDescription>
                </Alert>
                <Alert variant="info">
                  <AlertDescription>Info alert with QuickBooks blue</AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Color Test */}
      <Card>
        <CardHeader>
          <CardTitle>Text Color Test</CardTitle>
          <CardDescription>
            Testing text colors across the palette
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {colorTests.map((color) => (
              <div key={color.prefix}>
                <h4 className="font-medium mb-2">{color.name} Text</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[400, 500, 600, 700, 800].map((shade) => (
                    <div key={shade} className={`text-${color.prefix}-${shade}`}>
                      Sample text {shade}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Border Test */}
      <Card>
        <CardHeader>
          <CardTitle>Border Color Test</CardTitle>
          <CardDescription>
            Testing border colors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colorTests.map((color) => (
              <div 
                key={color.prefix}
                className={`p-4 border-2 border-${color.prefix}-500 rounded-lg`}
              >
                <div className="text-sm font-medium">{color.name}</div>
                <div className="text-xs text-muted-foreground">border-{color.prefix}-500</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ColorSystemTest
