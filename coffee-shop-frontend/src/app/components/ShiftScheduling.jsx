import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Calendar, Plus, X, AlertCircle } from "lucide-react";

const shifts = ["Morning", "Afternoon", "Evening"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const minStaffRequired = 2;

const staffMembers = ["Sarah Johnson", "Mike Chen", "Emma Davis", "James Wilson", "Lisa Anderson", "Tom Martinez"];

const initialSchedule = {
  Monday: {
    Morning: [{ id: "1", name: "Sarah Johnson" }, { id: "2", name: "Mike Chen" }],
    Afternoon: [{ id: "3", name: "Emma Davis" }],
    Evening: [{ id: "4", name: "James Wilson" }, { id: "5", name: "Lisa Anderson" }],
  },
  Tuesday: {
    Morning: [{ id: "6", name: "Tom Martinez" }, { id: "7", name: "Sarah Johnson" }],
    Afternoon: [{ id: "8", name: "Mike Chen" }, { id: "9", name: "Emma Davis" }],
    Evening: [{ id: "10", name: "James Wilson" }],
  },
  Wednesday: {
    Morning: [{ id: "11", name: "Lisa Anderson" }],
    Afternoon: [{ id: "12", name: "Tom Martinez" }, { id: "13", name: "Sarah Johnson" }],
    Evening: [{ id: "14", name: "Mike Chen" }, { id: "15", name: "Emma Davis" }],
  },
  Thursday: {
    Morning: [{ id: "16", name: "James Wilson" }, { id: "17", name: "Lisa Anderson" }],
    Afternoon: [{ id: "18", name: "Tom Martinez" }, { id: "19", name: "Sarah Johnson" }],
    Evening: [{ id: "20", name: "Mike Chen" }],
  },
  Friday: {
    Morning: [{ id: "21", name: "Emma Davis" }, { id: "22", name: "James Wilson" }],
    Afternoon: [{ id: "23", name: "Lisa Anderson" }, { id: "24", name: "Tom Martinez" }],
    Evening: [{ id: "25", name: "Sarah Johnson" }, { id: "26", name: "Mike Chen" }],
  },
  Saturday: {
    Morning: [{ id: "27", name: "Emma Davis" }],
    Afternoon: [{ id: "28", name: "James Wilson" }, { id: "29", name: "Lisa Anderson" }],
    Evening: [{ id: "30", name: "Tom Martinez" }, { id: "31", name: "Sarah Johnson" }],
  },
  Sunday: {
    Morning: [{ id: "32", name: "Mike Chen" }, { id: "33", name: "Emma Davis" }],
    Afternoon: [{ id: "34", name: "James Wilson" }],
    Evening: [{ id: "35", name: "Lisa Anderson" }, { id: "36", name: "Tom Martinez" }],
  },
};

export default function ShiftScheduling() {
  const [schedule, setSchedule] = useState(initialSchedule);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);

  const addStaffToShift = (day, shift) => {
    setSelectedCell({ day, shift });
    setShowAddModal(true);
  };

  const assignStaff = (staffName) => {
    if (!selectedCell) return;
    const newId = `${Date.now()}`;
    setSchedule((prev) => ({
      ...prev,
      [selectedCell.day]: {
        ...prev[selectedCell.day],
        [selectedCell.shift]: [...prev[selectedCell.day][selectedCell.shift], { id: newId, name: staffName }],
      },
    }));
    setShowAddModal(false);
    setSelectedCell(null);
  };

  const removeStaff = (day, shift, staffId) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: prev[day][shift].filter((s) => s.id !== staffId),
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <header className="bg-gradient-to-r from-purple-700 to-pink-600 text-white p-4 flex items-center gap-4 shadow-lg">
        <Link to="/" className="hover:bg-white/20 p-2 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <Calendar className="w-8 h-8" />
        <h1 className="text-2xl">Weekly Shift Scheduling</h1>
      </header>

      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 overflow-auto">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4" />
            Minimum staff required per shift: {minStaffRequired}
          </div>

          <div className="min-w-[1200px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-purple-100 p-3 text-left text-gray-800 sticky left-0 z-10">
                    Shift / Day
                  </th>
                  {days.map((day) => (
                    <th key={day} className="border border-gray-300 bg-purple-100 p-3 text-center text-gray-800">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift}>
                    <td className="border border-gray-300 bg-purple-50 p-3 text-gray-800 sticky left-0 z-10">
                      {shift}
                      <div className="text-xs text-gray-500 mt-1">
                        {shift === "Morning" && "6 AM - 12 PM"}
                        {shift === "Afternoon" && "12 PM - 6 PM"}
                        {shift === "Evening" && "6 PM - 12 AM"}
                      </div>
                    </td>
                    {days.map((day) => {
                      const assignments = schedule[day][shift];
                      const understaffed = assignments.length < minStaffRequired;
                      return (
                        <td
                          key={`${day}-${shift}`}
                          className={`border border-gray-300 p-2 align-top ${understaffed ? "bg-red-50" : "bg-white"}`}
                        >
                          <div className="min-h-[80px]">
                            {understaffed && (
                              <div className="flex items-center gap-1 text-xs text-red-600 mb-2">
                                <AlertCircle className="w-3 h-3" />
                                Understaffed
                              </div>
                            )}
                            <div className="space-y-1 mb-2">
                              {assignments.map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs flex items-center justify-between group"
                                >
                                  <span>{assignment.name}</span>
                                  <button
                                    onClick={() => removeStaff(day, shift, assignment.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:text-red-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => addStaffToShift(day, shift)}
                              className="w-full bg-purple-200 hover:bg-purple-300 text-purple-700 py-1 px-2 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Add Staff
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && selectedCell && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-800">
                Add Staff - {selectedCell.day} {selectedCell.shift}
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setSelectedCell(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {staffMembers.map((staff) => (
                <button
                  key={staff}
                  onClick={() => assignStaff(staff)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-gray-800 transition-colors"
                >
                  {staff}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
