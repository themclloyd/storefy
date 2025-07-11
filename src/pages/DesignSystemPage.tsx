/**
 * Design System Documentation Page
 * 
 * Showcases the QuickBooks/Intuit-inspired design system implementation
 * Provides comprehensive documentation and examples
 */

import React from 'react'
import { TokenShowcase } from '@/components/design-system/TokenShowcase'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DesignSystemPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Navigation */}
      <div className="sticky top-0 z-10 bg-surface-primary/95 backdrop-blur-sm border-b border-border-primary">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl">
        <TokenShowcase />
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-border-primary bg-surface-secondary">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-text-primary">
              Storefy Design System
            </h3>
            <p className="text-sm text-text-primary-muted">
              Inspired by QuickBooks/Intuit design principles for scalable, error-free design
            </p>
            <div className="flex justify-center gap-4 text-xs text-text-primary-muted">
              <span>Semantic Token Taxonomy</span>
              <span>•</span>
              <span>Content Design Guidelines</span>
              <span>•</span>
              <span>Accessible Components</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default DesignSystemPage
