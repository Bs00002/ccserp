import React from 'react';
import { OrderStatus } from '../../types';

interface OrderTimelineProps {
  currentStatus: OrderStatus;
  createdAt?: string;
  expectedDelivery?: string;
}

const STAGES: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'Pending Approval', label: '1. Employee Order', icon: 'pending_actions' },
  { key: 'Approved', label: '2. Admin Approved', icon: 'check_circle' },
  { key: 'Bilty Uploaded', label: '3. Office Bilty Uploaded', icon: 'description' },
  { key: 'Ready to Dispatch', label: '4. Ready to Dispatch', icon: 'inventory_2' },
  { key: 'Dispatched', label: '5. Warehouse LR & Dispatch', icon: 'local_shipping' },
  { key: 'Delivered', label: '6. Delivered', icon: 'task_alt' },
];

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ currentStatus }) => {
  const isCancelled = currentStatus === 'Cancelled' || currentStatus === 'Rejected';

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Draft':
      case 'Submitted':
      case 'Pending Approval':
        return 0;
      case 'Approved':
        return 1;
      case 'Bilty Uploaded':
        return 2;
      case 'Ready to Dispatch':
        return 3;
      case 'Dispatched':
      case 'In Transit':
        return 4;
      case 'Delivered':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = isCancelled ? -1 : getStageIndex(currentStatus);

  return (
    <div className="bg-white p-4 border border-[#e0e0e0]">
      <h4 className="text-xs font-bold text-[#161616] uppercase tracking-wider mb-4 pb-2 border-b border-[#e0e0e0]">
        Order Workflow & Status Tracker
      </h4>

      {isCancelled ? (
        <div className="p-3 bg-[#fff1f1] border border-[#ffb3b8] text-[#da1e28] text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined">cancel</span>
          <span>Order Status: {currentStatus}</span>
        </div>
      ) : (
        <div className="relative">
          <div className="hidden md:flex justify-between items-center relative z-10">
            {STAGES.map((stage, idx) => {
              const isPassed = idx <= currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center max-w-[90px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#0f62fe] text-white ring-4 ring-[#d0e2ff]'
                        : isPassed
                        ? 'bg-[#198038] text-white'
                        : 'bg-[#e0e0e0] text-[#525252]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPassed ? (isCurrent ? stage.icon : 'check') : stage.icon}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] mt-2 leading-tight ${
                      isCurrent ? 'font-bold text-[#0f62fe]' : isPassed ? 'font-semibold text-[#161616]' : 'text-[#8d8d8d]'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar line connecting nodes */}
          <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-[#e0e0e0] -z-0">
            <div
              className="h-full bg-[#198038] transition-all duration-300"
              style={{
                width: `${(currentIndex / (STAGES.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
