import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void> | any;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  // const prevCartRef = useRef<Product[]>()

  // useEffect(() => {
  //   prevCartRef.current = cart;
  // })

  // const cartPreviousValue = prevCartRef.current ?? cart;

  // useEffect(() => {
  //   if(cartPreviousValue !== cart) {
  //     localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  //   }
  // }, [cart, cartPreviousValue])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`)
      const currentAmount = productExists ? productExists.amount : 0
      const amount = currentAmount + 1

      if(amount > stock.data.amount){
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if(productExists){
        productExists.amount = amount
      } else {
        const product = await api.get(`products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        updatedCart.push(newProduct)
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adi????o do produto');
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      const productIndex = cart.findIndex(products => products.id === productId)

      if(productIndex >= 0){
        cart.splice(productIndex, 1)
        setCart(cart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na remo????o do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return
      }

      const stock = await api.get(`/stock/${productId}`)
      
      if(amount > stock.data.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId);

      if(productExists){
        productExists.amount = amount

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na altera????o de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
