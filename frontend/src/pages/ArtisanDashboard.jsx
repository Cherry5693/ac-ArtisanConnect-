import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyProducts } from '../services/productService';
import { getArtisanDirectOrders, approveOrder, rejectOrder, markOrderAsDelivered, getArtisanAnalytics } from '../services/orderService';
import { getProfile } from '../services/authService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, TrendingUp, Clock, Truck } from 'lucide-react';
import AddProductDialog from '@/components/AddProductDialog';
import OrderTrackingDialog from '@/components/OrderTrackingDialog';
import { useState } from 'react';
import MonthlyRevenueChart from '@/components/MonthlyRevenueChart';
import TopProductsList from '@/components/TopProductsList';

const ArtisanDashboard = () => {
  const queryClient = useQueryClient();
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });
  const myProducts = productsData?.data || [];

  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useQuery({
    queryKey: ['artisanDirectOrders'],
    queryFn: getArtisanDirectOrders,
  });
  const directOrders = ordersData?.data || [];

  const { data: userProfileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });
  const userRevenue = userProfileData?.data?.revenue || 0;

  const { data: analyticsData, isLoading: isLoadingAnalytics, isError: isAnalyticsError } = useQuery({
    queryKey: ['artisanAnalytics'],
    queryFn: getArtisanAnalytics,
  });

  const approveMutation = useMutation({
    mutationFn: approveOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artisanDirectOrders'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['artisanDirectOrders'] }),
  });

  const deliverMutation = useMutation({
    mutationFn: markOrderAsDelivered,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisanDirectOrders'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['artisanAnalytics'] });
    },
    onError: (error) => console.error('Error marking order as delivered:', error),
  });

  const handleTrackClick = (order) => {
    setSelectedOrder(order);
    setIsTrackOpen(true);
  };

  const openOrders = directOrders.filter((order) => order.status === 'open');
  const approvedOrders = directOrders.filter((order) => order.status === 'approved');
  const completedOrders = directOrders
    .filter((order) => order.status === 'completed' || order.status === 'delivered')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const recentCompletedOrders = completedOrders.slice(0, 5);

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artisan Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and view incoming direct orders.</p>
        </div>
        <AddProductDialog />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingProducts ? <Loader2 className="h-6 w-6 animate-spin" /> : myProducts.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Direct Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : openOrders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Approved Direct Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingOrders ? <Loader2 className="h-6 w-6 animate-spin" /> : approvedOrders.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{isLoadingProfile ? <Loader2 className="h-6 w-6 animate-spin" /> : userRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 mb-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Direct Orders</CardTitle>
              <CardDescription>Direct orders that are open or approved.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : isOrdersError ? (
                <p className="text-destructive text-center py-4">Error loading orders.</p>
              ) : openOrders.length > 0 || approvedOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...openOrders, ...approvedOrders].map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.productId?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {order.quantity} {order.productId?.unit}
                        </TableCell>
                        <TableCell>{order.buyer?.name || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{order.status}</TableCell>
                        <TableCell>
                          {order.status === 'open' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className='bg-green-600 hover:bg-green-700 text-white rounded-lg'
                                onClick={() => approveMutation.mutate(order._id)}
                                disabled={approveMutation.isPending}
                              >
                                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => rejectMutation.mutate(order._id)}
                                disabled={rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
                              </Button>
                            </div>
                          )}
                          {order.status === 'approved' && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleTrackClick(order)}>
                                Track
                              </Button>
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg--700 text-white"
                                onClick={() => deliverMutation.mutate(order._id)}
                                disabled={deliverMutation.isPending}
                              >
                                {deliverMutation.isPending ? <Loader2 className="h-4 w-6 animate-spin" /> : 'Delivered'}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No incoming direct orders for your products yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
           <Card className="rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col justify-center h-full">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">My Products</CardTitle>
              <CardDescription className="text-gray-500">View and manage your products.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center h-full">
              <Link to="/my-products">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Go to My Products</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

     <div className="w-full px-3 sm:px-0 xxl:px-8 mb-8">
          <div className="w-full px-4 sm:px-0 xxl:px-8">
         <Card className="w-full max-w-40xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Completed Direct Orders</CardTitle>
                <CardDescription>Recently completed direct orders.</CardDescription>
              </div>
              <Link to="/completed-orders">
                <Button variant="outline">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : isOrdersError ? (
                <p className="text-destructive text-center py-4">Error loading orders.</p>
              ) : recentCompletedOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Buyer Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCompletedOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">{order.productId?.name || 'N/A'}</TableCell>
                        <TableCell>{order.buyer?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {order.buyer && order.buyer.address
                            ? [
                                order.buyer.address.street,
                                order.buyer.address.city,
                                order.buyer.address.zipCode,
                              ]
                                .filter(Boolean)
                                .join(', ')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {order.quantity} {order.productId?.unit}
                        </TableCell>
                        <TableCell className="capitalize">{order.status}</TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {order.deliveryDate
                            ? new Date(order.deliveryDate).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No completed direct orders yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAnalytics ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : isAnalyticsError ? (
                <p className="text-destructive text-center py-4">Error loading analytics.</p>
              ) : (
                <MonthlyRevenueChart data={analyticsData?.data?.monthlyRevenue || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {isLoadingAnalytics ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : isAnalyticsError ? (
            <p className="text-destructive text-center py-4">Error loading analytics.</p>
          ) : (
            <TopProductsList data={analyticsData?.data?.topProducts || []} />
          )}
        </div>
      </div>

      <OrderTrackingDialog
        orderId={selectedOrder?._id}
        isOpen={isTrackOpen}
        onClose={() => setIsTrackOpen(false)}
      />
    </div>
  );
};

export default ArtisanDashboard;