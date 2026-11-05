import { createContext, useContext, useEffect, useState } from 'react'

const CartContext = createContext(null)

function getSavedCart() {
  try {
    return JSON.parse(localStorage.getItem('cubetech-cart')) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(getSavedCart)

  useEffect(() => {
    localStorage.setItem('cubetech-cart', JSON.stringify(cart))
  }, [cart])

  function addToCart(product) {
    if (Number(product.stock) <= 0) return false

    let added = false

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      )

      if (existing) {
        if (existing.quantity >= Number(product.stock)) {
          return currentCart
        }

        added = true

        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      added = true

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          stock: Number(product.stock),
          quantity: 1,
        },
      ]
    })

    return added
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
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
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