import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createDirectOrder } from '../services/orderService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const JoinOrderDialog = ({ product, isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(product?.minOrderQty || 1);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmOrder = async () => {
    if (quantity < product.minOrderQty) {
      toast({
        title: 'Invalid Quantity',
        description: `The minimum order quantity is ${product.minOrderQty}.`,
        variant: 'destructive',
      });
      return;
    }
    if (quantity > product.availableQty) {
      toast({
        title: 'Invalid Quantity',
        description: `The maximum available quantity is ${product.availableQty}.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await createDirectOrder({ productId: product._id, quantity });
      toast({
        title: 'Order Placed!',
        description: `Your order for ${product.name} has been placed successfully.`,
      });
      queryClient.invalidateQueries(['orders']); // Invalidate orders to refetch
      onClose();
    } catch (error) {
      toast({
        title: 'Order Failed',
        description: error.response?.data?.message || 'There was an issue placing your order.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-slate-200 rounded-lg">
        <DialogHeader>
          <DialogTitle>Order {product.name}</DialogTitle>
          <DialogDescription>
            Enter the quantity you wish to order. The price is ₹{product.pricePerKg} per {product.unit}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="quantity" className="text-right">
              Quantity ({product.unit})
            </label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="col-span-3"
              min={product.minOrderQty}
              max={product.availableQty}
            />
          </div>
          <div className="text-sm text-gray-500">
            Minimum Order: {product.minOrderQty} {product.unit} | Available: {product.availableQty} {product.unit}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmOrder} disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Placing Order...</> : 'Confirm Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JoinOrderDialog;
