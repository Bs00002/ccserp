import type {
  Employee,
  Distributor,
  Dealer,
  Category,
  Product,
  Order,
  Invoice,
  WarehouseTransaction,
  AttendanceRecord,
  Expense,
  Collection,
  Target,
  Notification,
  SupportTicket,
  Activity,
  DashboardKPIs,
  MonthlyData
} from './ccsTypes';

const IN_STATES = ['Gujarat', 'Maharashtra', 'Punjab', 'Haryana', 'Rajasthan', 'Madhya Pradesh', 'Uttar Pradesh', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Tamil Nadu', 'Bihar', 'Odisha', 'West Bengal'];
const IN_CITIES = ['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara', 'Pune', 'Nagpur', 'Nashik', 'Amritsar', 'Ludhiana', 'Jaipur', 'Udaipur', 'Jodhpur', 'Indore', 'Bhopal', 'Lucknow', 'Kanpur', 'Varanasi', 'Belagavi', 'Hubballi', 'Nagpur'];
const IN_DISTRICTS = ['Banaskantha', 'Sabarkantha', 'Mehsana', 'Patan', 'Jamnagar', 'Kutch', 'Saurashtra', 'Ahmedabad', 'Nashik', 'Sangli', 'Solapur', 'Satara', 'Amritsar', 'Ludhiana', 'Patiala', 'Bathinda', 'Jaipur', 'Ajmer', 'Udaipur', 'Jodhpur', 'Nagaur', 'Sikar', 'Chittorgarh'];
const IN_TEHSILS = ['Palanpur', 'Idar', 'Vijaynagar', 'Kheralu', 'Harij', 'Kalol', 'Dhandhuka', 'Dholka', 'Nandurbar', 'Dhule', 'Malegaon', 'Sinnar', 'Sangamner', 'Jalgaon', 'Bhusawal', 'Ajnala', 'Jandiala', 'Patti', 'Taran Taaran', 'Phagi', 'Chaksu', 'Sambhar', 'Kuchaman'];
const IN_VILLAGES = ['Dantivada', 'Sami', 'Mithana', 'Radhanpur', 'Kankrej', 'Deesa', 'Deodar', 'Vadgam', 'Amirgadh', 'Shirohi', 'Abu Road', 'Maval', 'Mulshi', 'Haveli', 'Bhor', 'Purandar', 'Baramati', 'Indapur', 'Khatkar Kalan', 'Nawanshahr', 'Balachaur'];

const FIRST_NAMES = ['Rajesh', 'Suresh', 'Mahesh', 'Dinesh', 'Ramesh', 'Naresh', 'Mukesh', 'Kamesh', 'Ashok', 'Anil', 'Sunil', 'Vinod', 'Rajendra', 'Surendra', 'Devendra', 'Jagdish', 'Subhash', 'Harish', 'Lokesh', 'Sanjay', 'Ajay', 'Vijay', 'Jay', 'Deepak', 'Prakash', 'Umesh', 'Asha', 'Meena', 'Leena', 'Sunita', 'Anita', 'Kavita', 'Priya', 'Divya', 'Shilpa', 'Neha', 'Pooja', 'Rina', 'Hina', 'Seema'];
const LAST_NAMES = ['Patel', 'Shah', 'Desai', 'Thakkar', 'Mehta', 'Joshi', 'Pandya', 'Trivedi', 'Raval', 'Panchal', 'Chauhan', 'Solanki', 'Jadeja', 'Rathod', 'Sinh', 'Kumar', 'Singh', 'Yadav', 'Sharma', 'Verma', 'Agarwal', 'Gupta', 'Mishra', 'Tiwari', 'Jain'];
const CROP_CATEGORIES = [
  { id: 'CAT-1', name: 'Insecticides', description: 'Chemical and bio-insecticides for pest control', icon: 'BugOutlined' },
  { id: 'CAT-2', name: 'Fungicides', description: 'Fungal disease control products', icon: 'MedicineBoxOutlined' },
  { id: 'CAT-3', name: 'Herbicides', description: 'Weed control solutions', icon: 'ScissorOutlined' },
  { id: 'CAT-4', name: 'Fertilizers', description: 'NPK, Micronutrients, Bio-fertilizers', icon: 'ThunderboltOutlined' },
  { id: 'CAT-5', name: 'Plant Growth Regulators', description: 'PGR for growth, flowering, fruiting', icon: 'RiseOutlined' },
  { id: 'CAT-6', name: 'Bio Products', description: 'Organic & bio-control agents', icon: 'EnvironmentOutlined' },
  { id: 'CAT-7', name: 'Rodenticides', description: 'Rodent and rat control', icon: 'BugOutlined' },
  { id: 'CAT-8', name: 'Nematicides', description: 'Nematode control products', icon: 'ClearOutlined' }
];

const PRODUCT_COMPOSITIONS = [
  { tech: 'Lambda-Cyhalothrin', conc: '5% EC', cat: 'CAT-1', crop: ['Cotton', 'Bajra', 'Maize'], disease: ['Bollworm', 'Pink Bollworm'], dose: '5 ml / 15 L water' },
  { tech: 'Imidacloprid', conc: '17.8 SL', cat: 'CAT-1', crop: ['Cotton', 'Rice', 'Sugarcane'], disease: ['Whitefly', 'Jassid', 'Aphid', 'Thrips'], dose: '2 ml / 15 L water' },
  { tech: 'Acetamiprid', conc: '20% SP', cat: 'CAT-1', crop: ['Cotton', 'Chilli', 'Brinjal'], disease: ['Whitefly', 'Aphid', 'Thrips', 'Jassid'], dose: '2 g / 15 L water' },
  { tech: 'Thiamethoxam', conc: '25% WG', cat: 'CAT-1', crop: ['Cotton', 'Rice', 'Paddy'], disease: ['Whitefly', 'Jassid', 'Aphid', 'Thrips'], dose: '3 g / 15 L water' },
  { tech: 'Chlorpyrifos', conc: '20% EC', cat: 'CAT-1', crop: ['Cotton', 'Sugarcane', 'Groundnut'], disease: ['Bollworm', 'Mealybug', 'Aphid'], dose: '20 ml / 15 L water' },
  { tech: 'Profenofos', conc: '50% EC', cat: 'CAT-1', crop: ['Cotton', 'Tomato', 'Chilli'], disease: ['Bollworm', 'Pink Bollworm', 'Thrips'], dose: '15 ml / 15 L water' },
  { tech: 'Quinalphos', conc: '25% EC', cat: 'CAT-1', crop: ['Cotton', 'Soybean', 'Groundnut'], disease: ['Spotted Bollworm', 'Mealybug'], dose: '20 ml / 15 L water' },
  { tech: 'Fipronil', conc: '5% SC', cat: 'CAT-1', crop: ['Cotton', 'Paddy', 'Sugarcane'], disease: ['Bollworm', 'Whitefly', 'Thrips'], dose: '10 ml / 15 L water' },
  { tech: 'Tebuconazole', conc: '25% EC', cat: 'CAT-2', crop: ['Cotton', 'Wheat', 'Groundnut', 'Chilli'], disease: ['Powdery Mildew', 'Rust', 'Fusarium Wilt'], dose: '10 ml / 15 L water' },
  { tech: 'Propiconazole', conc: '25% EC', cat: 'CAT-2', crop: ['Wheat', 'Rice', 'Groundnut', 'Maize'], disease: ['Powdery Mildew', 'Rust', 'Blight', 'Leaf Spot'], dose: '10 ml / 15 L water' },
  { tech: 'Hexaconazole', conc: '5% EC', cat: 'CAT-2', crop: ['Cotton', 'Rice', 'Mango', 'Grapes'], disease: ['Powdery Mildew', 'Anthracnose', 'Blast'], dose: '10 ml / 15 L water' },
  { tech: 'Mancozeb', conc: '75% WP', cat: 'CAT-2', crop: ['Cotton', 'Potato', 'Tomato', 'Grapes'], disease: ['Anthracnose', 'Downy Mildew', 'Blight', 'Leaf Spot'], dose: '25 g / 15 L water' },
  { tech: 'Copper Oxychloride', conc: '50% WP', cat: 'CAT-2', crop: ['Pomegranate', 'Grapes', 'Citrus'], disease: ['Anthracnose', 'Blight', 'Bacterial Diseases'], dose: '30 g / 15 L water' },
  { tech: 'Trifloxystrobin + Tebuconazole', conc: '75 WG', cat: 'CAT-2', crop: ['Wheat', 'Soybean', 'Chilli'], disease: ['Rust', 'Powdery Mildew', 'Anthracnose'], dose: '6 g / 15 L water' },
  { tech: 'Azoxystrobin', conc: '23% SC', cat: 'CAT-2', crop: ['Grapes', 'Pomegranate', 'Mango', 'Tomato'], disease: ['Powdery Mildew', 'Downy Mildew', 'Anthracnose'], dose: '5 ml / 15 L water' },
  { tech: 'Kresoxim-Methyl', conc: '44% SC', cat: 'CAT-2', crop: ['Wheat', 'Rice', 'Apple', 'Grapes'], disease: ['Rust', 'Powdery Mildew', 'Blast'], dose: '5 ml / 15 L water' },
  { tech: 'Glyphosate', conc: '41% SL', cat: 'CAT-3', crop: ['All Crops'], disease: ['Broad Spectrum Weeds'], dose: '100 ml / 15 L water' },
  { tech: 'Paraquat Dichloride', conc: '24% SL', cat: 'CAT-3', crop: ['Orchards', 'Plantations'], disease: ['Grassy Weeds'], dose: '40 ml / 15 L water' },
  { tech: 'Pendimethalin', conc: '30% EC', cat: 'CAT-3', crop: ['Cotton', 'Soybean', 'Groundnut', 'Onion'], disease: ['Pre-emergence Weeds'], dose: '1 L / acre' },
  { tech: 'NPK 19:19:19', conc: '100% WSF', cat: 'CAT-4', crop: ['All Crops'], disease: ['Nutrition'], dose: '2.5 g / L water' },
  { tech: 'NPK 13:40:13', conc: '100% WSF', cat: 'CAT-4', crop: ['All Crops'], disease: ['Root Development'], dose: '2.5 g / L water' },
  { tech: 'NPK 13:0:45', conc: '100% WSF', cat: 'CAT-4', crop: ['All Crops'], disease: ['Flowering, Fruiting'], dose: '2.5 g / L water' },
  { tech: 'Micronutrient Mix', conc: 'Chelated', cat: 'CAT-4', crop: ['All Crops'], disease: ['Micro-nutrition'], dose: '1 g / L water' },
  { tech: 'Urea Phosphate', conc: '17:44:0', cat: 'CAT-4', crop: ['All Crops'], disease: ['Nutrition'], dose: '2 g / L water' },
  { tech: 'Potassium Nitrate', conc: '13:0:45', cat: 'CAT-4', crop: ['All Crops'], disease: ['Quality, Maturity'], dose: '2.5 g / L water' },
  { tech: 'Gibberellic Acid', conc: '0.001% L', cat: 'CAT-5', crop: ['Grapes', 'Cotton', 'Paddy'], disease: ['Growth Promotion'], dose: 'As per crop' },
  { tech: 'Ethephon', conc: '39% SL', cat: 'CAT-5', crop: ['Sugarcane', 'Cotton', 'Rice'], disease: ['Uniform Ripening'], dose: '2 ml / L water' },
  { tech: 'Triacontanol', conc: '0.05% GR', cat: 'CAT-5', crop: ['All Crops'], disease: ['Photosynthesis'], dose: '2.5 kg / acre' },
  { tech: 'Humic Acid', conc: '98%', cat: 'CAT-5', crop: ['All Crops'], disease: ['Soil Health'], dose: '1 kg / acre' },
  { tech: 'Seaweed Extract', conc: '28%', cat: 'CAT-5', crop: ['All Crops'], disease: ['Plant Stimulant'], dose: '3 ml / L water' },
  { tech: 'Pseudomonas Fluorescens', conc: '1 x 10^8 CFU/g', cat: 'CAT-6', crop: ['All Crops'], disease: ['Disease Control'], dose: '5 g / L water' },
  { tech: 'Trichoderma Viride', conc: '1 x 10^8 CFU/g', cat: 'CAT-6', crop: ['All Crops'], disease: ['Fungal Control'], dose: '5 g / L water' },
  { tech: 'Beauveria Bassiana', conc: '1 x 10^8 CFU/g', cat: 'CAT-6', crop: ['All Crops'], disease: ['Pest Control'], dose: '5 g / L water' },
  { tech: 'Bromadiolone', conc: '0.005%', cat: 'CAT-7', crop: ['All Crops'], disease: ['Rodent Control'], dose: 'Place bait stations' },
  { tech: 'Carbofuran', conc: '3% CG', cat: 'CAT-8', crop: ['Sugarcane', 'Rice', 'Maize'], disease: ['Root Knot Nematode'], dose: '33 kg / hectare' }
];

const PACK_SIZES = ['250ml', '500ml', '1L', '5L', '100g', '250g', '500g', '1kg', '5kg', '10kg', '20kg', '50kg'];
const TRANSPORT_COMPANIES = ['VRL Logistics', 'DTDC Express', 'Gati', 'Safexpress', 'Delhivery', 'TCI Express', 'Blue Dart', 'The Professional Couriers', 'First Flight', 'DHL'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloatBetween(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals));
}

