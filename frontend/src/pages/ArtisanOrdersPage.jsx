import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getArtisanDirectOrders, approveOrder, rejectOrder, markOrderAsDelivered } from '../services/orderService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../context/AuthContext';
import { Loader2, CheckCircle, XCircle, Truck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ArtisanOrdersPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ['artisanOrders'],
    queryFn: getArtisanDirectOrders,
    enabled: user?.role === 'artisan', // Only fetch if user is an artisan
  });

  const orders = ordersData?.data || [];

  const approveMutation = useMutation({
    mutationFn: approveOrder,
    onSuccess: () => {
      toast({ title: "Order Approved!", description: "The order has been approved and is now processing." });
      queryClient.invalidateQueries({ queryKey: ['artisanOrders'] });
    },
    onError: (err) => {
      toast({ title: "Approval Failed", description: err.response?.data?.msg || "Could not approve order.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onSuccess: () => {
      toast({ title: "Order Rejected!", description: "The order has been rejected." });
      queryClient.invalidateQueries({ queryKey: ['artisanOrders'] });
    },
    onError: (err) => {
      toast({ title: "Rejection Failed", description: err.response?.data?.msg || "Could not reject order.", variant: "destructive" });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: markOrderAsDelivered,
    onSuccess: () => {
      toast({ title: "Order Delivered!", description: "The order has been marked as delivered." });
      queryClient.invalidateQueries({ queryKey: ['artisanOrders'] });
    },
    onError: (err) => {
      toast({ title: "Delivery Update Failed", description: err.response?.data?.msg || "Could not mark order as delivered.", variant: "destructive" });
    },
  });

  const handleApprove = (orderId) => {
    approveMutation.mutate(orderId);
  };

  const handleReject = (orderId) => {
    rejectMutation.mutate(orderId);
  };

  const handleDeliver = (orderId) => {
    deliverMutation.mutate(orderId);
  };

  const OrderCard = ({ order }) => {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>{order.productId?.name}</CardTitle>
            <Badge variant="outline" className="capitalize">{order.status}</Badge>
          </div>
          <CardDescription>Order ID: {order._id.substring(0, 8)}...</CardDescription>
          <CardDescription>Buyer: {order.buyer?.name || 'N/A'}</CardDescription>
          <CardDescription>Quantity: {order.quantity} {order.productId?.unit}</CardDescription>
          <CardDescription>Delivery Date: {new Date(order.deliveryDate).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-end justify-end gap-2">
          {order.status === 'open' && (
            <>
              <Button
                size="sm"
                onClick={() => handleApprove(order._id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(order._id)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />Reject
              </Button>
            </>
          )}
          {order.status === 'approved' && (
            <Button
              size="sm"
              onClick={() => handleDeliver(order._id)}
              disabled={deliverMutation.isPending}
            >
              <Truck className="w-4 h-4 mr-2" />Mark as Delivered
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (isError) return <div className="text-center py-12 text-destructive">Error fetching artisan orders.</div>;
  if (user?.role !== 'artisan') return <div className="text-center py-12 text-destructive">Access Denied: Not an Artisan.</div>;

  const pendingOrders = orders.filter(o => o.status === 'open');
  const approvedOrders = orders.filter(o => o.status === 'approved');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const rejectedOrders = orders.filter(o => o.status === 'rejected');

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Artisan Orders</h1>
        <p className="text-muted-foreground">Manage incoming orders for your products.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedOrders.length})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({deliveredOrders.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>No pending orders.</p></div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>No approved orders.</p></div>
          )}
        </TabsContent>

        <TabsContent value="delivered" className="mt-4">
          {deliveredOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deliveredOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>No delivered orders.</p></div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedOrders.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rejectedOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 rounded-lg"><p>No rejected orders.</p></div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArtisanOrdersPage;
