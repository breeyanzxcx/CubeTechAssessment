import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const routeTitles = {
  '/': 'CubeTech | Next-Gen Tech & Workstations',
  '/products': 'Products Catalog | CubeTech',
  '/cart': 'Shopping Cart | CubeTech',
  '/checkout': 'Checkout | CubeTech',
  '/orders': 'My Orders | CubeTech',
  '/login': 'Customer Sign In | CubeTech',
  '/register': 'Create Account | CubeTech',
  '/admin/login': 'Admin Login | CubeTech Portal',
  '/admin': 'Dashboard | CubeTech Admin',
  '/admin/dashboard': 'Dashboard | CubeTech Admin',
  '/admin/orders': 'Orders Management | CubeTech Admin',
  '/admin/products': 'Products Inventory | CubeTech Admin',
  '/admin/categories': 'Categories Management | CubeTech Admin',
  '/admin/customers': 'Customers Directory | CubeTech Admin',
}

export function PageTitleManager() {
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname

    if (routeTitles[path]) {
      document.title = routeTitles[path]
    } else if (path.startsWith('/products/')) {
      document.title = 'Product Details | CubeTech'
    } else if (path.startsWith('/admin/orders/')) {
      document.title = 'Order Inspection | CubeTech Admin'
    } else {
      document.title = 'CubeTech | Next-Gen Tech & Workstations'
    }
  }, [location.pathname])

  return null
}

export default PageTitleManager

