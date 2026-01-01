import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const OrderCardSkeleton = () => {
  return (
    <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl">
      <CardHeader className="bg-gradient-to-r rounded-t-2xl p-5">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-32 mt-2" />
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
};

export const OrderCardSkeletonGrid = ({ count = 4 }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <OrderCardSkeleton key={index} />
      ))}
    </div>
  );
};

