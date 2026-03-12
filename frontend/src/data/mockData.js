// ============================================================
//  Mock Data — Ceyntics IMS
//  This simulates the data that would come from the Laravel API.
//  In production, replace these with real API calls via axios/fetch.
// ============================================================

// ── Users ────────────────────────────────────────────────────
export const MOCK_USERS = [
  { id: 'u1', name: 'Saman Kumara',  email: 'admin@ceyntics.com',  role: 'admin',  createdAt: '2026-01-10' },
  { id: 'u2', name: 'Nimal Perera',  email: 'nimal@ceyntics.com',  role: 'staff',  createdAt: '2026-01-15' },
  { id: 'u3', name: 'Amali Silva',   email: 'amali@ceyntics.com',  role: 'staff',  createdAt: '2026-02-01' },
  { id: 'u4', name: 'Kasun Fernando',email: 'kasun@ceyntics.com',  role: 'staff',  createdAt: '2026-02-10' },
];

// ── Cupboards ─────────────────────────────────────────────────
export const MOCK_CUPBOARDS = [
  { id: 'c1', name: 'Cabinet A',       description: 'Main electronics storage',    createdAt: '2026-01-10' },
  { id: 'c2', name: 'Cabinet B',       description: 'Tools and mechanical parts',  createdAt: '2026-01-12' },
  { id: 'c3', name: 'Server Rack',     description: 'Network & server components', createdAt: '2026-01-20' },
];

// ── Places (sub-locations inside cupboards) ───────────────────
export const MOCK_PLACES = [
  { id: 'p1', cupboardId: 'c1', cupboardName: 'Cabinet A', name: 'Shelf 1 – Top',    description: 'Arduino boards and sensors' },
  { id: 'p2', cupboardId: 'c1', cupboardName: 'Cabinet A', name: 'Shelf 2 – Middle', description: 'Raspberry Pi units' },
  { id: 'p3', cupboardId: 'c2', cupboardName: 'Cabinet B', name: 'Drawer 1',         description: 'Screwdrivers and wrenches' },
  { id: 'p4', cupboardId: 'c2', cupboardName: 'Cabinet B', name: 'Drawer 2',         description: 'Soldering equipment' },
  { id: 'p5', cupboardId: 'c3', cupboardName: 'Server Rack', name: 'Rack Unit 1',    description: 'Routers and switches' },
];

// ── Items ─────────────────────────────────────────────────────
export const MOCK_ITEMS = [
  { id: 'i1',  name: 'Arduino Uno R3',         code: 'EL-001', quantity: 8,  placeId: 'p1', placeName: 'Shelf 1 – Top',    cupboardName: 'Cabinet A', status: 'in_store', description: 'Microcontroller development boards',    serialNumber: null },
  { id: 'i2',  name: 'Raspberry Pi 4 (4GB)',   code: 'EL-002', quantity: 0,  placeId: 'p2', placeName: 'Shelf 2 – Middle', cupboardName: 'Cabinet A', status: 'borrowed', description: 'Single-board computers',               serialNumber: 'RPI-2024-0042' },
  { id: 'i3',  name: 'Soldering Station',      code: 'TL-001', quantity: 2,  placeId: 'p4', placeName: 'Drawer 2',         cupboardName: 'Cabinet B', status: 'in_store', description: 'Temperature-controlled solder station', serialNumber: 'SOL-101' },
  { id: 'i4',  name: 'Digital Multimeter',     code: 'TL-002', quantity: 1,  placeId: 'p3', placeName: 'Drawer 1',         cupboardName: 'Cabinet B', status: 'damaged',  description: 'Fluke 117 multimeter',                 serialNumber: 'FLK-2022-0099' },
  { id: 'i5',  name: 'TP-Link 8-Port Switch',  code: 'NW-001', quantity: 3,  placeId: 'p5', placeName: 'Rack Unit 1',      cupboardName: 'Server Rack', status: 'in_store', description: 'Unmanaged gigabit switch',           serialNumber: null },
  { id: 'i6',  name: 'ESP32 Dev Module',       code: 'EL-003', quantity: 15, placeId: 'p1', placeName: 'Shelf 1 – Top',    cupboardName: 'Cabinet A', status: 'in_store', description: 'Wi-Fi + Bluetooth microcontrollers',   serialNumber: null },
  { id: 'i7',  name: 'Oscilloscope',           code: 'TL-003', quantity: 1,  placeId: 'p4', placeName: 'Drawer 2',         cupboardName: 'Cabinet B', status: 'missing',  description: 'Rigol DS1054Z 4-channel scope',        serialNumber: 'RGL-0054-2021' },
  { id: 'i8',  name: 'USB-C Hub (7-in-1)',     code: 'AC-001', quantity: 4,  placeId: 'p2', placeName: 'Shelf 2 – Middle', cupboardName: 'Cabinet A', status: 'in_store', description: 'USB hub with HDMI and card reader',    serialNumber: null },
];

