import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ProductCardSkeleton = () => {
  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-xl bg-white border">
      {/* Image skeleton */}
      <Skeleton className="h-48 w-full" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      
      <CardContent className="flex flex-col justify-between flex-1 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <div className="text-right space-y-1">
            <Skeleton className="h-3 w-16 ml-auto" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
      
      {/* Button skeleton */}
      <CardContent className="pt-0">
        <Skeleton className="h-10 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
};

export const ProductCardSkeletonGrid = ({ count = 6 }) => {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

