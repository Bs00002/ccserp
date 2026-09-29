export interface Employee {
  id: string;
  code: string;
  name: string;
  photo?: string;
  mobile: string;
  email: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  joiningDate: string;
  department: string;
  designation: string;
  reportingManager: string;
  territory: string;
  salary: number;
  annualTarget: number;
  monthlyTarget: number;
  monthlySalesPlan?: number;
  monthlyCollectionPlan?: number;
  status: 'Active' | 'On Leave' | 'Resigned' | 'Suspended';
  aadhaarNo?: string;
  panNo?: string;
  drivingLicense?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bikeStartKm?: number;
  bikeEndKm?: number;
  documents?: { name: string; type: string; date: string }[];
}

export interface Distributor {
  id: string;
  code: string;
  name: string;
  firmName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  creditLimit: number;
  outstanding: number;
  assignedDealers: string[];
  territory: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  onboardingDate: string;
}

export interface Dealer {
  id: string;
  code: string;
  name: string;
  shopName: string;
  ownerName: string;
  mobile: string;
  email: string;
  address: string;
  village: string;
  tehsil: string;
  district: string;
  state: string;
  pincode: string;
  distributor: string;
  distributorId: string;
  assignedEmployee: string;
  employeeId: string;
  gstin?: string;
  outstanding: number;
  totalPurchases: number;
  status: 'Active' | 'Inactive' | 'Prospect';
  onboardingDate: string;
  complaints: number;
  returns: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  status: 'Active' | 'Inactive';
  icon?: string;
}

export interface Product {
  id: string;
  code: string;
  sku: string;
  name: string;
  technicalName: string;
  categoryId: string;
  category: string;
  composition: string;
  crop: string[];
  disease: string[];
  benefits: string[];
  dosage: string;
  packaging: string[];
  mrp: number;
  distributorPrice: number;
  dealerPrice: number;
  gst: number;
  hsn: string;
  stock: number;
  reserved: number;
  damaged: number;
  reorderLevel: number;
  batchNo?: string;
  expiryDate?: string;
  images?: string[];
  pdf?: string;
  status: 'Active' | 'Discontinued' | 'Out of Stock';
}

export type OrderStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Packing'
  | 'Ready Dispatch'
  | 'Dispatched'
  | 'Delivered'
  | 'Invoice Generated'
  | 'Payment Pending'
  | 'Completed'
  | 'Cancelled'
  | 'Returned';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  gst: number;
  amount: number;
}

export interface Order {
  id: string;
  orderNo: string;
  dealerId: string;
  dealerName: string;
  shopName: string;
  distributorId: string;
  distributorName: string;
  employeeId: string;
  employeeName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  freight: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  approvedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  invoiceGeneratedAt?: string;
  expectedDelivery?: string;
  vehicleNo?: string;
  driverName?: string;
  lrNumber?: string;
  transport?: string;
  proofOfDelivery?: string;
  comments?: string;
  history: { status: OrderStatus; date: string; by: string; note?: string }[];
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  orderId: string;
  orderNo: string;
  dealerId: string;
  dealerName: string;
  shopName: string;
  gstin: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  freight: number;
  grandTotal: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  paymentReceived: number;
  outstanding: number;
  dueDate: string;
  issueDate: string;
  placeOfSupply: string;
  hsnSummary: { hsn: string; taxableValue: number; gstRate: number; cgst: number; sgst: number; igst: number }[];
}

export interface WarehouseTransaction {
  id: string;
  date: string;
  type: 'Incoming' | 'Outgoing' | 'Reserved' | 'Damaged' | 'Return' | 'Adjustment';
  productId: string;
  productName: string;
  sku: string;
  batchNo: string;
  quantity: number;
  unit: string;
  rate: number;
  value: number;
  referenceNo: string;
  referenceType: string;
  warehouse: string;
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: {
    time: string;
    latitude: number;
    longitude: number;
    location: string;
    selfie?: string;
  };
  checkOut?: {
    time: string;
    latitude: number;
    longitude: number;
    location: string;
    selfie?: string;
  };
  workingHours?: number;
  status: 'Present' | 'Absent' | 'Half Day' | 'Leave' | 'Holiday';
  morningPlan?: string;
  visitPlan?: string[];
  bikeStartKm?: number;
  bikeEndKm?: number;
  distanceTravelled?: number;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  category: 'Fuel' | 'Travel' | 'Hotel' | 'Food' | 'Misc' | 'TA/DA';
  description: string;
  amount: number;
  billNo?: string;
  receipt?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  approvedBy?: string;
  approvedAt?: string;
  paymentDate?: string;
  remarks?: string;
}

export interface Collection {
  id: string;
  receiptNo: string;
  date: string;
  dealerId: string;
  dealerName: string;
  distributorId?: string;
  distributorName?: string;
  invoiceId: string;
  invoiceNo: string;
  amount: number;
  mode: 'Cash' | 'Cheque' | 'NEFT' | 'RTGS' | 'UPI' | 'DD' | 'Card';
  referenceNo: string;
  bankName?: string;
  chequeDate?: string;
  status: 'Received' | 'Deposited' | 'Cleared' | 'Bounced';
  collectedBy: string;
  depositedAt?: string;
  clearedAt?: string;
  remarks?: string;
}

export interface Target {
  id: string;
  period: string;
  periodType: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual';
  assigneeType: 'Employee' | 'Distributor' | 'Dealer' | 'Territory';
  assigneeId: string;
  assigneeName: string;
  targetAmount: number;
  monthlySalesPlan?: number;
  monthlyCollectionPlan?: number;
  achievedAmount: number;
  targetUnits?: number;
  achievedUnits?: number;
  status: 'On Track' | 'Behind' | 'Achieved' | 'Exceeded';
  percentage: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'approval';
  category: 'Order' | 'Invoice' | 'Payment' | 'Stock' | 'Attendance' | 'Leave' | 'Expense' | 'Support' | 'System';
  read: boolean;
  createdAt: string;
  referenceId?: string;
  actionUrl?: string;
  forRoles?: string[];
}

export interface SupportTicket {
  id: string;
  ticketNo: string;
  title: string;
  type: 'Complaint' | 'Return' | 'Replacement' | 'Query' | 'Request';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Assigned' | 'In Progress' | 'Pending Customer' | 'Resolved' | 'Closed';
  raisedBy: string;
  raisedById: string;
  raisedByType: 'Dealer' | 'Distributor' | 'Employee';
  assignee?: string;
  assigneeId?: string;
  productId?: string;
  productName?: string;
  orderId?: string;
  orderNo?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  description: string;
  resolution?: string;
  attachments?: { name: string; type: string; size: string }[];
  messages: { from: string; by: string; time: string; message: string }[];
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'order' | 'invoice' | 'payment' | 'stock' | 'attendance' | 'expense' | 'system';
  user: string;
  role: string;
  icon?: string;
}

export interface DashboardKPIs {
  todayOrders: { value: number; change: number };
  pendingOrders: { value: number; change: number };
  approvedOrders: { value: number; change: number };
  dispatchToday: { value: number; change: number };
  deliveredToday: { value: number; change: number };
  revenue: { value: number; change: number };
  collection: { value: number; change: number };
  outstanding: { value: number; change: number };
  warehouseStock: { value: number; change: number };
  lowStock: { value: number; change: number };
  employees: { value: number; change: number };
  dealers: { value: number; change: number };
  distributors: { value: number; change: number };
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface MonthlyData {
  months: string[];
  sales: number[];
  revenue: number[];
  collections: number[];
  orders: number[];
}
