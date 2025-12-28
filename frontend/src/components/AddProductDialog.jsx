import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct } from '../services/productService'; // Import updateProduct
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';

const categories = [
  "Handwoven Textiles",
  "Pottery & Ceramics",
  "Jewelry & Accessories",
  "Woodcraft & Bamboo",
  "Leather & Handbags",
  "Home Décor & Furnishings",
  "Traditional Paintings & Art",
  "Eco-friendly & Recycled Products",
  "Other"
];
const units = ["kg", "litre", "piece", "packet", "box"];

const AddProductDialog = ({ isOpen, onClose, productToEdit }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerKg: '',
    category: '',
    unit: 'kg',
    minOrderQty: '',
    isPrepped: false,
    availableQty: '',
    image: null, // For new file upload
    imageUrl: '', // For existing image URL
    shippingZones: '', // NEW
    shippingCost: '', // NEW
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        pricePerKg: productToEdit.pricePerKg || '',
        category: productToEdit.category || '',
        unit: productToEdit.unit || 'kg',
        minOrderQty: productToEdit.minOrderQty || '',
        isPrepped: productToEdit.isPrepped || false,
        availableQty: productToEdit.availableQty || '',
        image: null, // No file selected initially for edit
        imageUrl: productToEdit.imageUrl || '',
        shippingZones: productToEdit.shipping?.zones?.join(', ') || '', // NEW
        shippingCost: productToEdit.shipping?.cost || '', // NEW
      });
    } else {
      // Reset form for add mode
      setFormData({ name: '', description: '', pricePerKg: '', category: '', unit: 'kg', minOrderQty: '', isPrepped: false, availableQty: '', image: null, imageUrl: '', shippingZones: '', shippingCost: '' });
    }
  }, [productToEdit]);

  const { mutate: submitProduct, isPending } = useMutation({
    mutationFn: (data) => {
      if (productToEdit) {
        return updateProduct(productToEdit._id, data);
      } else {
        return createProduct(data);
      }
    },
    onSuccess: (response) => {
      toast({
        title: productToEdit ? "Product Updated!" : "Product Added!",
        description: `${response.data.product?.name || response.data.name} is now available in the marketplace.`,
      });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.response?.data?.msg || "Could not save the product.",
        variant: "destructive",
      });
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (checked) => {
      setFormData(prev => ({ ...prev, isPrepped: checked }));
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setFormData(prev => ({ ...prev, image: file, imageUrl: URL.createObjectURL(file) })); // Store file and create preview URL
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Client-side validation for numeric fields
    if (isNaN(Number(formData.pricePerKg)) || Number(formData.pricePerKg) <= 0) {
      toast({ title: "Validation Error", description: "Price per unit must be a positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(Number(formData.minOrderQty)) || Number(formData.minOrderQty) <= 0) {
      toast({ title: "Validation Error", description: "Minimum order quantity must be a positive number.", variant: "destructive" });
      return;
    }
    if (isNaN(Number(formData.availableQty)) || Number(formData.availableQty) < 0) {
      toast({ title: "Validation Error", description: "Available quantity must be a non-negative number.", variant: "destructive" });
      return;
    }
    if (!formData.category) {
      toast({ title: "Validation Error", description: "Please select a category.", variant: "destructive" });
      return;
    }


    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('pricePerKg', formData.pricePerKg);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('unit', formData.unit);
    formDataToSend.append('minOrderQty', formData.minOrderQty);
    formDataToSend.append('isPrepped', formData.isPrepped);
    formDataToSend.append('availableQty', formData.availableQty);
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    } else if (formData.imageUrl) { // If no new image, but existing imageUrl, send it
      formDataToSend.append('imageUrl', formData.imageUrl);
    }
    // Append shipping details only if they are not empty
    if (formData.shippingZones) {
      formDataToSend.append('shippingZones', formData.shippingZones);
    }
    if (formData.shippingCost) {
      formDataToSend.append('shippingCost', formData.shippingCost);
    }

    submitProduct(formDataToSend);
  };

  return (
   <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-gradient-to-r from-green-50 via-white to-gray-50 rounded-xl shadow-2xl border p-6 sm:p-8 w-full max-w-xl mx-auto">
  <DialogHeader>
    <DialogTitle className="text-xl sm:text-1xl font-bold text-green-700">
      {productToEdit ? "Edit Product" : "Add New Product"}
    </DialogTitle>
    <DialogDescription className="text-gray-700  sm: text-sm sm:text-base">
      {productToEdit ? "Make changes to your product details." : "Fill in the details below to list a new item in the marketplace."}
    </DialogDescription>
  </DialogHeader>
  <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-1 text-sm sm:text-base">
    <div>
      <Label htmlFor="name" className="font-semibold text-gray-700">Product Name</Label>
      <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" required />
    </div>
    <div>
      <Label htmlFor="description" className="font-semibold text-gray-700">Description</Label>
      <Textarea id="description" name="description" value={formData.description} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" required />
    </div>
    <div className="grid grid-cols-2 gap-2 sm:gap-2">
      <div>
        <Label htmlFor="pricePerKg" className="font-semibold text-gray-700">Price (per unit)</Label>
        <Input id="pricePerKg" name="pricePerKg" value={formData.pricePerKg} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" required />
      </div>
      <div>
        <Label htmlFor="unit" className="font-semibold text-gray-700">Unit</Label>
        <select id="unit" name="unit" value={formData.unit} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition">
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
    </div>
    <div>
      <Label htmlFor="category" className="font-semibold text-gray-700">Category</Label>
      <select id="category" name="category" value={formData.category} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition">
        <option value="">Select category</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div>
        <Label htmlFor="minOrderQty" className="font-semibold text-gray-700">Min. Order Qty</Label>
        <Input id="minOrderQty" name="minOrderQty" value={formData.minOrderQty} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" required />
      </div>
      <div>
        <Label htmlFor="availableQty" className="font-semibold text-gray-700">Available Qty</Label>
        <Input id="availableQty" name="availableQty" value={formData.availableQty} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" required />
      </div>
    </div>
    <div>
      <Label className="font-semibold text-gray-700">Image</Label>
      <Input type="file" accept="image/*" onChange={handleFile} className="px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
      {formData.imageUrl && !formData.image && <img src={formData.imageUrl} alt="Preview" className="mt-2 rounded-lg w-24 h-24 sm:w-32 sm:h-32 object-cover border shadow" />}
    </div>
    <div className="flex items-center gap-2 sm:gap-3">
      <Switch checked={formData.isPrepped} onCheckedChange={handleSwitchChange} className="focus:ring-2 focus:ring-green-400" />
      <span className="text-gray-700 text-sm sm:text-base">Pre-prepared item? (e.g., batter)</span>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      <div>
        <Label htmlFor="shippingZones" className="font-semibold text-gray-700">Shipping Zones</Label>
        <Input id="shippingZones" name="shippingZones" value={formData.shippingZones} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
      </div>
      <div>
        <Label htmlFor="shippingCost" className="font-semibold text-gray-700">Shipping Cost</Label>
        <Input id="shippingCost" name="shippingCost" value={formData.shippingCost} onChange={handleChange} className="mt-1 px-2 py-1 sm:px-3 sm:py-2 w-full rounded-lg border focus:outline-none focus:ring-2 focus:ring-green-400 transition" />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit" className="bg-green-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg shadow-lg hover:bg-green-800 transition font-semibold flex items-center justify-center gap-2 w-full">
        {isPending && <Loader2 className="animate-spin w-4 h-4" />} {productToEdit ? "Save Changes" : "Add Product"}
      </Button>
    </DialogFooter>
  </form>
</DialogContent>
</Dialog>
  );
};

export default AddProductDialog;
