import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Clock, LogIn, LogOut } from "lucide-react";

const attendanceHistory = [
  { date: "Mon, May 19", checkIn: "8:58 AM", checkOut: "5:03 PM", status: "complete" },
  { date: "Tue, May 20", checkIn: "9:02 AM", checkOut: "5:01 PM", status: "complete" },
  { date: "Wed, May 21", checkIn: "8:55 AM", checkOut: "5:05 PM", status: "complete" },
  { date: "Thu, May 22", checkIn: "9:01 AM", checkOut: "4:58 PM", status: "complete" },
  { date: "Fri, May 23", checkIn: "9:00 AM", checkOut: "-", status: "pending" },
];

export default function Timekeeping() {
  const employee = { name: "Sarah Johnson", shift: "9:00 AM - 5:00 PM" };
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lastAction, setLastAction] = useState(null);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleCheckIn = () => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setIsCheckedIn(true);
    setLastAction(`Checked in at ${time}`);
  };

  const handleCheckOut = () => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    setIsCheckedIn(false);
    setLastAction(`Checked out at ${time}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-4 flex items-center gap-4 shadow-lg">
        <Link to="/" className="hover:bg-white/20 p-2 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Clock className="w-8 h-8" />
        <h1 className="text-2xl">Employee Timekeeping</h1>
      </header>

      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
              {employee.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <h2 className="text-2xl text-gray-800 mb-2">{employee.name}</h2>
            <p className="text-gray-600">{currentDate}</p>
            <div className="mt-2 inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              {"Today's Shift: "}{employee.shift}
            </div>
          </div>

          {lastAction && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded">
              <p className="text-green-700">{lastAction}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCheckIn}
              disabled={isCheckedIn}
              className={`py-8 rounded-xl text-white text-xl transition-all shadow-lg ${
                isCheckedIn
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
              }`}
            >
              <LogIn className="w-12 h-12 mx-auto mb-2" />
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!isCheckedIn}
              className={`py-8 rounded-xl text-white text-xl transition-all shadow-lg ${
                !isCheckedIn
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-br from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black hover:shadow-xl"
              }`}
            >
              <LogOut className="w-12 h-12 mx-auto mb-2" />
              Check Out
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-lg text-gray-800 mb-4">Attendance History - This Week</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-gray-700">Check In</th>
                  <th className="text-left py-3 px-4 text-gray-700">Check Out</th>
                  <th className="text-left py-3 px-4 text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((record, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">{record.date}</td>
                    <td className="py-3 px-4 text-gray-600">{record.checkIn}</td>
                    <td className="py-3 px-4 text-gray-600">{record.checkOut}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs ${
                          record.status === "complete" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {record.status === "complete" ? "Complete" : "In Progress"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