function formatINR(n?: number | null | string): string {
  if (n === undefined || n === null || n === '' || isNaN(Number(n))) {
    return '₹0';
  }
  return '₹' + Number(n).toLocaleString('en-IN');
}

function pad(n: number, width = 4): string {
  return String(n).padStart(width, '0');
}

function generatePhone(): string {
  return '+91 9' + pad(randomBetween(10000, 99999), 5) + ' ' + pad(randomBetween(10000, 99999), 5);
}

function generateEmail(firstName: string, lastName: string, company = 'chitracropscience'): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company}.in`;
}

function randomDate(start: Date, end: Date): string {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const d = new Date(t);
  return d.toISOString().split('T')[0];
}

function randomDateTime(start: Date, end: Date): string {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t).toISOString().replace('T', ' ').slice(0, 16);
}

function generateGSTIN(stateCode = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const pan = 'A' + 'BCDEF' + chars[randomBetween(0, 25)] + randomBetween(1000, 9999) + chars[randomBetween(0, 25)];
  return String(stateCode).padStart(2, '0') + pan + randomBetween(1, 9) + chars[randomBetween(0, 25)] + randomBetween(0, 9);
}

function generatePAN(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  return (
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    chars[randomBetween(0, 25)] +
    nums[randomBetween(0, 9)] +
    nums[randomBetween(0, 9)] +
    nums[randomBetween(0, 9)] +
    nums[randomBetween(0, 9)] +
    chars[randomBetween(0, 25)]
  );
}

export const categories: Category[] = CROP_CATEGORIES.map((c, _i) => ({
  ...c,
  productCount: PRODUCT_COMPOSITIONS.filter(p => p.cat === c.id).length,
  status: 'Active'
}));

export const employees: Employee[] = Array.from({ length: 35 }, (_, i) => {
  const fname = randomFrom(FIRST_NAMES);
  const lname = randomFrom(LAST_NAMES);
  const deptChoice = randomBetween(1, 3);
  const department = deptChoice === 1 ? 'Sales' : deptChoice === 2 ? 'Inventory' : 'Operations';
  const desg: Record<string, string[]> = {
    Sales: ['Director - Sales', 'Zonal Manager', 'Regional Manager', 'Area Sales Manager', 'Sales Officer', 'Sales Representative', 'Marketing Executive'],
    Inventory: ['Warehouse Manager', 'Inventory Lead', 'Store Keeper', 'Quality Check Executive', 'Packing Supervisor', 'Dispatch Supervisor'],
    Operations: ['Operations Head', 'Operations Manager', 'Logistics Executive', 'Billing Executive', 'Accounts Executive', 'Customer Support']
  };
  const designation = randomFrom(desg[department]);
  const state = randomFrom(IN_STATES);
  const salary = randomBetween(240000, 1200000);
  const annualTarget = department === 'Sales' ? salary * randomBetween(8, 25) : 0;
  return {
    id: `EMP-${1000 + i}`,
    code: `CCS/EMP/${2024}/${pad(1000 + i)}`,
    name: `${fname} ${lname}`,
    mobile: generatePhone(),
    email: generateEmail(fname, lname),
    dob: randomDate(new Date(1980, 0, 1), new Date(1998, 11, 31)),
    gender: fname.endsWith('a') || fname.endsWith('na') || fname.endsWith('ta') || fname.endsWith('ya') || fname.endsWith('ha') || fname.endsWith('ma') || fname.endsWith('ra') || fname.endsWith('pa') ? 'Female' : 'Male',
    joiningDate: randomDate(new Date(2015, 0, 1), new Date(2024, 11, 31)),
    department,
    designation,
    reportingManager: designation.includes('Director') ? 'Board' : randomFrom(FIRST_NAMES) + ' ' + randomFrom(LAST_NAMES),
    territory: state,
    salary,
    annualTarget,
    monthlyTarget: Math.round(annualTarget / 12),
    monthlySalesPlan: Math.round(annualTarget / 12),
    monthlyCollectionPlan: Math.round((annualTarget / 12) * 0.85),
    status: i > 31 ? (i % 2 ? 'On Leave' : 'Resigned') : 'Active',
    aadhaarNo: String(randomBetween(1000, 9999)) + ' ' + String(randomBetween(1000, 9999)) + ' ' + String(randomBetween(1000, 9999)),
    panNo: generatePAN(),
    drivingLicense: 'GJ-' + randomFrom(['01', '02', '18', '27']) + randomFrom(['', 'V', 'Y']) + '20' + randomBetween(10, 23) + String(randomBetween(100000, 999999)).slice(0, 6),
    bankAccount: String(randomBetween(1000000000, 9999999999)),
    bankIfsc: randomFrom(['HDFC', 'SBIN', 'ICIC', 'BARB', 'CNRB', 'PUNB']) + '0' + randomBetween(100, 9999),
    bikeStartKm: randomBetween(10000, 35000),
    bikeEndKm: randomBetween(35001, 65000),
    documents: [
      { name: 'Aadhaar Card', type: 'Identity', date: '2024-01-15' },
      { name: 'PAN Card', type: 'Identity', date: '2024-01-15' },
      { name: 'Driving Licence', type: 'License', date: '2024-02-20' },
      { name: 'Offer Letter', type: 'HR', date: '2024-03-10' }
    ]
  };
});

export const distributors: Distributor[] = Array.from({ length: 18 }, (_, i) => {
  const fname = randomFrom(FIRST_NAMES);
  const lname = randomFrom(LAST_NAMES);
  const firmPrefixes = ['Shri', 'Shree', 'M/s', 'Sri', 'Shreeji', 'Shashwat', 'Siddhi', 'Samyak', 'Satvik'];
  const firmSuffixes = ['Agro Agencies', 'Agro Chemicals', 'Agro Services', 'Agro Traders', 'Agro Center', 'Agro Enterprises', 'Krishi Kendra', 'Krishi Seva', 'Kheti Bazar', 'Agro Mart'];
  const state = randomFrom(IN_STATES);
  const city = randomFrom(IN_CITIES);
  const district = randomFrom(IN_DISTRICTS);
  const dealers = randomBetween(8, 32);
  const creditLimit = randomBetween(500000, 5000000);
  const outstanding = randomBetween(0, Math.round(creditLimit * 0.85));
  return {
    id: `DIST-${2000 + i}`,
    code: `CCS/DIST/2024/${pad(2000 + i)}`,
    name: `${randomFrom(firmPrefixes)} ${fname} ${randomFrom(firmSuffixes)}`,
    firmName: `${lname} ${randomFrom(['Traders', 'Enterprises', 'Corporation', 'Agencies', 'Impex'])}`,
    ownerName: `${fname} ${lname}`,
    mobile: generatePhone(),
    email: generateEmail(fname, lname, `gmail`).replace('gmail', `${lname.toLowerCase()}agro`),
    address: `Plot No. ${randomBetween(10, 500)}, ${randomFrom(['GIDC', 'Industrial Area', 'Transport Nagar', 'APMC Yard'])}`,
    city,
    district,
    state,
    pincode: String(randomBetween(360001, 580001)),
    gstin: generateGSTIN(randomBetween(1, 36)),
    pan: generatePAN(),
    creditLimit,
    outstanding,
    assignedDealers: Array.from({ length: dealers }, (_, j) => `DLR-${5000 + i * 20 + j}`),
    territory: `${district} (${state})`,
    status: i > 15 ? 'Inactive' : 'Active',
    onboardingDate: randomDate(new Date(2018, 0, 1), new Date(2025, 6, 1))
  };
});

export const dealers: Dealer[] = Array.from({ length: 160 }, (_, i) => {
  const fname = randomFrom(FIRST_NAMES);
  const lname = randomFrom(LAST_NAMES);
  const dist = distributors[i % distributors.length];
  const activeEmp = employees.filter(e => e.department === 'Sales' && e.status === 'Active');
  const emp = activeEmp[i % activeEmp.length];
  const shopPrefixes = ['Shri', 'Shree', 'M/s', 'Sri', 'Shreeji', 'Shashwat', 'Siddhi', 'Samyak', 'Satvik', 'Om', 'Ganesh', 'Krishna', 'Radha'];
  const shopSuffixes = ['Krishi Kendra', 'Krishi Seva Kendra', 'Kheti Bazar', 'Agro Center', 'Agro Mart', 'Seeds Bhandar', 'Beej Bhandar', 'Khad Bhandar', 'Agriculture Store', 'Farm Supply', 'Fertilizer Depot'];
  const state = dist.state;
  const totalPurchases = randomBetween(200000, 8000000);
  return {
    id: `DLR-${5000 + i}`,
    code: `CCS/DLR/2024/${pad(5000 + i)}`,
    name: `${fname} ${lname}`,
    shopName: `${randomFrom(shopPrefixes)} ${lname} ${randomFrom(shopSuffixes)}`,
    ownerName: `${fname} ${lname}`,
    mobile: generatePhone(),
    email: generateEmail(fname, lname, `yahoo`).replace('yahoo', `${lname.toLowerCase()}shop`),
    address: `Main Bazaar, Near ${randomFrom(['Bus Stand', 'APMC', 'State Bank', 'Govt School', 'Village Sarpanch Office'])}`,
    village: randomFrom(IN_VILLAGES),
    tehsil: randomFrom(IN_TEHSILS),
    district: dist.district,
    state,
    pincode: String(randomBetween(360001, 580001)),
    distributor: dist.name,
    distributorId: dist.id,
    assignedEmployee: emp.name,
    employeeId: emp.id,
    gstin: i % 3 === 0 ? generateGSTIN(randomBetween(1, 36)) : undefined,
    outstanding: randomBetween(0, Math.round(totalPurchases * 0.35)),
    totalPurchases,
    status: i > 145 ? 'Prospect' : 'Active',
    onboardingDate: randomDate(new Date(2019, 0, 1), new Date(2025, 11, 31)),
    complaints: randomBetween(0, 6),
    returns: randomBetween(0, 4)
  };
});

export const products: Product[] = PRODUCT_COMPOSITIONS.map((p, i) => {
  const cat = categories.find(c => c.id === p.cat)!;
  const mrp = [100, 250, 500, 1000, 250, 500, 1000, 1500, 2000][i % 9] + randomBetween(20, 500);
  const gst = [12, 18, 12, 18, 12, 18, 5, 12][i % 8];
  const stockUnits = randomBetween(50, 2500);
  return {
    id: `PRD-${3000 + i}`,
    code: `CCS/PRD/${pad(3000 + i)}`,
    sku: `${p.tech.slice(0, 3).toUpperCase()}-${pad(randomBetween(100, 999), 3)}`,
    name: `Chitra ${p.tech.split(' ')[0]}${randomFrom(['-X', '-Gold', '-Plus', '-Ultra', '-Max', '-Super', '-Pro', ''])}`,
    technicalName: `${p.tech} ${p.conc}`,
    categoryId: p.cat,
    category: cat.name,
    composition: `${p.tech} ${p.conc}`,
    crop: p.crop,
    disease: p.disease,
    benefits: [
      `Excellent control of ${p.disease.slice(0, 2).join(', ')}`,
      'Quick knock-down action',
      'Long duration residual effect',
      'Safe for crop at recommended dosage',
      'Improves crop health & yield'
    ],
    dosage: p.dose,
    packaging: PACK_SIZES.slice(0, randomBetween(3, 8)),
    mrp,
    distributorPrice: Math.round(mrp * 0.65),
    dealerPrice: Math.round(mrp * 0.78),
    gst,
    hsn: String(3808) + String(randomBetween(10, 99)),
    stock: stockUnits,
    reserved: randomBetween(0, Math.floor(stockUnits * 0.15)),
    damaged: randomBetween(0, Math.floor(stockUnits * 0.03)),
    reorderLevel: Math.floor(stockUnits * 0.2),
    batchNo: `B${randomBetween(2024, 2025)}-${pad(randomBetween(1, 365), 3)}`,
    expiryDate: randomDate(new Date(2025, 6, 1), new Date(2027, 5, 30)),
    images: [],
    pdf: undefined,
    status: stockUnits === 0 ? 'Out of Stock' : i > 30 ? 'Discontinued' : 'Active'
  };
});

const ORDER_STATUSES: import('./ccsTypes').OrderStatus[] = [
  'Draft',
  'Submitted',
  'Pending Approval',
  'Approved',
  'Packing',
  'Ready Dispatch',
  'Dispatched',
  'Delivered',
  'Invoice Generated',
  'Payment Pending',
  'Completed'
];

export const orders: Order[] = Array.from({ length: 120 }, (_, i) => {
  const dealer = dealers[i % dealers.length];
  const distributor = distributors.find(d => d.id === dealer.distributorId)!;
  const activeEmp = employees.filter(e => e.department === 'Sales');
  const employee = activeEmp[i % activeEmp.length];
  const itemCount = randomBetween(2, 8);
  const orderItems = Array.from({ length: itemCount }, (_, j) => {
    const prod = products[(i * 3 + j) % products.length];
    const qty = randomBetween(2, 50);
    const price = prod.dealerPrice;
    const amount = qty * price;
    return {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: qty,
      unitPrice: price,
      mrp: prod.mrp,
      gst: prod.gst,
      amount
    };
  });
  const subtotal = orderItems.reduce((s, it) => s + it.amount, 0);
  const discount = Math.round(subtotal * randomFloatBetween(0, 0.05, 4));
  const gstBase = subtotal - discount;
  const gstAmount = Math.round(gstBase * 0.12);
  const freight = randomBetween(0, 2500);
  const total = gstBase + gstAmount + freight;
  const statusIdx = randomBetween(2, 10);
  const status: import('./ccsTypes').OrderStatus = ORDER_STATUSES[statusIdx];
  const created = randomDate(new Date(2025, 0, 1), new Date(2025, 6, 25));
  const buildHistory = (): import('./ccsTypes').Order['history'] => {
    const h: import('./ccsTypes').Order['history'] = [];
    for (let s = 0; s <= statusIdx; s++) {
      h.push({
        status: ORDER_STATUSES[s],
        date: randomDateTime(new Date(created + 'T00:00:00'), new Date(2025, 6, 26, 18, 0, 0)),
        by: s <= 1 ? dealer.name : s <= 3 ? employee.name : randomFrom(['Dispatch Dept', 'Accounts Dept', 'Warehouse', 'Logistics Team']),
        note: ORDER_STATUSES[s] === 'Approved' ? 'Approved after stock verification' :
              ORDER_STATUSES[s] === 'Delivered' ? 'Signed POD received' :
              ORDER_STATUSES[s] === 'Invoice Generated' ? 'GST Invoice generated' : undefined
      });
    }
    return h;
  };
  return {
    id: `ORD-${9000 + i}`,
    orderNo: `CCS/ORD/${2025}/${pad(9000 + i)}`,
    dealerId: dealer.id,
    dealerName: dealer.name,
    shopName: dealer.shopName,
    distributorId: distributor.id,
    distributorName: distributor.name,
    employeeId: employee.id,
    employeeName: employee.name,
    items: orderItems,
    subtotal,
    discount,
    gstAmount,
    freight,
    total,
    status,
    createdAt: created,
    approvedAt: statusIdx >= 3 ? randomDate(new Date(created), new Date(2025, 6, 26)) : undefined,
    dispatchedAt: statusIdx >= 6 ? randomDate(new Date(created), new Date(2025, 6, 26)) : undefined,
    deliveredAt: statusIdx >= 7 ? randomDate(new Date(created), new Date(2025, 6, 26)) : undefined,
    invoiceGeneratedAt: statusIdx >= 8 ? randomDate(new Date(created), new Date(2025, 6, 26)) : undefined,
    expectedDelivery: statusIdx >= 5 ? randomDate(new Date(created), new Date(2025, 7, 5)) : undefined,
    vehicleNo: statusIdx >= 6 ? randomFrom(['GJ', 'MH', 'PB', 'HR', 'RJ', 'MP', 'UP', 'KA'])[0] + String(randomBetween(1, 28)).padStart(2, '0') + randomFrom(['AB', 'CD', 'EF', 'GH', 'JK', 'LM']).slice(0, 2) + String(randomBetween(1000, 9999)) : undefined,
    driverName: statusIdx >= 6 ? randomFrom(FIRST_NAMES) + ' ' + randomFrom(LAST_NAMES) : undefined,
    lrNumber: statusIdx >= 6 ? randomFrom(TRANSPORT_COMPANIES)[0].slice(0, 3).toUpperCase() + '/' + String(randomBetween(2025, 2025)) + '/' + pad(randomBetween(1, 9999), 4) : undefined,
    transport: statusIdx >= 6 ? randomFrom(TRANSPORT_COMPANIES) : undefined,
    proofOfDelivery: statusIdx >= 7 ? `POD-${pad(randomBetween(1, 99999), 5)}.pdf` : undefined,
    comments: i % 7 === 0 ? 'Please dispatch via preferred transporter' : i % 11 === 0 ? 'Urgent order for immediate dispatch' : undefined,
    history: buildHistory()
  };
});

export const invoices: Invoice[] = Array.from({ length: 72 }, (_, i) => {
  const ord = orders.filter(o => ['Invoice Generated', 'Payment Pending', 'Completed'].includes(o.status))[i % 70];
  if (!ord) return null as unknown as Invoice;
  const dealer = dealers.find(d => d.id === ord.dealerId)!;
  const subtotal = ord.subtotal - ord.discount;
  const cgst = Math.round(subtotal * 0.06);
  const sgst = Math.round(subtotal * 0.06);
  const igst = Math.round(subtotal * 0.12) * (i % 2);
  const totalGst = cgst + sgst + igst;
  const grandTotal = subtotal + totalGst + ord.freight;
  const paidStatuses: Invoice['status'][] = ['Paid', 'Partial', 'Unpaid', 'Overdue'];
  const pidx = randomBetween(0, 3);
  const paymentReceived = pidx === 0 ? grandTotal : pidx === 1 ? Math.round(grandTotal * randomFloatBetween(0.3, 0.8, 2)) : 0;
  const hsnMap = new Map<string, { taxableValue: number; gstRate: number; cgst: number; sgst: number; igst: number }>();
  ord.items.forEach(it => {
    const prod = products.find(p => p.id === it.productId);
    const hsn = prod?.hsn || '380891';
    const existing = hsnMap.get(hsn) || { taxableValue: 0, gstRate: prod?.gst || 12, cgst: 0, sgst: 0, igst: 0 };
    existing.taxableValue += it.amount;
    hsnMap.set(hsn, existing);
  });
  const hsnSummary = Array.from(hsnMap.entries()).map(([hsn, v]) => ({
    hsn,
    taxableValue: v.taxableValue,
    gstRate: v.gstRate,
    cgst: Math.round(v.taxableValue * v.gstRate / 200),
    sgst: Math.round(v.taxableValue * v.gstRate / 200),
    igst: Math.round(v.taxableValue * v.gstRate / 100) * (i % 2)
  }));
  return {
    id: `INV-${1000 + i}`,
    invoiceNo: `CCS/INV/${2025}/${pad(1000 + i)}`,
    orderId: ord.id,
    orderNo: ord.orderNo,
    dealerId: dealer.id,
    dealerName: dealer.name,
    shopName: dealer.shopName,
    gstin: dealer.gstin || generateGSTIN(24),
    address: `${dealer.address}, ${dealer.village}, ${dealer.tehsil}, ${dealer.district} - ${dealer.pincode}, ${dealer.state}`,
    items: ord.items,
    subtotal,
    discount: ord.discount,
    cgst,
    sgst,
    igst,
    totalGst,
    freight: ord.freight,
    grandTotal,
    status: paidStatuses[pidx],
    paymentReceived,
    outstanding: grandTotal - paymentReceived,
    dueDate: randomDate(new Date(ord.createdAt), new Date(2025, 8, 30)),
    issueDate: ord.createdAt,
    placeOfSupply: `${dealer.state} (${randomBetween(1, 36)})`,
    hsnSummary
  };
}).filter(Boolean);

export const warehouseTransactions: WarehouseTransaction[] = Array.from({ length: 200 }, (_, i) => {
  const prod = products[i % products.length];
  const types: import('./ccsTypes').WarehouseTransaction['type'][] = ['Incoming', 'Outgoing', 'Reserved', 'Damaged', 'Return', 'Adjustment'];
  const weights = [50, 35, 8, 3, 2, 2];
  let r = Math.random() * 100;
  let type: import('./ccsTypes').WarehouseTransaction['type'] = 'Incoming';
  for (let k = 0; k < weights.length; k++) {
    r -= weights[k];
    if (r <= 0) { type = types[k]; break; }
  }
  const qty = randomBetween(1, 500);
  const rate = prod.distributorPrice;
  const refPrefix = type === 'Incoming' ? 'GRN' : type === 'Outgoing' ? 'INV' : type === 'Reserved' ? 'ORD' : type === 'Damaged' ? 'DN' : type === 'Return' ? 'RTN' : 'ADJ';
  return {
    id: `TXN-${7000 + i}`,
    date: randomDate(new Date(2025, 0, 1), new Date(2025, 6, 26)),
    type,
    productId: prod.id,
    productName: prod.name,
    sku: prod.sku,
    batchNo: prod.batchNo || 'BATCH-' + pad(randomBetween(1, 9999), 4),
    quantity: type === 'Outgoing' || type === 'Damaged' || type === 'Return' ? -qty : qty,
    unit: 'Nos',
    rate,
    value: Math.abs(qty) * rate,
    referenceNo: `${refPrefix}-${pad(randomBetween(1000, 9999), 4)}`,
    referenceType: type,
    warehouse: randomFrom(['Main Warehouse - Ahmedabad', 'Regional Warehouse - Rajkot', 'Regional Warehouse - Nagpur', 'Regional Warehouse - Amritsar', 'Regional Warehouse - Jaipur']),
    remarks: type === 'Damaged' ? 'Leakage / transit damage' : type === 'Return' ? 'Dealer return - expired batch' : type === 'Adjustment' ? 'Physical count adjustment' : undefined
  };
});

export const attendances: AttendanceRecord[] = Array.from({ length: employees.length * 14 }, (_, i) => {
  const emp = employees[i % employees.length];
  const baseDate = new Date(2025, 6, 13);
  const dayIdx = Math.floor(i / employees.length);
  const dateObj = new Date(baseDate);
  dateObj.setDate(baseDate.getDate() - dayIdx);
  const date = dateObj.toISOString().split('T')[0];
  const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const isPresent = !isWeekend && i % 22 !== 0;
  const checkInHour = randomBetween(7, 10);
  const checkInMin = randomBetween(0, 59);
  const checkOutHour = randomBetween(17, 20);
  const checkOutMin = randomBetween(0, 59);
  const startKm = emp.bikeStartKm ? emp.bikeStartKm + randomBetween(0, 500) : 0;
  const endKm = startKm + randomBetween(30, 220);
  const stateLatLon: Record<string, [number, number]> = {
    Gujarat: [22.3039, 70.8022], Maharashtra: [19.0760, 72.8777], Punjab: [31.1471, 75.3412],
    Haryana: [29.0588, 76.0856], Rajasthan: [26.4499, 74.6399], MadhyaPradesh: [22.9734, 78.6569],
    UttarPradesh: [26.8467, 80.9462], Karnataka: [15.3173, 75.7139]
  };
  const latlon = stateLatLon[emp.territory.split(' ')[0]] || [22.3039, 70.8022];
  return {
    id: `ATT-${pad(i + 1, 6)}`,
    employeeId: emp.id,
    employeeName: emp.name,
    date,
    checkIn: {
      time: `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`,
      latitude: latlon[0] + randomFloatBetween(-0.1, 0.1, 6),
      longitude: latlon[1] + randomFloatBetween(-0.1, 0.1, 6),
      location: `${randomFrom(IN_VILLAGES)}, ${randomFrom(IN_TEHSILS)}, ${emp.territory}`
    },
    checkOut: isPresent ? {
      time: `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}`,
      latitude: latlon[0] + randomFloatBetween(-0.15, 0.15, 6),
      longitude: latlon[1] + randomFloatBetween(-0.15, 0.15, 6),
      location: `${randomFrom(IN_VILLAGES)}, ${randomFrom(IN_TEHSILS)}, ${emp.territory}`
    } : undefined,
    workingHours: isPresent ? +(randomFloatBetween(7, 11.5, 2)) : 0,
    status: isWeekend ? 'Holiday' : i % 22 === 0 ? 'Leave' : isPresent ? (randomBetween(1, 6) === 1 ? 'Half Day' : 'Present') : 'Absent',
    morningPlan: `Dealer visits: ${randomBetween(4, 10)} outlets. Target collection: ${formatINR(randomBetween(5000, 100000))}`,
    visitPlan: Array.from({ length: randomBetween(2, 6) }, (_, k) => dealers[(i * 5 + k) % dealers.length].shopName),
    bikeStartKm: startKm,
    bikeEndKm: isPresent ? endKm : undefined,
    distanceTravelled: isPresent ? randomBetween(30, 220) : 0
  };
});

export const expenses: Expense[] = Array.from({ length: 90 }, (_, i) => {
  const emp = employees[i % employees.length];
  const cats: import('./ccsTypes').Expense['category'][] = ['Fuel', 'Travel', 'Hotel', 'Food', 'Misc', 'TA/DA'];
  const category = cats[i % cats.length];
  const amt: Record<string, number> = { Fuel: randomBetween(1000, 5000), Travel: randomBetween(500, 6000), Hotel: randomBetween(1500, 8000), Food: randomBetween(300, 2500), Misc: randomBetween(100, 3000), 'TA/DA': randomBetween(2000, 15000) };
  const statuses: import('./ccsTypes').Expense['status'][] = ['Pending', 'Approved', 'Paid', 'Rejected'];
  const weights = [30, 35, 30, 5];
  let r = Math.random() * 100;
  let status = 'Pending';
  for (let k = 0; k < weights.length; k++) { r -= weights[k]; if (r <= 0) { status = statuses[k]; break; } }
  const statusT = status as import('./ccsTypes').Expense['status'];
  const mgr = employees.find(e => e.designation.includes('Manager')) || emp;
  return {
    id: `EXP-${4000 + i}`,
    employeeId: emp.id,
    employeeName: emp.name,
    date: randomDate(new Date(2025, 5, 1), new Date(2025, 6, 26)),
    category,
    description: category === 'Fuel' ? `Petrol/Diesel for bike travel across ${emp.territory} territory` :
                   category === 'Travel' ? `Bus / Train / Auto fare for dealer visits` :
                   category === 'Hotel' ? `Stay at ${randomFrom(['Hotel City Pride', 'Hotel Gopal', 'Hotel Highway King', 'Hotel Sai Palace', 'Hotel Shubham'])}` :
                   category === 'Food' ? `Meals during dealer visits & field work` :
                   category === 'TA/DA' ? `Travelling allowance & Daily allowance for field tour` :
                   `Printing, stationery, toll, parking or other misc`,
    amount: amt[category],
    billNo: `BILL/${pad(randomBetween(10000, 99999), 5)}`,
    receipt: undefined,
    status: statusT,
    approvedBy: statusT !== 'Pending' ? mgr.name : undefined,
    approvedAt: statusT !== 'Pending' ? randomDate(new Date(2025, 5, 1), new Date(2025, 6, 26)) : undefined,
    paymentDate: statusT === 'Paid' ? randomDate(new Date(2025, 6, 1), new Date(2025, 6, 26)) : undefined,
    remarks: statusT === 'Rejected' ? 'Receipts missing' : undefined
  };
});

export const collections: Collection[] = Array.from({ length: 85 }, (_, i) => {
  const inv = invoices[i % invoices.length];
  const modes: import('./ccsTypes').Collection['mode'][] = ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI', 'DD', 'Card'];
  const mode = modes[i % modes.length];
  const statuses: import('./ccsTypes').Collection['status'][] = ['Received', 'Deposited', 'Cleared', 'Bounced'];
  const sidx = mode === 'Cheque' ? randomBetween(0, 3) : randomBetween(1, 2);
  const bank = randomFrom(['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Bank of Baroda', 'Punjab National Bank', 'Canara Bank', 'Union Bank of India']);
  const dealer = dealers.find(d => d.id === inv.dealerId)!;
  const dist = distributors.find(d => d.id === dealer.distributorId)!;
  const emp = employees.find(e => e.id === dealer.employeeId)!;
  return {
    id: `COL-${8000 + i}`,
    receiptNo: `CCS/RCPT/${2025}/${pad(8000 + i)}`,
    date: randomDate(new Date(2025, 0, 1), new Date(2025, 6, 26)),
    dealerId: inv.dealerId,
    dealerName: inv.dealerName,
    distributorId: dist.id,
    distributorName: dist.name,
    invoiceId: inv.id,
    invoiceNo: inv.invoiceNo,
    amount: Math.min(inv.grandTotal, randomBetween(10000, 500000)),
    mode,
    referenceNo: mode === 'Cash' ? `CCS-CASH-${pad(i, 5)}` : mode === 'UPI' ? randomBetween(100000000000, 999999999999).toString() : `${randomFrom(['SBIN', 'HDFC', 'ICIC', 'BARB', 'CNRB', 'PUNB'])}/REF/${pad(randomBetween(1, 999999), 6)}`,
    bankName: ['Cheque', 'NEFT', 'RTGS', 'DD'].includes(mode) ? bank : undefined,
    chequeDate: mode === 'Cheque' || mode === 'DD' ? randomDate(new Date(2025, 0, 1), new Date(2025, 7, 30)) : undefined,
    status: statuses[sidx],
    collectedBy: emp.name,
    depositedAt: sidx >= 1 ? randomDate(new Date(2025, 0, 1), new Date(2025, 6, 26)) : undefined,
    clearedAt: sidx === 2 || sidx === 3 ? randomDate(new Date(2025, 0, 1), new Date(2025, 6, 26)) : undefined,
    remarks: sidx === 3 ? 'Cheque bounced - insufficient funds' : mode === 'UPI' ? 'GooglePay / PhonePe QR' : undefined
  };
});

export const targets: Target[] = [
  ...employees.filter(e => e.department === 'Sales' && e.annualTarget > 0).slice(0, 18).map((e, i) => {
    const achieved = Math.round(e.monthlyTarget * randomFloatBetween(0.55, 1.35, 2));
    const pct = Math.round((achieved / e.monthlyTarget) * 100);
    let status: import('./ccsTypes').Target['status'] = 'Behind';
    if (pct >= 100) status = pct > 110 ? 'Exceeded' : 'Achieved';
    else if (pct >= 80) status = 'On Track';
    return {
      id: `TGT-EMP-${100 + i}`,
      period: 'July 2025',
      periodType: 'Monthly' as const,
      assigneeType: 'Employee' as const,
      assigneeId: e.id,
      assigneeName: e.name,
      targetAmount: e.monthlyTarget,
      monthlySalesPlan: e.monthlyTarget,
      monthlyCollectionPlan: Math.round(e.monthlyTarget * 0.9),
      achievedAmount: achieved,
      targetUnits: randomBetween(120, 500),
      achievedUnits: Math.round(randomBetween(120, 500) * randomFloatBetween(0.6, 1.3, 2)),
      status,
      percentage: pct
    };
  }),
  ...distributors.filter(d => d.status === 'Active').slice(0, 10).map((d, i) => {
    const tgt = randomBetween(2500000, 15000000);
    const achieved = Math.round(tgt * randomFloatBetween(0.5, 1.3, 2));
    const pct = Math.round((achieved / tgt) * 100);
    let status: import('./ccsTypes').Target['status'] = 'Behind';
    if (pct >= 100) status = pct > 110 ? 'Exceeded' : 'Achieved';
    else if (pct >= 80) status = 'On Track';
    return {
      id: `TGT-DIST-${200 + i}`,
      period: 'Q3 FY 2025-26',
      periodType: 'Quarterly' as const,
      assigneeType: 'Distributor' as const,
      assigneeId: d.id,
      assigneeName: d.name,
      targetAmount: tgt,
      monthlySalesPlan: tgt,
      monthlyCollectionPlan: Math.round(tgt * 0.9),
      achievedAmount: achieved,
      status,
      percentage: pct
    };
  })
];

export const notifications: Notification[] = [
  { id: 'NOT-1', title: 'New Order Received', message: 'Order #ORD-9004 from Shri Patel Krishi Kendra - ₹1,45,200 pending approval', type: 'info', category: 'Order', read: false, createdAt: '2025-07-27 09:15', referenceId: 'ORD-9004', actionUrl: '/orders/ORD-9004' },
  { id: 'NOT-2', title: 'Payment Overdue', message: 'Invoice #INV-1012 for ₹2,38,450 from Dantivada Agro Center is 12 days overdue', type: 'warning', category: 'Payment', read: false, createdAt: '2025-07-27 08:45', referenceId: 'INV-1012', actionUrl: '/invoices' },
  { id: 'NOT-3', title: 'Low Stock Alert', message: 'Chitra Imidacloprid 17.8 SL stock level (25 units) below reorder point of 50 units', type: 'error', category: 'Stock', read: false, createdAt: '2025-07-27 08:00', referenceId: 'PRD-3001', actionUrl: '/warehouse' },
  { id: 'NOT-4', title: 'Expense Approved', message: 'EXP-4018 (TA/DA ₹12,500) for Rajesh Patel approved by Zonal Manager', type: 'success', category: 'Expense', read: true, createdAt: '2025-07-26 17:30' },
  { id: 'NOT-5', title: 'Support Ticket Raised', message: '#TK-2045 Complaint from Rural Farms regarding product quality', type: 'warning', category: 'Support', read: false, createdAt: '2025-07-26 16:12', referenceId: 'TK-2045', actionUrl: '/support' },
  { id: 'NOT-6', title: 'Product Expiring Soon', message: '245 units of Batch B2024-185 will expire in 30 days. Initiate FIFO clearance.', type: 'warning', category: 'Stock', read: true, createdAt: '2025-07-26 14:00' },
  { id: 'NOT-7', title: 'Dealer Onboarding', message: 'DLR-5144 - Om Patel Krishi Seva Kendra - dealer registration pending approval', type: 'approval', category: 'System', read: false, createdAt: '2025-07-26 12:30' },
  { id: 'NOT-8', title: 'Cheque Bounced', message: 'Collection #COL-8015 Cheque ₹65,000 from Girdhari Lal & Sons bounced', type: 'error', category: 'Payment', read: false, createdAt: '2025-07-26 11:15', referenceId: 'COL-8015', actionUrl: '/collections' },
  { id: 'NOT-9', title: 'Target Achievement', message: 'Regional Manager Asha Shah achieved 112% of monthly sales target', type: 'success', category: 'Order', read: true, createdAt: '2025-07-25 20:00' },
  { id: 'NOT-10', title: 'System Maintenance', message: 'Scheduled server maintenance on 3rd Aug 2025 (Sunday) from 02:00 AM to 05:00 AM IST', type: 'info', category: 'System', read: true, createdAt: '2025-07-25 18:00' },
  { id: 'NOT-11', title: 'Order Dispatched', message: 'Order #ORD-9022 dispatched via VRL Logistics LR: VRL/2025/4321', type: 'info', category: 'Order', read: true, createdAt: '2025-07-25 15:45', referenceId: 'ORD-9022', actionUrl: '/dispatch' },
  { id: 'NOT-12', title: 'Collection Received', message: 'RTGS ₹3,45,000 credited towards Invoice #INV-1034', type: 'success', category: 'Payment', read: true, createdAt: '2025-07-25 14:20' }
];

export const supportTickets: SupportTicket[] = Array.from({ length: 42 }, (_, i) => {
  const dealer = dealers[i % dealers.length];
  const types: import('./ccsTypes').SupportTicket['type'][] = ['Complaint', 'Return', 'Replacement', 'Query', 'Request'];
  const type = types[i % types.length];
  const priorities: import('./ccsTypes').SupportTicket['priority'][] = ['Low', 'Medium', 'High', 'Critical'];
  const priority = priorities[i % 4];
  const statuses: import('./ccsTypes').SupportTicket['status'][] = ['New', 'Assigned', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'];
  const status = statuses[i % 6];
  const emp = employees.find(e => e.id === dealer.employeeId)!;
  const prod = products[i % products.length];
  const titles = {
    Complaint: [`Product packaging leak`, `Product not effective - crop damage`, `Delayed order`, `Wrong product delivered`, `GST invoice mismatch`, `Price discrepancy`],
    Return: [`Return - expiry product`, `Return - damaged in transit`, `Return - wrong item sent`, `Return - short quantity received`],
    Replacement: [`Replacement - damaged bottle`, `Replacement - manufacturing defect`, `Replacement - wrong batch`],
    Query: [`Product technical guidance`, `Dosage clarification for ${prod.crop[0]}`, `Price list enquiry`, `New product availability`, `Credit limit query`],
    Request: [`New distributor appointment`, `Sample request for trial`, `Demonstration request`, `Marketing material request`, `Training program request`]
  };
  const created = randomDate(new Date(2025, 6, 1), new Date(2025, 6, 26));
  const resolved = ['Resolved', 'Closed'].includes(status) ? randomDate(new Date(created), new Date(2025, 6, 26)) : undefined;
  return {
    id: `TK-200${pad(i, 2)}`,
    ticketNo: `CCS/TK/${2025}/${pad(2000 + i)}`,
    title: randomFrom(titles[type]),
    type,
    priority,
    status,
    raisedBy: dealer.name,
    raisedById: dealer.id,
    raisedByType: 'Dealer',
    assignee: ['Assigned', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'].includes(status) ? emp.name : undefined,
    assigneeId: ['Assigned', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'].includes(status) ? emp.id : undefined,
    productId: ['Complaint', 'Return', 'Replacement'].includes(type) ? prod.id : undefined,
    productName: ['Complaint', 'Return', 'Replacement'].includes(type) ? prod.name : undefined,
    orderId: i % 3 === 0 ? orders[i % orders.length].id : undefined,
    orderNo: i % 3 === 0 ? orders[i % orders.length].orderNo : undefined,
    createdAt: created,
    updatedAt: randomDate(new Date(created), new Date(2025, 6, 26)),
    resolvedAt: resolved,
    description: `Dealer reports issue related to order/shipment. Details attached. Please investigate and respond within 24 hours. Customer satisfaction is priority.`,
    resolution: resolved ? `Issue resolved via ${randomFrom(['product replacement', 'credit note adjustment', 'phone clarification', 'field visit', 'email explanation'])} within SLA. Customer satisfied.` : undefined,
    attachments: i % 3 === 0 ? [{ name: 'photo-evidence.jpg', type: 'image', size: '1.2 MB' }, { name: 'delivery-challan.pdf', type: 'pdf', size: '250 KB' }] : undefined,
    messages: [
      { from: 'Customer', by: dealer.name, time: created + ' 09:15', message: 'Raising ticket for the issue encountered. Please look into this urgently.' },
      ...(['Assigned', 'In Progress', 'Pending Customer', 'Resolved', 'Closed'].includes(status) ? [{ from: 'Support', by: emp.name, time: created + ' 10:30', message: 'Thank you for reaching out. We are investigating and will update soon.' }] : []),
      ...(['In Progress', 'Pending Customer', 'Resolved', 'Closed'].includes(status) ? [{ from: 'Support', by: emp.name, time: created + ' 14:45', message: 'Team has visited the outlet, collected evidence. Working on resolution.' }] : []),
      ...(['Resolved', 'Closed'].includes(status) ? [{ from: 'Support', by: emp.name, time: resolved + ' 16:20', message: `Resolution applied. Ticket closing. Please reopen if needed.` }] : [])
    ]
  };
});

export const activities: Activity[] = [
  { id: 'ACT-1', time: '2 min ago', title: 'New Order #ORD-9004', description: 'Shri Patel Krishi Kendra placed order worth ₹1,45,200', type: 'order', user: 'Dealer Portal', role: 'Dealer' },
  { id: 'ACT-2', time: '15 min ago', title: 'Invoice Approved', description: 'Invoice #INV-1041 for ₹2,85,000 approved by Accounts', type: 'invoice', user: 'Accounts Dept', role: 'Admin' },
  { id: 'ACT-3', time: '32 min ago', title: 'Payment Received', description: 'RTGS ₹5,00,000 from Distributor Shashwat Enterprises', type: 'payment', user: 'Bank Feed', role: 'System' },
  { id: 'ACT-4', time: '1 hour ago', title: 'Goods Inward', description: 'GRN #GRN-4412 - 850 units received from manufacturer', type: 'stock', user: 'Warehouse', role: 'Operations' },
  { id: 'ACT-5', time: '2 hours ago', title: 'Field Check-In', description: 'Sales Officer Rohan Mehta checked in at Banaskantha territory', type: 'attendance', user: 'Rohan Mehta', role: 'Employee' },
  { id: 'ACT-6', time: '3 hours ago', title: 'Expense Claimed', description: 'Asha Shah claimed Fuel + TA/DA ₹18,250 for Gujarat tour', type: 'expense', user: 'Asha Shah', role: 'Employee' },
  { id: 'ACT-7', time: '4 hours ago', title: 'Order Dispatched', description: '28 orders dispatched via 6 vehicles, total value ₹38.4L', type: 'order', user: 'Logistics Team', role: 'Operations' },
  { id: 'ACT-8', time: '6 hours ago', title: 'Price List Updated', description: 'FY 2025-26 Q3 price list effective from today', type: 'system', user: 'Admin', role: 'Admin' },
  { id: 'ACT-9', time: 'Yesterday 18:32', title: 'Support Ticket Resolved', description: '#TK-2011 - Product complaint resolved within 36 hours', type: 'system', user: 'Support Team', role: 'Admin' },
  { id: 'ACT-10', time: 'Yesterday 16:05', title: 'Dealer Onboarded', description: '12 new dealers registered across Madhya Pradesh', type: 'order', user: 'Sales Team', role: 'Admin' }
];

export const dashboardKPIs: DashboardKPIs = {
  todayOrders: { value: 42, change: 8.2 },
  pendingOrders: { value: 18, change: -2.4 },
  approvedOrders: { value: 64, change: 4.1 },
  dispatchToday: { value: 28, change: 12.3 },
  deliveredToday: { value: 35, change: 6.8 },
  revenue: { value: 4285000, change: 10.4 },
  collection: { value: 2915000, change: 14.7 },
  outstanding: { value: 18450000, change: -1.8 },
  warehouseStock: { value: 28450, change: 2.3 },
  lowStock: { value: 12, change: 5 },
  employees: { value: 35, change: 0 },
  dealers: { value: 160, change: 5.3 },
  distributors: { value: 18, change: 0 }
};

export const monthlyData: MonthlyData = {
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  sales: [85, 92, 110, 98, 125, 148, 168, 155, 130, 105, 95, 118],
  revenue: [285, 310, 365, 330, 415, 485, 562, 520, 435, 365, 325, 405],
  collections: [250, 275, 335, 305, 385, 435, 490, 470, 405, 345, 305, 380],
  orders: [58, 62, 72, 68, 84, 96, 108, 102, 88, 76, 68, 82]
};

export const orderStatusData = [
  { name: 'Draft', value: 8 },
  { name: 'Submitted', value: 12 },
  { name: 'Pending Approval', value: 18 },
  { name: 'Approved', value: 24 },
  { name: 'Packing', value: 16 },
  { name: 'Ready Dispatch', value: 20 },
  { name: 'Dispatched', value: 32 },
  { name: 'Delivered', value: 42 },
  { name: 'Payment Pending', value: 28 },
  { name: 'Completed', value: 85 }
];

export const topProducts = products.slice(0, 8).map((p, _i) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  unitsSold: randomBetween(250, 2400),
  revenue: randomBetween(450000, 3200000),
  growth: randomFloatBetween(-8, 32, 1)
}));

export const topEmployees = employees.filter(e => e.department === 'Sales').slice(0, 8).map((e, _i) => ({
  id: e.id,
  name: e.name,
  designation: e.designation,
  territory: e.territory,
  target: e.monthlyTarget,
  achieved: Math.round(e.monthlyTarget * randomFloatBetween(0.72, 1.38, 2)),
  orders: randomBetween(18, 65),
  dealers: randomBetween(25, 90)
}));

export const dealerPerformance = dealers.slice(0, 10).map((d, _i) => ({
  id: d.id,
  name: d.shopName,
  owner: d.name,
  distributor: d.distributor,
  purchase: d.totalPurchases,
  outstanding: d.outstanding,
  orders: randomBetween(6, 52),
  rating: randomFloatBetween(3, 5, 1)
}));

export { formatINR, randomFrom, randomBetween, pad, randomDate, randomDateTime };
