import { useState } from "react";
import { Search, Plus, Coins } from "lucide-react";
import AdminLayout from "./AdminLayout";

const customers = [
  { id: "CUST001", name: "John Smith", phone: "(555) 111-2222", rewardPoints: 450 },
  { id: "CUST002", name: "Mary Johnson", phone: "(555) 222-3333", rewardPoints: 820 },
  { id: "CUST003", name: "Robert Brown", phone: "(555) 333-4444", rewardPoints: 125 },
  { id: "CUST004", name: "Patricia Davis", phone: "(555) 444-5555", rewardPoints: 1250 },
  { id: "CUST005", name: "Michael Wilson", phone: "(555) 555-6666", rewardPoints: 680 },
  { id: "CUST006", name: "Jennifer Miller", phone: "(555) 666-7777", rewardPoints: 320 },
  { id: "CUST007", name: "William Taylor", phone: "(555) 777-8888", rewardPoints: 950 },
  { id: "CUST008", name: "Elizabeth Moore", phone: "(555) 888-9999", rewardPoints: 2100 },
  { id: "CUST009", name: "David Anderson", phone: "(555) 999-0000", rewardPoints: 540 },
  { id: "CUST010", name: "Sarah Thomas", phone: "(555) 101-1111", rewardPoints: 1580 },
];

export default function CustomerLoyalty() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPointsBadgeColor = (points) => {
    if (points >= 1000) return "bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900";
    if (points >= 500) return "bg-gradient-to-r from-amber-300 to-yellow-400 text-gray-900";
    return "bg-gradient-to-r from-yellow-200 to-amber-300 text-gray-800";
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl text-gray-800 mb-2">Customer Loyalty Program</h1>
          <p className="text-gray-600">Manage customer rewards and loyalty points</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Customers</p>
                <p className="text-3xl">{customers.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Points Issued</p>
                <p className="text-3xl">{customers.reduce((sum, c) => sum + c.rewardPoints, 0).toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">VIP Members (1000+ pts)</p>
                <p className="text-3xl">{customers.filter((c) => c.rewardPoints >= 1000).length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-2 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-md">
              <Plus className="w-5 h-5" />
              Add Customer
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-gray-700">Customer ID</th>
                  <th className="text-left py-4 px-4 text-gray-700">Full Name</th>
                  <th className="text-left py-4 px-4 text-gray-700">Phone Number</th>
                  <th className="text-left py-4 px-4 text-gray-700">Reward Points</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                    <td className="py-4 px-4 text-gray-800">{customer.id}</td>
                    <td className="py-4 px-4 text-gray-800">{customer.name}</td>
                    <td className="py-4 px-4 text-gray-600">{customer.phone}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-md ${getPointsBadgeColor(customer.rewardPoints)}`}>
                        <Coins className="w-4 h-4" />
                        <span>{customer.rewardPoints.toLocaleString()}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 text-gray-500">No customers found matching your search criteria.</div>
          )}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
