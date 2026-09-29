import React from 'react';
import { User } from '../../types';

interface UserProfileViewProps {
  currentUser: User;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 font-body text-xs">
      <div className="bg-white border border-[#e2e8f0] p-6 rounded-lg shadow-xs flex items-center gap-4">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-[#16a34a]"
        />
        <div>
          <h1 className="text-xl font-bold text-[#14532d]">{currentUser.name}</h1>
          <p className="text-xs text-[#64748b]">{currentUser.email} • {currentUser.phone}</p>
          <div className="mt-2 flex gap-2">
            <span className="px-2.5 py-0.5 bg-[#dcfce7] text-[#14532d] font-bold text-[10px] border border-[#86efac] rounded-full uppercase">
              {currentUser.role}
            </span>
            <span className="px-2.5 py-0.5 bg-[#f1f5f9] text-[#334155] font-semibold text-[10px] border border-[#cbd5e1] rounded-full">
              {currentUser.territory || 'HQ Admin'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] p-6 rounded-lg shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#14532d] border-b border-[#e2e8f0] pb-2 uppercase tracking-wider">
          Account Details & Permissions
        </h2>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-bold text-[#64748b]">User Code:</span>
            <div className="font-mono font-bold text-[#0f172a] mt-0.5">{currentUser.code || currentUser.id || '--'}</div>
          </div>
          <div>
            <span className="font-bold text-[#64748b]">Primary Territory:</span>
            <div className="font-semibold text-[#0f172a] mt-0.5">{currentUser.territory || '--'}</div>
          </div>
          <div>
            <span className="font-bold text-[#64748b]">Phone Number:</span>
            <div className="font-semibold text-[#0f172a] mt-0.5">{currentUser.phone}</div>
          </div>
          <div>
            <span className="font-bold text-[#64748b]">Security Designation:</span>
            <div className="font-semibold text-[#0f172a] mt-0.5">Enterprise System Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
};
