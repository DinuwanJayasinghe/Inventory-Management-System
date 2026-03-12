// ─── Mock Data Store ─────────────────────────────────────────
// In production, replace these with real axios/fetch calls
// to the Laravel API endpoints.
// ─────────────────────────────────────────────────────────────

export const mockUser = {
  id: 'u-001',
  name: 'Kavindu Perera',
  email: 'admin@ceyntics.com',
  role: 'admin',
  avatar: 'KP',
};

// ── Cupboards (top-level storage) ──
export const mockCupboards = [
  { id: 'cb-001', name: 'Cabinet Alpha', description: 'Main electronics storage', places: 3, created_at: '2026-01-10' },
  { id: 'cb-002', name: 'Cabinet Beta',  description: 'Tools and hardware',        places: 2, created_at: '2026-01-15' },
  { id: 'cb-003', name: 'Cabinet Gamma', description: 'Mechanical components',     places: 4, created_at: '2026-02-01' },
];

// ── Places (locations inside cupboards) ──
export const mockPlaces = [
  { id: 'pl-001', cupboard_id: 'cb-001', cupboard_name: 'Cabinet Alpha', name: 'Shelf A1 — Top',    description: 'Top shelf row A' },
  { id: 'pl-002', cupboard_id: 'cb-001', cupboard_name: 'Cabinet Alpha', name: 'Shelf A2 — Mid',    description: 'Mid shelf row A' },
  { id: 'pl-003', cupboard_id: 'cb-001', cupboard_name: 'Cabinet Alpha', name: 'Drawer A — Bottom', description: 'Bottom drawer' },
  { id: 'pl-004', cupboard_id: 'cb-002', cupboard_name: 'Cabinet Beta',  name: 'Shelf B1',          description: 'Top shelf' },
  { id: 'pl-005', cupboard_id: 'cb-002', cupboard_name: 'Cabinet Beta',  name: 'Shelf B2',          description: 'Lower shelf' },
  { id: 'pl-006', cupboard_id: 'cb-003', cupboard_name: 'Cabinet Gamma', name: 'Tray G1',           description: 'Component tray 1' },
];

// ── Inventory Items ──
export const mockItems = [
  { id: 'it-001', name: 'Arduino Uno R3',       code: 'EL-001', quantity: 8,  serial_number: 'ARD-2024-001', place_id: 'pl-001', place_name: 'Shelf A1 — Top',    status: 'in_store', description: 'Microcontroller boards for prototyping', created_at: '2026-01-12' },
  { id: 'it-002', name: 'Raspberry Pi 4B',      code: 'EL-002', quantity: 0,  serial_number: 'RPI-2024-002', place_id: 'pl-002', place_name: 'Shelf A2 — Mid',    status: 'borrowed', description: '4GB RAM single-board computers',          created_at: '2026-01-14' },
  { id: 'it-003', name: 'Soldering Iron Kit',   code: 'TL-001', quantity: 3,  serial_number: null,           place_id: 'pl-004', place_name: 'Shelf B1',          status: 'in_store', description: '60W temperature-controlled soldering kit', created_at: '2026-01-20' },
  { id: 'it-004', name: 'Oscilloscope DSO138',  code: 'EL-003', quantity: 1,  serial_number: 'DSO-2023-007', place_id: 'pl-001', place_name: 'Shelf A1 — Top',    status: 'damaged',  description: 'Digital storage oscilloscope kit',         created_at: '2026-01-25' },
  { id: 'it-005', name: 'Jumper Wire Set',       code: 'EL-004', quantity: 15, serial_number: null,           place_id: 'pl-003', place_name: 'Drawer A — Bottom', status: 'in_store', description: 'M-M, M-F, F-F jumper wires pack',          created_at: '2026-02-01' },
  { id: 'it-006', name: 'Multimeter UT61E',     code: 'TL-002', quantity: 0,  serial_number: 'MM-2024-003',  place_id: 'pl-005', place_name: 'Shelf B2',          status: 'missing',  description: 'True RMS digital multimeter',              created_at: '2026-02-05' },
  { id: 'it-007', name: 'ESP32 Dev Board',      code: 'EL-005', quantity: 12, serial_number: null,           place_id: 'pl-006', place_name: 'Tray G1',           status: 'in_store', description: 'WiFi+BT microcontroller modules',          created_at: '2026-02-10' },
  { id: 'it-008', name: 'Power Supply 30V/5A',  code: 'TL-003', quantity: 2,  serial_number: 'PS-2024-001',  place_id: 'pl-004', place_name: 'Shelf B1',          status: 'in_store', description: 'Bench power supply adjustable DC',         created_at: '2026-02-15' },
];

