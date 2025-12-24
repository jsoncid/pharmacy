import { useState, useEffect } from "react";
import { Databases, Query } from "appwrite";
import client from "../../lib/appwrite";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import InputField from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { Modal } from "../../components/ui/modal";
import ItemCard from "../../components/ecommerce/ItemCard";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "../../components/ui/table";

const databases = new Databases(client);
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PRODUCT_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_PRODUCT_DESCRIPTIONS;

interface Product {
  $id: string;
  name: string;
  description?: string;
  price: number;
  categories?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

export default function PointOfSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  useEffect(() => {
    const newTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotal(newTotal);
  }, [cart]);

  const loadProducts = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PRODUCT_COLLECTION_ID,
        [Query.equal("status", true)]
      );

      // Add mock prices for demo - in real implementation, prices would come from selling_prices collection
      const productsWithPrices = response.documents.map((product: any) => ({
        ...product,
        price: Math.floor(Math.random() * 50) + 5, // Mock price between $5-$55
      }));

      setProducts(productsWithPrices);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.$id === product.$id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.$id === product.$id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, price: product.price }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.$id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product.$id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const handlePayment = async () => {
    // TODO: Implement payment processing
    alert(`Payment of $${total.toFixed(2)} processed via ${paymentMethod}`);
    setCart([]);
    setPaymentModal(false);
  };

  return (
    <>
      <PageMeta
        title="Point of Sale"
        description="Pharmacy Point of Sale System"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Product Search and Selection */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Product Search</h2>
            <InputField
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.slice(0, 12).map((product) => (
                <ItemCard key={product.$id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cart</h2>

            {cart.length === 0 ? (
              <p className="text-gray-500">No items in cart</p>
            ) : (
              <>
                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.$id} className="flex justify-between items-center p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => updateQuantity(item.product.$id, item.quantity - 1)}
                          size="sm"
                          variant="outline"
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          onClick={() => updateQuantity(item.product.$id, item.quantity + 1)}
                          size="sm"
                          variant="outline"
                        >
                          +
                        </Button>
                        <Button
                          onClick={() => removeFromCart(item.product.$id)}
                          size="sm"
                          variant="danger"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold mb-4">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={() => setPaymentModal(true)}
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={paymentModal}
        onClose={() => setPaymentModal(false)}
      >
        <div className="space-y-4">
          <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            Payment
          </h5>
          <div>
            <Label>Total Amount: ${total.toFixed(2)}</Label>
          </div>

          <div>
            <Label>Payment Method</Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="digital">Digital Wallet</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePayment} className="flex-1">
              Complete Payment
            </Button>
            <Button onClick={() => setPaymentModal(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
