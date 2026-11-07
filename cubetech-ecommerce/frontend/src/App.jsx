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
import MyOrders from './pages/customer/MyOrders'
import MyOrderDetails from './pages/customer/MyOrderDetails'

// Admin Pages
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetails from './pages/admin/AdminOrderDetails'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminCustomers from './pages/admin/AdminCustomers'
import PageTitleManager from './components/common/PageTitleManager'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <PageTitleManager />
        <Routes>
          {/* Public & Customer Routes */}
          <Route element={<CustomerLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<CustomerRegister />} />

            {/* Protected Customer Routes (Requires Customer Login) */}
            <Route element={<ProtectedRoute requiredRole="customer" />}>
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/orders/:id" element={<MyOrderDetails />} />
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
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id" element={<AdminOrderDetails />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="customers" element={<AdminCustomers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