// ── Borrowings ──
export const mockBorrowings = [
  { id: 'bw-001', item_id: 'it-002', item_name: 'Raspberry Pi 4B', item_code: 'EL-002', borrower_name: 'Saman Kumara',   borrower_contact: '0771234567', borrow_date: '2026-02-20', expected_return_date: '2026-03-05', actual_return_date: null,         quantity_borrowed: 2, status: 'overdue',  processed_by: 'Kavindu Perera' },
  { id: 'bw-002', item_id: 'it-003', item_name: 'Soldering Iron',  item_code: 'TL-001', borrower_name: 'Nimal Silva',    borrower_contact: '0779876543', borrow_date: '2026-03-01', expected_return_date: '2026-03-10', actual_return_date: null,         quantity_borrowed: 1, status: 'active',   processed_by: 'Kavindu Perera' },
  { id: 'bw-003', item_id: 'it-001', item_name: 'Arduino Uno R3',  item_code: 'EL-001', borrower_name: 'Amara Perera',   borrower_contact: '0712345678', borrow_date: '2026-02-10', expected_return_date: '2026-02-25', actual_return_date: '2026-02-24', quantity_borrowed: 2, status: 'returned', processed_by: 'Kavindu Perera' },
  { id: 'bw-004', item_id: 'it-007', item_name: 'ESP32 Dev Board', item_code: 'EL-005', borrower_name: 'Kasun Bandara',  borrower_contact: '0701122334', borrow_date: '2026-03-05', expected_return_date: '2026-03-15', actual_return_date: null,         quantity_borrowed: 3, status: 'active',   processed_by: 'Kavindu Perera' },
];

// ── Activity Logs ──
export const mockLogs = [
  { id: 'lg-001', user_name: 'Kavindu Perera', action: 'item_created',    model_type: 'Item',     model_id: 'it-007', old_values: null,                              new_values: { name: 'ESP32 Dev Board', quantity: 12 }, created_at: '2026-03-05 09:12:44' },
  { id: 'lg-002', user_name: 'Kavindu Perera', action: 'borrowed',        model_type: 'Borrowing',model_id: 'bw-004', old_values: { quantity: 15 },                  new_values: { quantity: 12 },                          created_at: '2026-03-05 10:30:00' },
  { id: 'lg-003', user_name: 'Kavindu Perera', action: 'quantity_changed', model_type: 'Item',     model_id: 'it-001', old_values: { quantity: 6 },                   new_values: { quantity: 8 },                           created_at: '2026-03-04 14:20:11' },
  { id: 'lg-004', user_name: 'Kavindu Perera', action: 'status_changed',  model_type: 'Item',     model_id: 'it-004', old_values: { status: 'in_store' },             new_values: { status: 'damaged' },                     created_at: '2026-03-03 11:05:33' },
  { id: 'lg-005', user_name: 'Kavindu Perera', action: 'user_created',    model_type: 'User',     model_id: 'u-002',  old_values: null,                              new_values: { name: 'Dilani Fernando', role: 'staff' }, created_at: '2026-03-02 09:00:00' },
  { id: 'lg-006', user_name: 'Kavindu Perera', action: 'returned',        model_type: 'Borrowing',model_id: 'bw-003', old_values: { status: 'active', quantity: 6 }, new_values: { status: 'returned', quantity: 8 },        created_at: '2026-02-24 16:45:00' },
];

// ── Users ──
export const mockUsers = [
  { id: 'u-001', name: 'Kavindu Perera',  email: 'admin@ceyntics.com',  role: 'admin', created_at: '2026-01-01' },
  { id: 'u-002', name: 'Dilani Fernando', email: 'dilani@ceyntics.com', role: 'staff', created_at: '2026-03-02' },
  { id: 'u-003', name: 'Ruwan Jayasinghe',email: 'ruwan@ceyntics.com',  role: 'staff', created_at: '2026-03-02' },
];

// ── Dashboard stats (derived) ──
export const getDashboardStats = () => ({
  totalItems:    mockItems.length,
  inStore:       mockItems.filter(i => i.status === 'in_store').length,
  borrowed:      mockItems.filter(i => i.status === 'borrowed').length,
  damaged:       mockItems.filter(i => i.status === 'damaged').length,
  missing:       mockItems.filter(i => i.status === 'missing').length,
  activeBorrows: mockBorrowings.filter(b => b.status === 'active').length,
  overdue:       mockBorrowings.filter(b => b.status === 'overdue').length,
  totalUsers:    mockUsers.length,
});

// ── Chart data for recharts ──
export const getStatusChartData = () => [
  { name: 'In Store',  value: mockItems.filter(i => i.status === 'in_store').length, color: '#2dd4a0' },
  { name: 'Borrowed',  value: mockItems.filter(i => i.status === 'borrowed').length, color: '#f59e0b' },
  { name: 'Damaged',   value: mockItems.filter(i => i.status === 'damaged').length,  color: '#f43f5e' },
  { name: 'Missing',   value: mockItems.filter(i => i.status === 'missing').length,  color: '#60a5fa' },
];

// ── Action label map for logs ──
export const actionLabels = {
  item_created:    { label: 'Item Created',     color: '#2dd4a0' },
  item_updated:    { label: 'Item Updated',     color: '#c9a84c' },
  quantity_changed:{ label: 'Qty Changed',      color: '#60a5fa' },
  status_changed:  { label: 'Status Changed',   color: '#f59e0b' },
  borrowed:        { label: 'Borrowed',          color: '#f59e0b' },
  returned:        { label: 'Returned',          color: '#2dd4a0' },
  user_created:    { label: 'User Created',      color: '#c9a84c' },
};
