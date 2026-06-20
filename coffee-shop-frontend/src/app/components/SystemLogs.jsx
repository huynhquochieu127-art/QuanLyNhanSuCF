import { useState } from "react";
import { Download, Filter } from "lucide-react";
import AdminLayout from "./AdminLayout";

const logs = [
  { id: "LOG001", user: "admin@shop.com", action: "Export", fileName: "sales_report_2026_05.xlsx", timestamp: "2026-05-23 14:32:15" },
  { id: "LOG002", user: "manager@shop.com", action: "Import", fileName: "inventory_update.csv", timestamp: "2026-05-23 13:15:42" },
  { id: "LOG003", user: "admin@shop.com", action: "Create", fileName: "employee_records.xlsx", timestamp: "2026-05-23 11:48:20" },
  { id: "LOG004", user: "staff@shop.com", action: "Update", fileName: "menu_prices.csv", timestamp: "2026-05-23 10:22:37" },
  { id: "LOG005", user: "admin@shop.com", action: "Export", fileName: "customer_loyalty_data.xlsx", timestamp: "2026-05-23 09:05:11" },
  { id: "LOG006", user: "manager@shop.com", action: "Delete", fileName: "old_schedule_draft.xlsx", timestamp: "2026-05-22 16:45:28" },
  { id: "LOG007", user: "admin@shop.com", action: "Import", fileName: "new_products.csv", timestamp: "2026-05-22 15:12:03" },
  { id: "LOG008", user: "staff@shop.com", action: "Export", fileName: "daily_timekeeping.xlsx", timestamp: "2026-05-22 14:38:19" },
  { id: "LOG009", user: "manager@shop.com", action: "Update", fileName: "shift_assignments.csv", timestamp: "2026-05-22 12:55:47" },
  { id: "LOG010", user: "admin@shop.com", action: "Create", fileName: "weekly_report.xlsx", timestamp: "2026-05-22 11:20:34" },
];

export default function SystemLogs() {
  const [dateRange, setDateRange] = useState("last-7-days");

  const getActionBadgeColor = (action) => {
    switch (action) {
      case "Import": return "bg-blue-100 text-blue-700 border-blue-300";
      case "Export": return "bg-green-100 text-green-700 border-green-300";
      case "Create": return "bg-purple-100 text-purple-700 border-purple-300";
      case "Update": return "bg-amber-100 text-amber-700 border-amber-300";
      case "Delete": return "bg-red-100 text-red-700 border-red-300";
      default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const handleExport = () => {
    const csvContent = [
      ["Log ID", "User", "Action", "File Name", "Timestamp"],
      ...logs.map((log) => [log.id, log.user, log.action, log.fileName, log.timestamp]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `system_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl text-gray-800 mb-2">System Activity Logs</h1>
          <p className="text-gray-600">Audit trail and system activity monitoring</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last-7-days">Last 7 Days</option>
                <option value="last-30-days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            >
              <Download className="w-5 h-5" />
              Export to Excel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="text-left py-3 px-4 text-gray-700 text-sm">Log ID</th>
                  <th className="text-left py-3 px-4 text-gray-700 text-sm">User Account</th>
                  <th className="text-left py-3 px-4 text-gray-700 text-sm">Action Type</th>
                  <th className="text-left py-3 px-4 text-gray-700 text-sm">File Name</th>
                  <th className="text-left py-3 px-4 text-gray-700 text-sm">Timestamp</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {logs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{log.id}</td>
                    <td className="py-3 px-4 text-gray-800">{log.user}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded border text-xs ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-mono text-xs">{log.fileName}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {logs.length} log entries</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Last updated: Just now</span>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> System logs are retained for 90 days. Export important data regularly for long-term archival.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
