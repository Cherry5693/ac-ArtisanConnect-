import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyDirectOrders, cancelOrder } from '../services/orderService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { Loader2, Truck, Star } from 'lucide-react';
import OrderTrackingDialog from '@/components/OrderTrackingDialog';
import ReviewDialog from '@/components/ReviewDialog';
import { toast } from '../hooks/use-toast';

const Orders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['myOrders'],
    queryFn: getMyDirectOrders,
  });
  const orders = ordersData?.data || [];

  const handleTrackClick = (order) => {
    if (order.status === 'open') {
      toast({ title: 'Waiting for artisan approval' });
    } else {
      setSelectedOrder(order);
      setIsTrackOpen(true);
    }
  };

  const handleReviewClick = (order) => {
    setSelectedOrder(order);
    setIsReviewOpen(true);
  };

  const OrderCard = ({ order }) => {
    const statusText =
      order.status === 'open' ? 'Waiting for Artisan Approval' : order.status;

    const cancelMutation = useMutation({
      mutationFn: (orderId) =>
        cancelOrder(orderId, 'Buyer cancelled the order.'),
      onSuccess: () => {
        toast({
          title: 'Order Cancelled!',
          description: 'The order has been removed from your list.',
        });
        queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      },
      onError: (err) => {
        toast({
          title: 'Cancellation Failed',
          description:
            err.response?.data?.msg || 'An error occurred during cancellation.',
          variant: 'destructive',
        });
      },
    });

    const handleCancelClick = () => cancelMutation.mutate(order._id);

    return (
      <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all">
        <CardHeader className="bg-gradient-to-r  rounded-t-2xl p-5">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-gray-800">
              {order.productId?.name}
            </CardTitle>
            <Badge variant="secondary" className="capitalize px-2 py-1 text-sm">
              {statusText}
            </Badge>
          </div>
          <CardDescription className="text-gray-500 text-sm">
            Order ID: {order._id.substring(0, 8)}...
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 text-sm">
              Quantity:
            </span>
            <span className="font-bold text-xl text-green-700">
              {order.quantity} {order.productId?.unit}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            {order.status === 'completed' ? (
              <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg shadow-sm"
                onClick={() => handleReviewClick(order)}
              >
                <Star className="w-4 h-4 mr-2" />
                Rate Product
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                onClick={() => handleTrackClick(order)}
              >
                <Truck className="w-4 h-4 mr-2" />
                Track
              </Button>
            )}

            {(order.status === 'open' || order.status === 'approved') && (
              <Button
                size="sm"
                variant="destructive"
                className="rounded-lg"
                onClick={handleCancelClick}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  'Cancel'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isError) {
    return (
      <div className="text-center py-12 text-red-600 font-medium">
        Error fetching your orders.
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status === 'open');
  const processingOrders = orders.filter(
    (o) => o.status === 'approved' || o.status === 'processing'
  );
  const completedOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'delivered'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-x-hidden">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            My Orders
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mt-2">
            Track, manage, and review your orders
          </p>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-xl bg-gray-100 p-1">
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-white data-[state=active]:shadow text-gray-800 rounded-lg"
            >
              Active ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="processing"
              className="data-[state=active]:bg-white data-[state=active]:shadow text-gray-800 rounded-lg"
            >
              Processing ({processingOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-white data-[state=active]:shadow text-gray-800 rounded-lg"
            >
              Completed ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Orders */}
          <TabsContent value="active" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {activeOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white/70 backdrop-blur rounded-lg text-gray-600 shadow">
                You have no active orders.
              </div>
            )}
          </TabsContent>

          {/* Processing Orders */}
          <TabsContent value="processing" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
              </div>
            ) : processingOrders.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {processingOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white/70 backdrop-blur rounded-lg text-gray-600 shadow">
                No orders are currently being processed.
              </div>
            )}
          </TabsContent>

          {/* Completed Orders */}
          <TabsContent value="completed" className="mt-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
              </div>
            ) : completedOrders.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {completedOrders.map((order) => (
                  <OrderCard key={order._id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white/70 backdrop-blur rounded-lg text-gray-600 shadow">
                No orders have been completed yet.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <OrderTrackingDialog
          orderId={selectedOrder?._id}
          isOpen={isTrackOpen}
          onClose={() => setIsTrackOpen(false)}
        />
        <ReviewDialog
          product={selectedOrder?.productId}
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
        />
      </div>
    </div>
  );
};

export default Orders;
