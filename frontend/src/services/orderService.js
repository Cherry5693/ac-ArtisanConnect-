import api from './axiosConfig';

/**
 * Fetches all direct orders the current user is a participant in.
 * Used for the "My Orders" page for buyers.
 */
export const getMyDirectOrders = () => {
  return api.get('/orders/my-orders');
};

/**
 * Fetches all direct orders for products belonging to the current artisan.
 * Used for the "Artisan Dashboard".
 */
export const getArtisanDirectOrders = () => {
  return api.get('/orders/artisan-orders');
};

/**
 * Creates a new direct order.
 * @param {string} productId - The ID of the product.
 * @param {number} quantity - The quantity the buyer is ordering.
 */
export const createDirectOrder = (productId, quantity) => {
  return api.post('/orders', { productId, quantity });
};

/**
 * Modifies a user's quantity in an open direct order.
 * @param {string} orderId - The ID of the direct order.
 * @param {number} newQuantity - The new quantity for the user.
 */
export const modifyOrder = (orderId, newQuantity) => {
  return api.put(`/orders/${orderId}/modify`, { quantity: newQuantity });
};

/**
 * Retrieves tracking information and event history for a specific order.
 * @param {string} orderId - The ID of the order to track.
 */
export const getOrderTracking = (orderId) => {
  return api.get(`/orders/${orderId}/track`);
};

export const approveOrder = (orderId) => {
  return api.put(`/orders/${orderId}/approve`);
};

export const rejectOrder = (orderId) => {
  return api.put(`/orders/${orderId}/reject`);
};

export const markOrderAsDelivered = (orderId) => {
  return api.put(`/orders/${orderId}/deliver`);
};

export const getOrderSummary = (orderId) => {
  return api.get(`/orders/${orderId}/summary`);
};

export const getArtisanAnalytics = () => {
  return api.get('/artisans/analytics');
};

export const getArtisanGroupOrders = () => {
  return api.get('/orders/artisan-group-orders');
};

export const cancelOrder = (orderId, cancellationMessage) => {
  return api.patch(`/orders/${orderId}/cancel`, { cancellationMessage });
};

export const createGroupOrder = (productId, quantity, groupId) => {
  return api.post('/orders/group', { productId, quantity, groupId });
};