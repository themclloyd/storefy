/**
 * Design Token Showcase Component
 * 
 * Demonstrates the QuickBooks/Intuit-inspired semantic token system
 * Provides visual documentation of the design system
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SemanticButton } from '@/components/ui/semantic-button'
import { designTokens } from '@/lib/design-tokens'
import { contentDesign } from '@/lib/content-design'

export function TokenShowcase() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">
          Storefy Design System
        </h1>
        <p className="text-text-primary-muted">
          Using QuickBooks official colors (#2CA01C) and Intuit design principles for error-free, scalable design
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-qb-green-500 rounded-full border border-border"></div>
            <span className="text-text-primary-muted">QuickBooks Green: #2CA01C</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-qb-blue-500 rounded-full border border-border"></div>
            <span className="text-text-primary-muted">QuickBooks Blue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-qb-orange-500 rounded-full border border-border"></div>
            <span className="text-text-primary-muted">QuickBooks Orange</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-qb-purple-500 rounded-full border border-border"></div>
            <span className="text-text-primary-muted">QuickBooks Purple</span>
          </div>
        </div>
      </div>

      {/* Design Principles */}
      <Card>
        <CardHeader>
          <CardTitle>Design Principles</CardTitle>
          <CardDescription>
            Following Intuit's proven approach to avoid common design system errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Semantic Token Taxonomy</h4>
              <p className="text-sm text-text-primary-muted">
                Element-Prominence-Purpose-State naming for clear, predictable tokens
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">High Use Case Coverage</h4>
              <p className="text-sm text-text-primary-muted">
                Broad semantic tokens reduce the need for component-specific styles
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Clear Content Guidelines</h4>
              <p className="text-sm text-text-primary-muted">
                Consistent voice, tone, and messaging across all interfaces
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Maintainable Architecture</h4>
              <p className="text-sm text-text-primary-muted">
                Semantic abstraction makes theming and updates effortless
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Color Tokens</CardTitle>
          <CardDescription>
            Colors organized by element type and semantic meaning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Surface Tokens */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary">Surface Tokens</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-surface-primary border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">surface-primary</div>
                  <div className="text-text-primary-muted">Main backgrounds</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-surface-secondary border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">surface-secondary</div>
                  <div className="text-text-primary-muted">Card backgrounds</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-surface-accent border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">surface-accent</div>
                  <div className="text-text-primary-muted">Brand highlights</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-surface-inverse border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">surface-inverse</div>
                  <div className="text-text-primary-muted">Dark surfaces</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status Tokens */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary">Status Tokens</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-status-positive border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">status-positive</div>
                  <div className="text-text-primary-muted">Success, growth</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-status-negative border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">status-negative</div>
                  <div className="text-text-primary-muted">Error, danger</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-status-warning border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">status-warning</div>
                  <div className="text-text-primary-muted">Caution, attention</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-md bg-status-info border border-border"></div>
                <div className="text-xs">
                  <div className="font-medium">status-info</div>
                  <div className="text-text-primary-muted">Information</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QuickBooks Official Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>QuickBooks Official Color Palette</CardTitle>
          <CardDescription>
            Using the official QuickBooks brand colors including #2CA01C primary green
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* QuickBooks Green */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">QuickBooks Green</h4>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border border-border bg-qb-green-${shade}`}></div>
                    <div className="text-xs">
                      <div className="font-medium">qb-green-{shade}</div>
                      {shade === 500 && <div className="text-qb-green-500 font-semibold">#2CA01C</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QuickBooks Blue */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">QuickBooks Blue</h4>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border border-border bg-qb-blue-${shade}`}></div>
                    <div className="text-xs">
                      <div className="font-medium">qb-blue-{shade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QuickBooks Orange */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">QuickBooks Orange</h4>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border border-border bg-qb-orange-${shade}`}></div>
                    <div className="text-xs">
                      <div className="font-medium">qb-orange-{shade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QuickBooks Purple */}
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">QuickBooks Purple</h4>
              <div className="space-y-2">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded border border-border bg-qb-purple-${shade}`}></div>
                    <div className="text-xs">
                      <div className="font-medium">qb-purple-{shade}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 bg-surface-accent rounded-lg">
            <h4 className="font-semibold text-text-primary mb-2">Usage Guidelines</h4>
            <ul className="text-sm text-text-primary-muted space-y-1">
              <li>• <strong>qb-green-500 (#2CA01C)</strong>: Primary brand color, use for main CTAs and brand elements</li>
              <li>• <strong>qb-blue-500</strong>: Secondary actions, informational elements</li>
              <li>• <strong>qb-orange-500</strong>: Warning states, attention-grabbing elements</li>
              <li>• <strong>qb-purple-500</strong>: Accent color for special features or premium content</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Semantic Button Examples</CardTitle>
          <CardDescription>
            Buttons using the Element-Prominence-Purpose taxonomy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Primary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <SemanticButton prominence="primary" purpose="default">
                  Save Changes
                </SemanticButton>
                <SemanticButton prominence="primary" purpose="positive">
                  Create Store
                </SemanticButton>
                <SemanticButton prominence="primary" purpose="negative">
                  Delete Item
                </SemanticButton>
                <SemanticButton prominence="primary" purpose="warning">
                  Archive Store
                </SemanticButton>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Secondary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <SemanticButton prominence="secondary">
                  Cancel
                </SemanticButton>
                <SemanticButton prominence="secondary" purpose="info">
                  View Details
                </SemanticButton>
                <SemanticButton prominence="secondary" purpose="positive">
                  Approve
                </SemanticButton>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Tertiary Actions</h4>
              <div className="flex flex-wrap gap-3">
                <SemanticButton prominence="tertiary">
                  Learn More
                </SemanticButton>
                <SemanticButton prominence="tertiary" purpose="info">
                  View Documentation
                </SemanticButton>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-text-primary">Accent Actions</h4>
              <div className="flex flex-wrap gap-3">
                <SemanticButton prominence="accent">
                  Get Started
                </SemanticButton>
                <SemanticButton prominence="accent" size="lg">
                  Upgrade Plan
                </SemanticButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Content Design Guidelines</CardTitle>
          <CardDescription>
            Voice, tone, and messaging principles inspired by QuickBooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">Voice Characteristics</h4>
              <div className="space-y-2">
                {Object.entries(contentDesign.voice).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">
                      {key}
                    </Badge>
                    <span className="text-sm text-text-primary-muted">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-text-primary">Writing Principles</h4>
              <div className="space-y-2">
                <div className="p-3 bg-surface-secondary rounded-md">
                  <div className="font-medium text-sm">✓ Good Example</div>
                  <div className="text-sm text-text-primary-muted">
                    "Your daily sales report is ready"
                  </div>
                </div>
                <div className="p-3 bg-status-negative-surface rounded-md">
                  <div className="font-medium text-sm">✗ Avoid</div>
                  <div className="text-sm text-text-primary-muted">
                    "Your comprehensive daily sales analytics compilation has been generated"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Why This Approach Works</CardTitle>
          <CardDescription>
            Benefits of following QuickBooks/Intuit design system principles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-status-positive">Avoids Common Errors</h4>
              <ul className="text-sm text-text-primary-muted space-y-1">
                <li>• No confusing token names</li>
                <li>• No component-specific color chaos</li>
                <li>• No inconsistent messaging</li>
                <li>• No maintenance nightmares</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-status-positive">Enables Success</h4>
              <ul className="text-sm text-text-primary-muted space-y-1">
                <li>• Clear semantic meaning</li>
                <li>• Easy theming and updates</li>
                <li>• Consistent user experience</li>
                <li>• Scalable design system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
