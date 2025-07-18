import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function StoreSelectorSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header Skeleton */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header Section Skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          {/* Add Store Button Skeleton */}
          <div className="flex justify-center">
            <Skeleton className="h-9 w-24" />
          </div>

          {/* Store List Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-border">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-8 h-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Help Section Skeleton */}
          <div className="text-center">
            <Skeleton className="h-3 w-48 mx-auto" />
          </div>
        </div>
      </div>

      {/* Footer Skeleton */}
      <div className="border-t bg-muted/30">
        <div className="container py-4">
          <div className="flex items-center justify-between text-sm">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CompactStoreSelectorSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <Skeleton className="w-16 h-16 rounded-full mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32 mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="text-center space-y-2">
              <Skeleton className="w-6 h-6 rounded mx-auto" />
              <Skeleton className="h-5 w-24 mx-auto" />
              <Skeleton className="h-3 w-32 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="text-center space-y-4">
            <Skeleton className="h-3 w-40 mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-8 w-24 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function StoreListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-border rounded-lg p-4"
        >
          <div className="flex items-center space-x-4">
            <Skeleton className="w-8 h-8 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
