const router = require('express').Router();

//
// DEBUGGING ROUTE
router.get('/test', (req, res) => res.send('Hello from the test route!'));
//
//

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const chatController = require('../controllers/chatController');
const analyticsController = require('../controllers/analyticsController');

const { auth, authorize } = require('../middleware/middleware');
const upload = require('../middleware/upload'); // Import the upload middleware

// Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-password-reset-otp', authController.verifyPasswordResetOtp);
router.post('/verify-otp', authController.verifyOtp); // NEW: OTP Verification
router.post('/resend-otp', authController.resendOtp); // NEW: Resend OTP


// User Profile (for any authenticated user)
router.get('/profile', auth, userController.getProfile);
router.patch('/profile', auth, userController.updateProfile); // NEW: Update user profile
router.patch('/profile/location', auth, userController.updateProfileLocation); // NEW: Update user location

// Products
// Accept up to 10 images for a product (field name: 'images')
router.post('/products', auth, authorize('artisan'), upload.array('images', 10), productController.createProduct);
router.patch('/products/:id', auth, authorize('artisan'), upload.array('images', 10), productController.updateProduct); // NEW: Update product
router.get('/products', auth, productController.getProducts);
router.get('/products/my-products', auth, authorize('artisan'), productController.getMyProducts);
router.get('/products/:id', productController.getProductById);
router.post('/products/:id/review', auth, productController.createProductReview); // NEW
router.delete('/products/:id', auth, authorize('artisan'), productController.deleteProduct); // NEW: Delete product

// Direct Orders
router.post('/orders', auth, orderController.createDirectOrder);
router.get('/orders/my-orders', auth, orderController.getMyDirectOrders);
router.get('/orders/artisan-orders', auth, authorize('artisan'), orderController.getArtisanDirectOrders);
router.get('/orders/:orderId/track', auth, orderController.getOrderTracking);
router.put('/orders/:orderId/approve', auth, authorize('artisan'), orderController.approveDirectOrder);
router.put('/orders/:orderId/reject', auth, authorize('artisan'), orderController.rejectDirectOrder);
router.put('/orders/:orderId/deliver', auth, authorize('artisan'), orderController.markOrderAsDelivered);
router.patch('/orders/:orderId/cancel', auth, authorize('buyer'), orderController.cancelOrder);
router.get('/orders/:orderId/summary', auth, orderController.getOrderSummary);

// Get artisan analytics
router.get('/artisans/analytics', auth, authorize('artisan'), analyticsController.getArtisanAnalytics);
router.get('/artisans/:id', userController.getArtisanProfile); // NEW: Get artisan profile by ID
router.get('/artisans/locations', auth, userController.getArtisanLocations); // NEW: Get artisan locations for map

// Chat
router.get('/conversations', auth, chatController.getConversations);
router.get('/conversations/unread-count', auth, chatController.getUnreadMessageCount); // NEW: Get unread message count
router.get('/conversations/:conversationId', auth, chatController.getConversationDetails); // NEW: Get conversation details
router.get('/conversations/:conversationId/messages', auth, chatController.getMessages);
router.post('/conversations/:artisanId/:productId', auth, chatController.createOrGetConversation); // Create or get conversation
router.post('/messages', auth, chatController.sendMessage);
router.patch('/conversations/:conversationId/read', auth, chatController.markConversationAsRead);

module.exports = router;
