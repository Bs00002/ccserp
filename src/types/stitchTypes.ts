export type UserRole = 'ADMIN' | 'DISTRIBUTOR' | 'DEALER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  phone: string;
  territory?: string;
  code?: string;
  businessName?: string;
  city?: string;
}

export type OrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Processing'
  | 'Ready to Dispatch'
  | 'Ready Dispatch'
  | 'Dispatched'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled'
  | 'Rejected';

export type PaymentStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  packSize: string;
  quantity: number;
  dealerPrice: number;
  mrp: number;
  subtotal: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  dealerId: string;
  dealerName: string;
  dealerCode: string;
  dealerCity: string;
  distributorId: string;
  distributorName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number; // GST 18%
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  lrNumber?: string;
  transporter?: string;
  expectedDelivery?: string;
  remarks?: string;
  createdByName?: string;
  createdAt: string;
}

export interface Dealer {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  gstin: string;
  pan: string;
  distributorId: string;
  distributorName: string;
  creditLimit: number;
  outstandingBalance: number;
  status: 'Active' | 'Inactive' | 'Pending';
  lastOrderDate?: string;
  totalOrdersCount: number;
  totalSalesValue: number;
  loyaltyPoints: number;
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  territory: string;
  city: string;
  state: string;
  dealersCount: number;
  monthlySales: number;
  monthlySalesPlan?: number;
  monthlyCollectionPlan?: number;
  outstandingBalance: number;
  status: 'Active' | 'Inactive';
}

export interface Product {
  id: string;
  code: string;
  name: string;
  technicalName: string;
  category: 'Fertilizers' | 'Pesticides' | 'Seeds' | 'Bio Products' | 'Fungicides';
  packSize: string;
  mrp: number;
  dealerPrice: number;
  distributorPrice: number;
  stock: number;
  reservedStock: number;
  warehouse: string;
  recommendedCrops: string[];
  dosage: string;
  description: string;
  imageUrl: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // Wed, Tue, etc.
  employeeId: string;
  employeeName: string;
  role: string;
  checkIn: string; // "08:55 AM" or "--"
  checkOut: string; // "06:10 PM" or "--"
  breakDuration: string; // "1h 0m"
  totalHours: string; // "8h 15m"
  overtime: string; // "0h 15m"
  status: 'Present' | 'Late' | 'Absent' | 'Half Day' | 'Leave';
  locationCheckIn?: string;
  locationCheckOut?: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: 'Travel / Fuel' | 'Food & Meals' | 'Hotel Stay' | 'Transport / Freight' | 'Other';
  rideKm?: number;
  amount: number;
  dealerVisited?: string;
  billUrl?: string;
  remarks: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  approvedBy?: string;
}

export interface FieldActivity {
  id: string;
  employeeId: string;
  employeeName: string;
  time: string;
  date: string;
  action: string;
  dealerName?: string;
  location: string;
  type: 'check_in' | 'check_out' | 'order_created' | 'payment_collected' | 'complaint_logged';
}

export interface Scheme {
  id: string;
  title: string;
  code: string;
  applicableCategory: string;
  startDate: string;
  endDate: string;
  targetUnits: number;
  rewardDescription: string;
  status: 'Active' | 'Upcoming' | 'Expired';
  progressPercentage?: number;
}

export interface Complaint {
  id: string;
  complaintNumber: string;
  dealerName: string;
  dealerCode: string;
  productName: string;
  batchNumber?: string;
  issueType: 'Damaged Packaging' | 'Quality Issue' | 'Delivery Delay' | 'Billing Dispute';
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  assignedTo: string;
  description: string;
  resolutionNotes?: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  type: 'Invoice' | 'Payment Received' | 'Credit Note';
  debit: number;
  credit: number;
  balance: number;
}
