import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

function getSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('cubetech-cart'))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(getSavedCart)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    localStorage.setItem('cubetech-cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      setToast(null)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  function clearToast() {
    setToast(null)
  }

  function addToCart(product) {
    const stock = Number(product.stock)
    if (stock <= 0) {
      showToast(`"${product.name}" is currently out of stock.`, 'error')
      return false
    }

    const existing = cart.find((item) => item.id === product.id)
    if (existing && existing.quantity >= stock) {
      showToast(
        `Limit reached: Only ${stock} units of "${product.name}" available in stock.`,
        'error'
      )
      return false
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id)

      if (existingItem) {
        if (existingItem.quantity >= stock) {
          return currentCart
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          stock: stock,
          quantity: 1,
        },
      ]
    })

    showToast(`Added "${product.name}" to cart!`, 'success')
    return true
  }

  function updateQuantity(productId, quantity) {
    const newQuantity = Number(quantity)

    if (!Number.isInteger(newQuantity) || newQuantity < 1) return

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(newQuantity, item.stock),
            }
          : item
      )
    )
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    )
  }

  function clearCart() {
    setCart([])
  }

  function syncCart(updatedItems) {
    if (!Array.isArray(updatedItems)) return
    setCart(updatedItems)
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        toast,
        showToast,
        clearToast,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        syncCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
