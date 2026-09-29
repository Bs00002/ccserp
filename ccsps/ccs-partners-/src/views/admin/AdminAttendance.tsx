import React, { useState } from 'react';
import { AttendanceRecord, User } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { AttendanceDetailModal } from '../../components/common/AttendanceDetailModal';

interface AdminAttendanceProps {
  currentUser?: User;
  attendanceRecords?: AttendanceRecord[];
  onRefresh?: () => void;
}

export const AdminAttendance: React.FC<AdminAttendanceProps> = ({
  currentUser,
  attendanceRecords = [],
  onRefresh,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const filtered = attendanceRecords.filter((rec) => {
    const matchesSearch =
      (rec.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.date || '').includes(searchTerm) ||
      (rec.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.currentLocation || rec.locationCheckIn || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || rec.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeWorkingCount = attendanceRecords.filter((r) => r.status === 'Working' || (r.isActive && !r.checkOut)).length;
  const completedTodayCount = attendanceRecords.filter((r) => r.status === 'Present' || !!r.checkOut).length;

  return (
    <div className="space-y-6 font-body text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div>
          <h1 className="text-2xl font-light text-[#161616]">Human Resources & Field Staff Attendance</h1>
          <p className="text-xs text-[#525252] mt-0.5">
            Field staff check-ins, active work shifts, working hours, and real-time location logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-[#f4f4f4] hover:bg-[#e0e0e0] text-[#161616] border border-[#cbd5e1] font-bold text-xs rounded shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? 'animate-spin' : ''}`}>
              sync
            </span>
            {isRefreshing ? 'Syncing...' : 'Sync Live Data'}
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-[#e0e0e0] border-l-4 border-l-[#16a34a] rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#525252]">Active / Working Now</span>
          <div className="text-xl font-bold text-[#15803d] mt-1 flex items-center gap-2">
            <span>{activeWorkingCount}</span>
            {activeWorkingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse" />
            )}
          </div>
        </div>

        <div className="p-3.5 bg-white border border-[#e0e0e0] border-l-4 border-l-[#0f62fe] rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#525252]">Completed Today</span>
          <div className="text-xl font-bold text-[#0f62fe] mt-1">{completedTodayCount}</div>
        </div>

        <div className="p-3.5 bg-white border border-[#e0e0e0] border-l-4 border-l-[#ca8a04] rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#525252]">Total Records</span>
          <div className="text-xl font-bold text-[#161616] mt-1">{attendanceRecords.length}</div>
        </div>

        <div className="p-3.5 bg-white border border-[#e0e0e0] border-l-4 border-l-[#64748b] rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold text-[#525252]">Server Sync Status</span>
          <div className="text-xs font-bold text-[#15803d] mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            Live Connected
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-3 border border-[#e0e0e0] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search employee, date, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 bg-[#f4f4f4] border border-[#e0e0e0] rounded text-xs focus:outline-none focus:border-[#0f62fe]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#525252]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f4f4f4] border border-[#e0e0e0] rounded text-xs font-bold text-[#161616] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Working">Working</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Real-time Attendance Matrix Table */}
      <div className="bg-white border border-[#e0e0e0] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#f4f4f4] text-[#525252] border-b border-[#e0e0e0] uppercase text-[11px] tracking-wider">
            <tr>
              <th className="p-3 font-semibold">Date</th>
              <th className="p-3 font-semibold">Employee</th>
              <th className="p-3 font-semibold">Role</th>
              <th className="p-3 font-semibold">Login Time</th>
              <th className="p-3 font-semibold">Logout Time</th>
              <th className="p-3 font-semibold text-right">Working Hours</th>
              <th className="p-3 font-semibold">Current / Latest Location</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e0e0e0]">
            {filtered.map((att) => (
              <tr key={att.id} className="hover:bg-[#f8f9fa] transition-colors">
                <td className="p-3 font-bold text-[#161616]">
                  {att.date} <span className="text-[10px] font-normal text-[#525252]">({att.day})</span>
                </td>
                <td className="p-3 font-bold text-[#0f62fe]">{att.employeeName}</td>
                <td className="p-3 text-[#525252]">{att.role}</td>
                <td className="p-3 font-mono text-[#161616] font-semibold">{att.checkIn || '--'}</td>
                <td className="p-3 font-mono text-[#161616] font-semibold">{att.checkOut || '--'}</td>
                <td className="p-3 text-right font-bold text-[#161616]">
                  {att.workingHours || att.totalHours || '--'}
                </td>
                <td className="p-3 text-[#525252] max-w-[220px] truncate">
                  {att.currentLocation || att.locationCheckIn || 'Recorded'}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      att.status === 'Working'
                        ? 'bg-[#dbeafe] text-[#1e40af] border border-[#93c5fd] flex items-center gap-1 w-max'
                        : att.status === 'Present'
                        ? 'bg-[#dcfce7] text-[#166534] border border-[#86efac]'
                        : att.status === 'Absent'
                        ? 'bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]'
                        : 'bg-[#fef9c3] text-[#854d0e] border border-[#fde047]'
                    }`}
                  >
                    {att.status === 'Working' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse" />
                    )}
                    {att.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(att)}
                    className="px-2.5 py-1 bg-white hover:bg-[#f4f4f4] text-[#161616] border border-[#cbd5e1] rounded font-bold text-[11px] shadow-2xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#525252]">visibility</span>
                    Details
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-[#64748b]">
                  No attendance records found for the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Record Details Modal */}
      <AttendanceDetailModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
      />
    </div>
  );
};
