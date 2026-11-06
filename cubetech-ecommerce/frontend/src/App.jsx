import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'

// Customer Pages
import Home from './pages/customer/Home'
import Products from './pages/customer/Products'
import ProductDetails from './pages/customer/ProductDetails'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import CustomerLogin from './pages/customer/Login'
import CustomerRegister from './pages/customer/Register'

// Admin Pages
import AdminLogin from './pages/admin/Login'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetails from './pages/admin/AdminOrderDetails'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Customer Routes */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerRegister />} />

            {/* Protected Customer Routes (Requires Customer Login) */}
            <Route element={<ProtectedRoute requiredRole="customer" />}>
              <Route path="/checkout" element={<Checkout />} />
            </Route>
          </Route>

          {/* Admin Login (Public) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Routes (Requires Admin Role) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/orders" replace />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetails />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
