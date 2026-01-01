import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';

const EditProfileDialog = ({ isOpen, onClose, currentUser }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: authUser, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    businessName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        businessName: currentUser.businessName || currentUser.companyName || '',
        address: {
          street: currentUser.address?.street || '',
          city: currentUser.address?.city || '',
          state: currentUser.address?.state || '',
          zipCode: currentUser.address?.zipCode || currentUser.address?.zip || '',
        },
      });
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      queryClient.invalidateQueries(['userProfile']);
      // Update local storage user data if email was changed
      if (data.user && data.user.email !== authUser.email) {
        const updatedUser = { ...authUser, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Profile Update Failed',
        description: error.response?.data?.msg || 'An error occurred while updating your profile.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty address fields if they are not required
    const addressToSend = Object.fromEntries(Object.entries(formData.address).filter(([, value]) => value !== ''));
    
    const dataToSend = {
      name: formData.name,
      email: formData.email,
      businessName: formData.businessName,
      address: addressToSend,
    };

    // Remove fields that are empty strings or not applicable to the user's role
    if (authUser.role === 'buyer') {
      delete dataToSend.businessName;
    } else if (authUser.role === 'artisan') {
      delete dataToSend.name;
      dataToSend.companyName = dataToSend.businessName; // Backend expects companyName for artisan
      delete dataToSend.businessName;
    }

    updateProfileMutation.mutate(dataToSend);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="bg-gradient-to-r from-blue-50 via-white to-gray-50 rounded-xl shadow-2xl border p-8 max-w-lg mx-auto">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-blue-700">Edit Profile</DialogTitle>
      <DialogDescription className="text-gray-700 mt-2">Make changes to your profile here. Click save when you're done.</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-5">
      {authUser.role === 'buyer' && (
        <div>
          <Label htmlFor="name" className="font-semibold text-lg text-blue-700">Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full" required />
        </div>
      )}
      {authUser.role === 'artisan' && (
        <div>
          <Label htmlFor="businessName" className="font-semibold text-lg text-orange-700">Business Name</Label>
          <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-400 transition w-full" required />
        </div>
      )}
      <div>
        <Label htmlFor="email" className="font-semibold text-lg text-gray-700">Email</Label>
        <Input id="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 px-3 py-2 bg-white rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 transition w-full" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address.street" className="font-medium text-gray-700">Street</Label>
          <Input id="address.street" name="address.street" value={formData.address.street} onChange={handleChange} className="mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 w-full" />
        </div>
        <div>
          <Label htmlFor="address.city" className="font-medium text-gray-700">City</Label>
          <Input id="address.city" name="address.city" value={formData.address.city} onChange={handleChange} className="mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address.state" className="font-medium text-gray-700">State</Label>
          <Input id="address.state" name="address.state" value={formData.address.state} onChange={handleChange} className="mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 w-full" />
        </div>
        <div>
          <Label htmlFor="address.zipCode" className="font-medium text-gray-700">Zip Code</Label>
          <Input id="address.zipCode" name="address.zipCode" value={formData.address.zipCode} onChange={handleChange} className="mt-1 px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-400 w-full" />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" className="bg-blue-700 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-800 font-semibold flex items-center gap-2">
          {updateProfileMutation.isPending && <Loader2 className="animate-spin w-5 h-5" />} Save changes
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>

  );
};

export default EditProfileDialog;