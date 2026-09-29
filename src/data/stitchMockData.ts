import type {
  User,
  Product,
  Dealer,
  Distributor,
  Order,
  AttendanceRecord,
  Expense,
  FieldActivity,
  Scheme,
  Complaint,
  LedgerEntry,
} from '../types/stitchTypes';

export const CURRENT_USER_ADMIN: User = {
  id: 'u-admin-1',
  name: 'Rajesh Sharma',
  email: 'r.sharma@chitracropscience.com',
  role: 'ADMIN',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  phone: '+91 98230 11223',
  code: 'ADM-001',
};

export const CURRENT_USER_DISTRIBUTOR: User = {
  id: 'u-dist-1',
  name: 'Sanjay Deshmukh',
  email: 'sanjay.d@chitracropscience.com',
  role: 'DISTRIBUTOR',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  phone: '+91 94221 88301',
  territory: 'Pune Region',
  code: 'DIST-PNE-01',
  businessName: 'Chitra Sales Corp',
  city: 'Pune',
};

export const CURRENT_USER_DEALER: User = {
  id: 'u-dealer-1',
  name: 'Ramesh Patel',
  email: 'ramesh@agrisolutions.in',
  role: 'DEALER',
  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  phone: '+91 98902 44512',
  code: 'ASL-092',
  businessName: 'Agri Solutions Ltd',
  city: 'Pune',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p-1',
    code: 'FERT-101',
    name: 'SuperGro Ultra',
    technicalName: 'NPK Liquid Bio-Fertilizer 10:26:26',
    category: 'Fertilizers',
    packSize: '5 Ltr',
    mrp: 1500,
    dealerPrice: 1200,
    distributorPrice: 1050,
    stock: 150,
    reservedStock: 20,
    warehouse: 'Pune Central Warehouse',
    recommendedCrops: ['Cotton', 'Sugarcane', 'Soybean', 'Wheat'],
    dosage: '2.5 ml per Ltr of water',
    description: 'High-efficiency liquid bio-fertilizer promoting root elongation, flower set, and pod filling.',
    imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300',
    status: 'In Stock',
  },
  {
    id: 'p-2',
    code: 'PEST-204',
    name: 'PestGuard Pro',
    technicalName: 'Emamectin Benzoate 5% SG',
    category: 'Pesticides',
    packSize: '1 Kg',
    mrp: 1100,
    dealerPrice: 850,
    distributorPrice: 740,
    stock: 42,
    reservedStock: 10,
    warehouse: 'Nagpur Depot',
    recommendedCrops: ['Cotton', 'Chilli', 'Brinjal', 'Tomato'],
    dosage: '0.5 gm per Ltr water',
    description: 'Broad-spectrum modern insecticide for effective bollworm and thrips management.',
    imageUrl: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=300',
    status: 'In Stock',
  },
  {
    id: 'p-3',
    code: 'FERT-112',
    name: 'NitroBoost X',
    technicalName: 'Slow Release Nitrogen Granules',
    category: 'Fertilizers',
    packSize: '50 Kg',
    mrp: 2600,
    dealerPrice: 2100,
    distributorPrice: 1880,
    stock: 80,
    reservedStock: 15,
    warehouse: 'Aurangabad Plant',
    recommendedCrops: ['Sugarcane', 'Maize', 'Paddy', 'Pomegranate'],
    dosage: '50 Kg per Acre',
    description: 'Polymer coated urea formulation ensuring sustained nitrogen availability over 60 days.',
    imageUrl: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300',
    status: 'In Stock',
  },
  {
    id: 'p-4',
    code: 'BIO-305',
    name: 'Chitra Zyme Gold',
    technicalName: 'Seaweed Extract & Amino Acid Complex',
    category: 'Bio Products',
    packSize: '500 ml',
    mrp: 850,
    dealerPrice: 620,
    distributorPrice: 520,
    stock: 8,
    reservedStock: 2,
    warehouse: 'Pune Central Warehouse',
    recommendedCrops: ['Grapes', 'Onion', 'Cotton', 'Citrus'],
    dosage: '1.5 ml per Ltr water',
    description: 'Premium plant growth stimulant enhancing chlorophyll density and abiotic stress tolerance.',
    imageUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300',
    status: 'Low Stock',
  },
  {
    id: 'p-5',
    code: 'SEED-801',
    name: 'Chitra Gold Hybrid Cotton Seeds',
    technicalName: 'BG-II Hybrid Cotton Seed Pass 1',
    category: 'Seeds',
    packSize: '475 gm',
    mrp: 925,
    dealerPrice: 810,
    distributorPrice: 720,
    stock: 320,
    reservedStock: 50,
    warehouse: 'Kolhapur Depot',
    recommendedCrops: ['Cotton'],
    dosage: '2 Packets per Acre',
    description: 'High-yielding bollworm resistant hybrid cotton seed with big boll size and clean picking.',
    imageUrl: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=300',
    status: 'In Stock',
  },
  {
    id: 'p-6',
    code: 'FUNG-402',
    name: 'CropShield Fungicide',
    technicalName: 'Tebuconazole 10% + Sulphur 65% WG',
    category: 'Fungicides',
    packSize: '1 Kg',
    mrp: 1250,
    dealerPrice: 980,
    distributorPrice: 860,
    stock: 0,
    reservedStock: 0,
    warehouse: 'Nagpur Depot',
    recommendedCrops: ['Chilli', 'Groundnut', 'Soybean', 'Wheat'],
    dosage: '2 gm per Ltr water',
    description: 'Systemic and contact fungicide for powdery mildew, rust, and leaf spot prevention.',
    imageUrl: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=300',
    status: 'Out of Stock',
  }
];

