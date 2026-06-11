import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface StockMovement {
  id: string;
  date: string;
  type: 'IN' | 'OUT';
  quantity: number;
  updatedBy: string;
  notes: string;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  stockLevel: number;
  unit: string;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdatedBy: string;
  lastUpdatedDate: string;
  stockMovements: StockMovement[];
}

interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
}

// Fixed base date for dummy data (April 1, 2026)
const BASE_DATE = new Date('2026-04-01T08:00:00Z');

// Helper function to create fixed dates relative to base date
const createDate = (daysAgo: number, hoursAgo: number = 0) => {
  const date = new Date(BASE_DATE);
  date.setDate(date.getDate() - daysAgo);
  date.setHours(date.getHours() - hoursAgo);
  return date.toISOString();
};

const initialState: InventoryState = {
  items: [
    {
      id: '1',
      itemCode: 'MED-001',
      itemName: 'Paracetamol 500mg',
      category: 'Medicine',
      stockLevel: 850,
      unit: 'tablets',
      reorderLevel: 200,
      status: 'In Stock',
      lastUpdatedBy: 'Cindy Lopez',
      lastUpdatedDate: createDate(0, 2),
      stockMovements: [
        {
          id: 'mov-1',
          date: createDate(0, 2),
          type: 'OUT',
          quantity: 50,
          updatedBy: 'Cindy Lopez',
          notes: 'Dispensed to patient',
        },
        {
          id: 'mov-2',
          date: createDate(2),
          type: 'IN',
          quantity: 200,
          updatedBy: 'Maria Santos',
          notes: 'New stock delivery',
        },
        {
          id: 'mov-3',
          date: createDate(5),
          type: 'OUT',
          quantity: 100,
          updatedBy: 'John Reyes',
          notes: 'Emergency dispensing',
        },
        {
          id: 'mov-4',
          date: createDate(10),
          type: 'IN',
          quantity: 500,
          updatedBy: 'Cindy Lopez',
          notes: 'Monthly stock replenishment',
        },
        {
          id: 'mov-5',
          date: createDate(15),
          type: 'OUT',
          quantity: 150,
          updatedBy: 'Ana Cruz',
          notes: 'Outpatient dispensing',
        },
        {
          id: 'mov-6',
          date: createDate(35),
          type: 'IN',
          quantity: 300,
          updatedBy: 'Maria Santos',
          notes: 'Quarterly procurement',
        },
        {
          id: 'mov-7',
          date: createDate(60),
          type: 'OUT',
          quantity: 75,
          updatedBy: 'John Reyes',
          notes: 'Regular distribution',
        },
      ],
    },
    {
      id: '2',
      itemCode: 'MED-002',
      itemName: 'Amoxicillin 500mg',
      category: 'Medicine',
      stockLevel: 45,
      unit: 'capsules',
      reorderLevel: 100,
      status: 'Low Stock',
      lastUpdatedBy: 'Maria Santos',
      lastUpdatedDate: createDate(1),
      stockMovements: [
        {
          id: 'mov-8',
          date: createDate(1),
          type: 'OUT',
          quantity: 80,
          updatedBy: 'Maria Santos',
          notes: 'Prescription dispensing',
        },
        {
          id: 'mov-9',
          date: createDate(3),
          type: 'OUT',
          quantity: 25,
          updatedBy: 'Cindy Lopez',
          notes: 'Patient medication',
        },
        {
          id: 'mov-10',
          date: createDate(8),
          type: 'IN',
          quantity: 100,
          updatedBy: 'John Reyes',
          notes: 'Weekly delivery',
        },
        {
          id: 'mov-11',
          date: createDate(20),
          type: 'OUT',
          quantity: 50,
          updatedBy: 'Ana Cruz',
          notes: 'Ward distribution',
        },
      ],
    },
    {
      id: '3',
      itemCode: 'SUP-001',
      itemName: 'Surgical Gloves (Medium)',
      category: 'Medical Supplies',
      stockLevel: 0,
      unit: 'boxes',
      reorderLevel: 20,
      status: 'Out of Stock',
      lastUpdatedBy: 'John Reyes',
      lastUpdatedDate: createDate(0, 5),
      stockMovements: [
        {
          id: 'mov-12',
          date: createDate(0, 5),
          type: 'OUT',
          quantity: 15,
          updatedBy: 'John Reyes',
          notes: 'Emergency room usage',
        },
        {
          id: 'mov-13',
          date: createDate(4),
          type: 'OUT',
          quantity: 10,
          updatedBy: 'Maria Santos',
          notes: 'Surgery department',
        },
        {
          id: 'mov-14',
          date: createDate(12),
          type: 'IN',
          quantity: 25,
          updatedBy: 'Cindy Lopez',
          notes: 'Stock replenishment',
        },
      ],
    },
    {
      id: '4',
      itemCode: 'LAB-001',
      itemName: 'Blood Collection Tubes',
      category: 'Laboratory',
      stockLevel: 320,
      unit: 'pieces',
      reorderLevel: 100,
      status: 'In Stock',
      lastUpdatedBy: 'Ana Cruz',
      lastUpdatedDate: createDate(0, 8),
      stockMovements: [
        {
          id: 'mov-15',
          date: createDate(0, 8),
          type: 'OUT',
          quantity: 30,
          updatedBy: 'Ana Cruz',
          notes: 'Laboratory testing',
        },
        {
          id: 'mov-16',
          date: createDate(1),
          type: 'OUT',
          quantity: 25,
          updatedBy: 'Maria Santos',
          notes: 'Daily lab operations',
        },
        {
          id: 'mov-17',
          date: createDate(6),
          type: 'IN',
          quantity: 200,
          updatedBy: 'John Reyes',
          notes: 'Weekly supply delivery',
        },
        {
          id: 'mov-18',
          date: createDate(14),
          type: 'OUT',
          quantity: 45,
          updatedBy: 'Cindy Lopez',
          notes: 'Blood drive event',
        },
        {
          id: 'mov-19',
          date: createDate(25),
          type: 'IN',
          quantity: 150,
          updatedBy: 'Ana Cruz',
          notes: 'Monthly procurement',
        },
        {
          id: 'mov-20',
          date: createDate(40),
          type: 'OUT',
          quantity: 35,
          updatedBy: 'Maria Santos',
          notes: 'Routine testing',
        },
      ],
    },
    {
      id: '5',
      itemCode: 'PPE-001',
      itemName: 'N95 Face Masks',
      category: 'Personal Protective Equipment',
      stockLevel: 180,
      unit: 'pieces',
      reorderLevel: 150,
      status: 'In Stock',
      lastUpdatedBy: 'Cindy Lopez',
      lastUpdatedDate: createDate(0, 1),
      stockMovements: [
        {
          id: 'mov-21',
          date: createDate(0, 1),
          type: 'IN',
          quantity: 100,
          updatedBy: 'Cindy Lopez',
          notes: 'Emergency procurement',
        },
        {
          id: 'mov-22',
          date: createDate(3),
          type: 'OUT',
          quantity: 20,
          updatedBy: 'John Reyes',
          notes: 'Staff distribution',
        },
        {
          id: 'mov-23',
          date: createDate(9),
          type: 'IN',
          quantity: 50,
          updatedBy: 'Maria Santos',
          notes: 'PPE restocking',
        },
        {
          id: 'mov-24',
          date: createDate(18),
          type: 'OUT',
          quantity: 30,
          updatedBy: 'Ana Cruz',
          notes: 'ICU allocation',
        },
        {
          id: 'mov-25',
          date: createDate(45),
          type: 'IN',
          quantity: 80,
          updatedBy: 'Cindy Lopez',
          notes: 'Bulk order delivery',
        },
      ],
    },
    {
      id: '6',
      itemCode: 'MED-003',
      itemName: 'Ibuprofen 400mg',
      category: 'Medicine',
      stockLevel: 520,
      unit: 'tablets',
      reorderLevel: 150,
      status: 'In Stock',
      lastUpdatedBy: 'Maria Santos',
      lastUpdatedDate: createDate(7),
      stockMovements: [
        {
          id: 'mov-26',
          date: createDate(7),
          type: 'IN',
          quantity: 300,
          updatedBy: 'Maria Santos',
          notes: 'Weekly stock delivery',
        },
        {
          id: 'mov-27',
          date: createDate(16),
          type: 'OUT',
          quantity: 80,
          updatedBy: 'John Reyes',
          notes: 'Patient dispensing',
        },
        {
          id: 'mov-28',
          date: createDate(30),
          type: 'IN',
          quantity: 200,
          updatedBy: 'Ana Cruz',
          notes: 'Monthly replenishment',
        },
        {
          id: 'mov-29',
          date: createDate(50),
          type: 'OUT',
          quantity: 100,
          updatedBy: 'Cindy Lopez',
          notes: 'Pharmacy distribution',
        },
      ],
    },
    {
      id: '7',
      itemCode: 'SUP-002',
      itemName: 'Sterile Gauze Pads',
      category: 'Medical Supplies',
      stockLevel: 75,
      unit: 'packs',
      reorderLevel: 80,
      status: 'Low Stock',
      lastUpdatedBy: 'John Reyes',
      lastUpdatedDate: createDate(2),
      stockMovements: [
        {
          id: 'mov-30',
          date: createDate(2),
          type: 'OUT',
          quantity: 25,
          updatedBy: 'John Reyes',
          notes: 'Wound care unit',
        },
        {
          id: 'mov-31',
          date: createDate(11),
          type: 'IN',
          quantity: 50,
          updatedBy: 'Maria Santos',
          notes: 'Supply order',
        },
        {
          id: 'mov-32',
          date: createDate(22),
          type: 'OUT',
          quantity: 30,
          updatedBy: 'Ana Cruz',
          notes: 'Emergency department',
        },
        {
          id: 'mov-33',
          date: createDate(55),
          type: 'IN',
          quantity: 80,
          updatedBy: 'Cindy Lopez',
          notes: 'Quarterly procurement',
        },
      ],
    },
    {
      id: '8',
      itemCode: 'EQP-001',
      itemName: 'Digital Thermometer',
      category: 'Equipment',
      stockLevel: 28,
      unit: 'units',
      reorderLevel: 10,
      status: 'In Stock',
      lastUpdatedBy: 'Ana Cruz',
      lastUpdatedDate: createDate(13),
      stockMovements: [
        {
          id: 'mov-34',
          date: createDate(13),
          type: 'IN',
          quantity: 10,
          updatedBy: 'Ana Cruz',
          notes: 'Equipment purchase',
        },
        {
          id: 'mov-35',
          date: createDate(28),
          type: 'OUT',
          quantity: 2,
          updatedBy: 'John Reyes',
          notes: 'Ward allocation',
        },
        {
          id: 'mov-36',
          date: createDate(65),
          type: 'IN',
          quantity: 20,
          updatedBy: 'Cindy Lopez',
          notes: 'Initial stock purchase',
        },
      ],
    },
  ],
  isLoading: false,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addInventoryItem: (state, action: PayloadAction<InventoryItem>) => {
      state.items.push(action.payload);
    },
    updateStockLevel: (
      state,
      action: PayloadAction<{
        itemId: string;
        movement: StockMovement;
      }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (item) {
        const { type, quantity, updatedBy, date } = action.payload.movement;

        // Update stock level
        if (type === 'IN') {
          item.stockLevel += quantity;
        } else {
          item.stockLevel -= quantity;
        }

        // Update status based on reorder level
        if (item.stockLevel === 0) {
          item.status = 'Out of Stock';
        } else if (item.stockLevel <= item.reorderLevel) {
          item.status = 'Low Stock';
        } else {
          item.status = 'In Stock';
        }

        // Update last modified info
        item.lastUpdatedBy = updatedBy;
        item.lastUpdatedDate = date;

        // Add movement to history
        item.stockMovements.unshift(action.payload.movement);
      }
    },
    updateInventoryItem: (state, action: PayloadAction<InventoryItem>) => {
      const index = state.items.findIndex((i) => i.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
  },
});

export const { addInventoryItem, updateStockLevel, updateInventoryItem } = inventorySlice.actions;
export default inventorySlice.reducer;
