import { useState } from "react";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import AdminLayout from "./AdminLayout";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const initialProducts = [
  { id: "PRD001", name: "Espresso", category: "Coffee", price: 3.5, image: "https://images.unsplash.com/photo-1593443320739-77f74939d0da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2ZmZWUlMjBjdXAlMjBlc3ByZXNzbyUyMGxhdHRlfGVufDF8fHx8MTc3OTUwOTc4MXww&ixlib=rb-4.1.0&q=80&w=200", inStock: true },
  { id: "PRD002", name: "Cappuccino", category: "Coffee", price: 4.5, image: "https://images.unsplash.com/photo-1615486780246-76e6bb33e8b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjb2ZmZWUlMjBjdXAlMjBlc3ByZXNzbyUyMGxhdHRlfGVufDF8fHx8MTc3OTUwOTc4MXww&ixlib=rb-4.1.0&q=80&w=200", inStock: true },
  { id: "PRD003", name: "Latte", category: "Coffee", price: 4.8, image: "https://images.unsplash.com/photo-1543233604-3baca4d35513?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb2ZmZWUlMjBjdXAlMjBlc3ByZXNzbyUyMGxhdHRlfGVufDF8fHx8MTc3OTUwOTc4MXww&ixlib=rb-4.1.0&q=80&w=200", inStock: true },
  { id: "PRD004", name: "Americano", category: "Coffee", price: 3.8, image: "https://images.unsplash.com/photo-1511426420268-4cfdd3763b77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxjb2ZmZWUlMjBjdXAlMjBlc3ByZXNzbyUyMGxhdHRlfGVufDF8fHx8MTc3OTUwOTc4MXww&ixlib=rb-4.1.0&q=80&w=200", inStock: false },
  { id: "PRD005", name: "Mocha", category: "Coffee", price: 5.2, image: "https://images.unsplash.com/photo-1489866492941-15d60bdaa7e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxjb2ZmZWUlMjBjdXAlMjBlc3ByZXNzbyUyMGxhdHRlfGVufDF8fHx8MTc3OTUwOTc4MXww&ixlib=rb-4.1.0&q=80&w=200", inStock: true },
  { id: "PRD006", name: "Croissant", category: "Bakery", price: 3.2, image: "https://images.unsplash.com/photo-1571157577110-493b325fdd3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9pc3NhbnQlMjBwYXN0cnklMjBiYWtlcnl8ZW58MXx8fHwxNzc5Mzc4NTU0fDA&ixlib=rb-4.1.0&q=80&w=200", inStock: true },
  { id: "PRD007", name: "Muffin", category: "Bakery", price: 3.5, image: "https://images.unsplash.com/photo-1751151856149-5ebf1d21586a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjcm9pc3NhbnQlMjBwYXN0cnklMjBiYWtlcnl8ZW58MXx8fHwxNzc5Mzc4NTU0fDA&ixlib=rb-4.1.0&q=80&w=200", inStock: true },
  { id: "PRD008", name: "Brownie", category: "Bakery", price: 4.0, image: "https://images.unsplash.com/photo-1737700088850-d0b53f9d39ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjcm9pc3NhbnQlMjBwYXN0cnklMjBiYWtlcnl8ZW58MXx8fHwxNzc5Mzc4NTU0fDA&ixlib=rb-4.1.0&q=80&w=200", inStock: false },
];

export default function ProductManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [productList, setProductList] = useState(initialProducts);

  const filteredProducts = productList.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStock = (id) => {
    setProductList(productList.map((p) => (p.id === id ? { ...p, inStock: !p.inStock } : p)));
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl text-gray-800 mb-2">Product Management</h1>
          <p className="text-gray-600">Manage your menu items and inventory</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md">
              <Plus className="w-5 h-5" />
              Add New Product
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-700">Image</th>
                  <th className="text-left py-4 px-4 text-gray-700">Product Name</th>
                  <th className="text-left py-4 px-4 text-gray-700">Category</th>
                  <th className="text-left py-4 px-4 text-gray-700">Price</th>
                  <th className="text-left py-4 px-4 text-gray-700">Stock Status</th>
                  <th className="text-center py-4 px-4 text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                    <td className="py-4 px-4">
                      <ImageWithFallback src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover shadow-sm" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.id}</div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{product.category}</td>
                    <td className="py-4 px-4 text-gray-800">${product.price.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => toggleStock(product.id)}
                        className="relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                        style={{ backgroundColor: product.inStock ? "#10b981" : "#6b7280" }}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                          style={{ transform: product.inStock ? "translateX(28px)" : "translateX(4px)" }}
                        />
                      </button>
                      <span className="ml-3 text-sm text-gray-600">{product.inStock ? "In Stock" : "Out of Stock"}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-gray-500">No products found matching your search criteria.</div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredProducts.length} of {productList.length} products</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