export const INITIAL_DEALERS: Dealer[] = [
  {
    id: 'd-1',
    code: 'ASL-092',
    name: 'Agri Solutions Ltd',
    ownerName: 'Ramesh Patel',
    phone: '+91 98902 44512',
    email: 'contact@agrisolutions.in',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Plot 42, Krushi Bazaar, Hadapsar, Pune - 411028',
    gstin: '27AABCA1234F1Z1',
    pan: 'AABCA1234F',
    distributorId: 'dist-1',
    distributorName: 'Chitra Sales Corp',
    creditLimit: 200000,
    outstandingBalance: 45000,
    status: 'Active',
    lastOrderDate: '2023-10-24',
    totalOrdersCount: 28,
    totalSalesValue: 485000,
    loyaltyPoints: 1240,
  },
  {
    id: 'd-2',
    code: 'KTN-104',
    name: 'Kisan Traders',
    ownerName: 'Balu Shinde',
    phone: '+91 94220 98112',
    email: 'kisan.traders.nashik@gmail.com',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Shop No 8, Market Yard, Panchavati, Nashik - 422003',
    gstin: '27AABCK5678G1Z2',
    pan: 'AABCK5678G',
    distributorId: 'dist-1',
    distributorName: 'Chitra Sales Corp',
    creditLimit: 150000,
    outstandingBalance: 12500,
    status: 'Active',
    lastOrderDate: '2023-10-24',
    totalOrdersCount: 19,
    totalSalesValue: 310000,
    loyaltyPoints: 890,
  },
  {
    id: 'd-3',
    code: 'GFC-208',
    name: 'Green Fields Crop',
    ownerName: 'Sanjay Chaudhari',
    phone: '+91 98223 44001',
    email: 'greenfieldsnagpur@yahoo.com',
    city: 'Nagpur',
    state: 'Maharashtra',
    address: 'Near Cotton Market, Wardha Road, Nagpur - 440012',
    gstin: '27AABCG9012H1Z3',
    pan: 'AABCG9012H',
    distributorId: 'dist-2',
    distributorName: 'Swastik Agri Distributors',
    creditLimit: 300000,
    outstandingBalance: 89200,
    status: 'Active',
    lastOrderDate: '2023-10-23',
    totalOrdersCount: 35,
    totalSalesValue: 820000,
    loyaltyPoints: 2150,
  }
];

