import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ProfileSkeleton = () => {
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