// ── Borrowings ────────────────────────────────────────────────
export const MOCK_BORROWINGS = [
  { id: 'b1', itemId: 'i2', itemName: 'Raspberry Pi 4 (4GB)', itemCode: 'EL-002',
    borrowerName: 'Tharaka Wijaya',    borrowerContact: '077-1234567',
    borrowDate: '2026-02-20', expectedReturnDate: '2026-03-05', actualReturnDate: null,
    quantityBorrowed: 2, status: 'overdue',  processedBy: 'Nimal Perera' },
  { id: 'b2', itemId: 'i6', itemName: 'ESP32 Dev Module',    itemCode: 'EL-003',
    borrowerName: 'Ruwan Dissanayake', borrowerContact: '071-9876543',
    borrowDate: '2026-03-01', expectedReturnDate: '2026-03-15', actualReturnDate: null,
    quantityBorrowed: 5, status: 'active',   processedBy: 'Amali Silva' },
  { id: 'b3', itemId: 'i3', itemName: 'Soldering Station',   itemCode: 'TL-001',
    borrowerName: 'Dilshan Rathnayake',borrowerContact: '070-5554444',
    borrowDate: '2026-02-10', expectedReturnDate: '2026-02-20', actualReturnDate: '2026-02-19',
    quantityBorrowed: 1, status: 'returned', processedBy: 'Kasun Fernando' },
  { id: 'b4', itemId: 'i5', itemName: 'TP-Link 8-Port Switch',itemCode: 'NW-001',
    borrowerName: 'Chamara Bandara',   borrowerContact: '076-3332222',
    borrowDate: '2026-03-04', expectedReturnDate: '2026-03-20', actualReturnDate: null,
    quantityBorrowed: 1, status: 'active',   processedBy: 'Saman Kumara' },
];

// ── Activity Logs ─────────────────────────────────────────────
export const MOCK_LOGS = [
  { id: 'l1',  user: 'Saman Kumara',   action: 'user_created',      model: 'User',      modelId: 'u2', desc: 'Created user Nimal Perera (staff)',          oldVal: null,            newVal: 'role: staff',          ts: '2026-03-06 09:12:04' },
  { id: 'l2',  user: 'Nimal Perera',   action: 'item_created',      model: 'Item',      modelId: 'i6', desc: 'Created item ESP32 Dev Module (EL-003)',     oldVal: null,            newVal: 'qty: 15, status: in_store', ts: '2026-03-06 10:05:31' },
  { id: 'l3',  user: 'Amali Silva',    action: 'borrowed',          model: 'Borrowing', modelId: 'b2', desc: 'Ruwan Dissanayake borrowed 5x ESP32',         oldVal: 'qty: 15',       newVal: 'qty: 10',              ts: '2026-03-07 11:22:18' },
  { id: 'l4',  user: 'Kasun Fernando', action: 'returned',          model: 'Borrowing', modelId: 'b3', desc: 'Dilshan returned 1x Soldering Station',       oldVal: 'qty: 1',        newVal: 'qty: 2',               ts: '2026-03-07 14:10:55' },
  { id: 'l5',  user: 'Nimal Perera',   action: 'status_changed',    model: 'Item',      modelId: 'i4', desc: 'Digital Multimeter marked as damaged',        oldVal: 'in_store',      newVal: 'damaged',              ts: '2026-03-07 15:33:42' },
  { id: 'l6',  user: 'Saman Kumara',   action: 'quantity_changed',  model: 'Item',      modelId: 'i1', desc: 'Arduino Uno R3 quantity updated',             oldVal: 'qty: 10',       newVal: 'qty: 8',               ts: '2026-03-08 08:55:11' },
  { id: 'l7',  user: 'Nimal Perera',   action: 'item_updated',      model: 'Item',      modelId: 'i5', desc: 'Updated description for TP-Link Switch',     oldVal: 'old description', newVal: 'Unmanaged gigabit switch', ts: '2026-03-08 09:18:27' },
  { id: 'l8',  user: 'Amali Silva',    action: 'status_changed',    model: 'Item',      modelId: 'i7', desc: 'Oscilloscope marked as missing',             oldVal: 'in_store',      newVal: 'missing',              ts: '2026-03-08 10:44:09' },
];

// ── Dashboard summary stats ───────────────────────────────────
export const getDashboardStats = () => ({
  totalItems:     MOCK_ITEMS.length,
  inStore:        MOCK_ITEMS.filter(i => i.status === 'in_store').length,
  borrowed:       MOCK_ITEMS.filter(i => i.status === 'borrowed').length,
  damaged:        MOCK_ITEMS.filter(i => i.status === 'damaged').length,
  missing:        MOCK_ITEMS.filter(i => i.status === 'missing').length,
  activeBorrows:  MOCK_BORROWINGS.filter(b => b.status === 'active' || b.status === 'overdue').length,
  overdue:        MOCK_BORROWINGS.filter(b => b.status === 'overdue').length,
  totalUsers:     MOCK_USERS.length,
});

// ── Chart data for dashboard ──────────────────────────────────
export const CHART_DATA = [
  { month: 'Oct', borrowed: 3, returned: 2 },
  { month: 'Nov', borrowed: 5, returned: 4 },
  { month: 'Dec', borrowed: 2, returned: 2 },
  { month: 'Jan', borrowed: 8, returned: 6 },
  { month: 'Feb', borrowed: 6, returned: 5 },
  { month: 'Mar', borrowed: 4, returned: 1 },
];

// ── Status display helpers ────────────────────────────────────
// Maps DB status values → display labels and badge classes
export const STATUS_CONFIG = {
  in_store: { label: 'In Store',  badge: 'badge-green',  dot: '#10b981' },
  borrowed: { label: 'Borrowed',  badge: 'badge-blue',   dot: '#3b82f6' },
  damaged:  { label: 'Damaged',   badge: 'badge-red',    dot: '#ef4444' },
  missing:  { label: 'Missing',   badge: 'badge-orange', dot: '#f97316' },
};

export const BORROW_STATUS_CONFIG = {
  active:   { label: 'Active',   badge: 'badge-blue' },
  returned: { label: 'Returned', badge: 'badge-green' },
  overdue:  { label: 'Overdue',  badge: 'badge-red' },
};
