import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Products from './pages/customer/Products'
import ProductDetails from './pages/customer/ProductDetails'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<h1>CubeTech E-Commerce</h1>} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetails />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App