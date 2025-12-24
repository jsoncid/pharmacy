import Button from "../ui/button/Button";
import ProductDescriptionDetails from "../DescriptionHooks/ProductDescriptionDetails";

interface Product {
  $id: string;
  name: string;
  description?: string;
  price: number;
  categories?: string;
}

interface ItemCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ItemCard({ product, onAddToCart }: ItemCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <ProductDescriptionDetails 
        record={{
          name: product.name,
          categories: product.categories,
          materials: undefined,
          sizes: undefined,
          capacityVolumes: undefined,
          sterilities: undefined,
          usabilities: undefined,
          straps: undefined,
          contents: undefined,
          dosageForms: undefined,
          containers: undefined,
          unitDoses: undefined,
          dosage_strenght: undefined,
        }}
        categories={[]}
        materials={[]}
        sizes={[]}
        capacityVolumes={[]}
        sterilities={[]}
        usabilities={[]}
        straps={[]}
        contents={[]}
        dosageForms={[]}
        containers={[]}
        className="mb-3"
      />
      {product.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.description}</p>
      )}
      <p className="text-lg font-semibold text-green-600">${product.price.toFixed(2)}</p>
      <Button
        onClick={() => onAddToCart(product)}
        className="w-full mt-2"
        size="sm"
      >
        Add to Cart
      </Button>
    </div>
  );
}