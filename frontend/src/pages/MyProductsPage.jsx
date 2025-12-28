import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProducts, deleteProduct } from '../services/productService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Pencil, Trash } from 'lucide-react';
import AddProductDialog from '@/components/AddProductDialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MyProductsPage = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);

  const { data: productsData, isLoading: isLoadingProducts, isError: isProductsError } = useQuery({
    queryKey: ['myProducts'],
    queryFn: getMyProducts,
  });
  const myProducts = productsData?.data || [];

  const handleEditClick = (product) => {
    setProductToEdit(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = async (productId) => {
    try {
      await deleteProduct(productId);
      queryClient.invalidateQueries(['myProducts']);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">My Products</h1>
          <p className="text-gray-500 mt-1">Manage all products you have listed.</p>
        </div>
        <Button
          onClick={() => setIsAddProductDialogOpen(true)}
          className="shadow-lg transform hover:scale-105 bg-gradient-to-r from-green-500 to-green-600 text-white"
        >
          Add New Product
        </Button>
      </header>

      {/* Add Product Dialog */}
      <AddProductDialog
        isOpen={isAddProductDialogOpen}
        onClose={() => setIsAddProductDialogOpen(false)}
      />

      {/* Product List */}
      <Card className="shadow-xl rounded-2xl hover:shadow-2xl transition-shadow bg-white border border-gray-100">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">Product List</CardTitle>
          <CardDescription className="text-gray-500">All products you have listed.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : isProductsError ? (
            <p className="text-center text-red-600 py-6">Error loading products.</p>
          ) : myProducts.length > 0 ? (
            <Table className="table-auto border-separate border-spacing-0 w-full rounded-lg overflow-hidden">
              <TableHeader>
                <TableRow className="bg-gray-50 text-gray-700 uppercase text-sm tracking-wide">
                  <TableHead className="px-4 py-3 text-left">Image</TableHead>
                  <TableHead className="px-4 py-3 text-left">Name</TableHead>
                  <TableHead className="px-4 py-3 text-right">Price</TableHead>
                  <TableHead className="px-4 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myProducts.map((product) => (
                  <TableRow
                    key={product._id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <TableCell className="px-4 py-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-xl shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 shadow-inner">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium text-gray-900">{product.name}</TableCell>
                    <TableCell className="px-4 py-3 text-right text-gray-700 font-semibold">
                      ₹{product.pricePerKg}/{product.unit}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-gray-100 hover:scale-105 transition-transform"
                        onClick={() => handleEditClick(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="hover:scale-105 transition-transform"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              product and remove its data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(product._id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-gray-400 py-16">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">You haven't added any products yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      {productToEdit && (
        <AddProductDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          productToEdit={productToEdit}
        />
      )}
    </div>
  );
};

export default MyProductsPage;