export const INITIAL_DISTRIBUTORS: Distributor[] = [
  {
    id: 'dist-1',
    code: 'DIST-PNE-01',
    name: 'Chitra Sales Corp',
    ownerName: 'Sanjay Deshmukh',
    phone: '+91 94221 88301',
    email: 'chitra.pune@chitracropscience.com',
    territory: 'Pune & Nashik Region',
    city: 'Pune',
    state: 'Maharashtra',
    dealersCount: 42,
    monthlySales: 1850000,
    monthlySalesPlan: 2000000,
    monthlyCollectionPlan: 1800000,
    outstandingBalance: 145000,
    status: 'Active',
  },
  {
    id: 'dist-2',
    code: 'DIST-NGP-02',
    name: 'Swastik Agri Distributors',
    ownerName: 'Gajananrao Joshi',
    phone: '+91 98224 77209',
    email: 'swastik.agri@nagpur.com',
    territory: 'Vidarbha Zone',
    city: 'Nagpur',
    state: 'Maharashtra',
    dealersCount: 38,
    monthlySales: 2400000,
    monthlySalesPlan: 2500000,
    monthlyCollectionPlan: 2200000,
    outstandingBalance: 210000,
    status: 'Active',
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: '#ORD-092',
    date: '2023-10-24',
    dealerId: 'd-1',
    dealerName: 'Agri Solutions Ltd',
    dealerCode: 'ASL-092',
    dealerCity: 'Pune',
    distributorId: 'dist-1',
    distributorName: 'Chitra Sales Corp',
    items: [
      {
        id: 'oi-1',
        productId: 'p-1',
        productName: 'SuperGro Ultra',
        productCode: 'FERT-101',
        packSize: '5 Ltr',
        quantity: 25,
        dealerPrice: 1200,
        mrp: 1500,
        subtotal: 30000,
      }
    ],
    subtotal: 42400,
    discount: 2120,
    tax: 4720,
    grandTotal: 45000,
    status: 'Delivered',
    paymentStatus: 'Paid',
    lrNumber: 'VRL-88201-PNE',
    transporter: 'VRL Logistics',
    expectedDelivery: '2023-10-25',
    remarks: 'Dispatched via Express Truck. Payment settled via NEFT.',
    createdByName: 'Ravi Kumar (Field Officer)',
    createdAt: '2023-10-24 10:15 AM',
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    date: '2023-10-18',
    day: 'Wed',
    employeeId: 'u-dist-1',
    employeeName: 'Sanjay Deshmukh',
    role: 'Distributor / Field Staff',
    checkIn: '08:55 AM',
    checkOut: '06:10 PM',
    breakDuration: '1h 0m',
    totalHours: '8h 15m',
    overtime: '0h 15m',
    status: 'Present',
    locationCheckIn: 'Chitra Sales Depot, Pune',
    locationCheckOut: 'Hadapsar Market Yard, Pune',
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-101',
    employeeId: 'u-dist-1',
    employeeName: 'Sanjay Deshmukh',
    date: '2023-10-24',
    type: 'Travel / Fuel',
    rideKm: 85,
    amount: 1250,
    dealerVisited: 'Agri Solutions Ltd, Pune',
    remarks: 'Field visit to Hadapsar & Loni Kalbhor dealers.',
    status: 'Approved',
    approvedBy: 'Rajesh Sharma (Admin)',
  }
];

export const INITIAL_FIELD_ACTIVITY: FieldActivity[] = [
  {
    id: 'fa-1',
    employeeId: 'f-1',
    employeeName: 'Ravi Kumar',
    time: '10:42 AM',
    date: '2023-10-24',
    action: 'Check-in at Kisan Traders, Pune',
    dealerName: 'Kisan Traders',
    location: 'Pune Market Yard',
    type: 'check_in',
  }
];

export const INITIAL_SCHEMES: Scheme[] = [
  {
    id: 'sch-1',
    title: 'Kharif Agrotech Mega Bonanza 2026',
    code: 'SCH-KHARIF-26',
    applicableCategory: 'Bio Products & Fertilizers',
    startDate: '2026-06-01',
    endDate: '2026-10-31',
    targetUnits: 100,
    rewardDescription: 'Free Goa Business Seminar Pass or ₹25,000 Cash Credit',
    status: 'Active',
    progressPercentage: 68,
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'cmp-1',
    complaintNumber: '#CMP-101',
    dealerName: 'Agri Solutions Ltd',
    dealerCode: 'ASL-092',
    productName: 'SuperGro Ultra (5 Ltr)',
    batchNumber: 'BT-2026-04',
    issueType: 'Damaged Packaging',
    priority: 'Medium',
    date: '2023-10-20',
    status: 'In Progress',
    assignedTo: 'Mahesh Patil (QA Officer)',
    description: 'Cap seal on 2 containers in carton found leaking during transport.',
  }
];

export const INITIAL_LEDGER: LedgerEntry[] = [
  {
    id: 'led-1',
    date: '2023-10-24',
    reference: 'Inv #ORD-092',
    type: 'Invoice',
    debit: 45000,
    credit: 0,
    balance: 45000,
  }
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'n-1',
    title: 'New High Priority Complaint Registered',
    message: 'Bharat Seeds & Agro submitted #CMP-102.',
    timestamp: '10 minutes ago',
    read: false,
    type: 'complaint' as const,
  }
];

export const MOCK_USERS: User[] = [
  CURRENT_USER_ADMIN,
  CURRENT_USER_DISTRIBUTOR,
  CURRENT_USER_DEALER,
];

export const MOCK_PRODUCTS = INITIAL_PRODUCTS;
export const MOCK_DEALERS = INITIAL_DEALERS;
export const MOCK_DISTRIBUTORS = INITIAL_DISTRIBUTORS;
export const MOCK_ORDERS = INITIAL_ORDERS;
export const MOCK_ATTENDANCE = INITIAL_ATTENDANCE;
export const MOCK_ATTENDANCE_RECORDS = INITIAL_ATTENDANCE;
export const MOCK_EXPENSES = INITIAL_EXPENSES;
export const MOCK_FIELD_ACTIVITIES = INITIAL_FIELD_ACTIVITY;
export const MOCK_SCHEMES = INITIAL_SCHEMES;
export const MOCK_COMPLAINTS = INITIAL_COMPLAINTS;
export const MOCK_LEDGER_ENTRIES = INITIAL_LEDGER;
