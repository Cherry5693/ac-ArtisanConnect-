import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProfile } from '../services/authService';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditProfileDialog from '../components/EditProfileDialog';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';

const BuyerProfile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: profileData, isLoading, isError } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getProfile,
  });

  const user = profileData?.data;

  if (isError) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <p>Error loading profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {isLoading ? (
        <ProfileSkeleton />
      ) : !user ? (
        <div className="text-center py-8">
          <p>No profile data available.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Name:</p>
                <p className="text-lg font-medium">{user.name || user.artisanName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email:</p>
                <p className="text-lg font-medium">{user.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Role:</p>
                <p className="text-lg font-medium capitalize">{user.role || 'Not set'}</p>
              </div>
              {user.businessName && (
                <div>
                  <p className="text-muted-foreground">Business Name:</p>
                  <p className="text-lg font-medium">{user.businessName}</p>
                </div>
              )}
            </div>
          </div>

          {user.address && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Address Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Street:</p>
                  <p className="text-lg font-medium">{user.address.street || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">City:</p>
                  <p className="text-lg font-medium">{user.address.city || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">State:</p>
                  <p className="text-lg font-medium">{user.address.state || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Zip Code:</p>
                  <p className="text-lg font-medium">{user.address.zipCode || 'Not set'}</p>
                </div>
                {user.address.coords && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Latitude:</p>
                      <p className="text-lg font-medium">{user.address.coords.lat}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Longitude:</p>
                      <p className="text-lg font-medium">{user.address.coords.lng}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <EditProfileDialog
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            currentUser={user}
          />
        </>
      )}
    </div>
  );
};

export default BuyerProfile;