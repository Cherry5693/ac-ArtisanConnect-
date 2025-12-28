import { BrowserRouter, Routes, Route,useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Orders from './pages/Orders';
import ArtisanDashboard from './pages/ArtisanDashboard';
import ArtisanProfile from './pages/ArtisanProfile';
import NotFound from './pages/NotFound';
import MapSearch from './pages/MapSearch';
import BuyerProfile from './pages/BuyerProfile';
import ArtisanProfilePage from './pages/ArtisanProfilePage';
import MyProductsPage from './pages/MyProductsPage';
import ProductDetail from './pages/ProductDetail';
import ChatPage from './pages/ChatPage';
import InboxPage from './pages/InboxPage';
import CompletedOrdersPage from './pages/CompletedOrdersPage';
import ArtisanOrdersPage from './pages/ArtisanOrdersPage'; // NEW: Import ArtisanOrdersPage

const queryClient = new QueryClient();
function AppWrapper() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/login" || location.pathname === "/register";

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
           <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/map-search" element={<MapSearch />} />
              <Route path="/artisans/:id" element={<ArtisanProfile />} />
              <Route path="/orders" element={<ProtectedRoute allowedRoles={['buyer']}><Orders /></ProtectedRoute>} />
              <Route path="/artisan" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanDashboard /></ProtectedRoute>} />
              
              <Route path="/profile" element={<ProtectedRoute><BuyerProfile /></ProtectedRoute>} />
              <Route path="/artisan-profile-page" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanProfilePage /></ProtectedRoute>} />
              
              <Route path="/my-products" element={<ProtectedRoute allowedRoles={['artisan']}><MyProductsPage /></ProtectedRoute>} />
              <Route path="/artisan-orders" element={<ProtectedRoute allowedRoles={['artisan']}><ArtisanOrdersPage /></ProtectedRoute>} /> {/* NEW: Artisan Orders Page */}
              <Route path="/completed-orders" element={<ProtectedRoute allowedRoles={['artisan']}><CompletedOrdersPage /></ProtectedRoute>} />
              
              <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
              <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </main>
            </>
  );
}

function App() {
  return (
   
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <AppWrapper />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>

  );
}

export default App;