// src/components/ViewBookings.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ViewBookings from './ViewBookings';


// --- Comprehensive Historical Target Dataset ---
const mockStaff = [
  { id: 1, name: 'Angela Crisp' },
  { id: 2, name: 'Judel Cruz' }
];

const mockServices = [
  { id: 10, name: 'Full Grooming' },
  { id: 20, name: 'Bath & Blowdry' }
];

const mockBookings = [
  {
    id: 501,
    customer_name: 'Angela Lopez',
    customer_email: 'angela@example.com',
    pet_name: 'Biscuit',
    appointment_date: '2026-07-12', // Future Booking (Editable)
    appointment_time: '10:00:00',
    status: 'Confirmed',
    booking_type: 'Scheduled',
    service_id: 10,
    staff_id: 1
  },
  {
    id: 502,
    customer_name: 'Judel Soriano',
    customer_email: 'judel@example.com',
    pet_name: 'Choco',
    appointment_date: '2026-05-10', // Historical Booking (Locked out from changes)
    appointment_time: '15:30:00',
    status: 'Completed',
    booking_type: 'Walk-in',
    service_id: 20,
    staff_id: 2
  }
];

// --- Chain-Capable Supabase Execution Layer Mocks ---
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null }))
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const chainObj = {};
      Object.assign(chainObj, {
        select: vi.fn(() => {
          if (table === 'staff') return Promise.resolve({ data: mockStaff, error: null });
          if (table === 'services') return Promise.resolve({ data: mockServices, error: null });
          return chainObj; // Bookings flows use further sorting chains
        }),
        order: vi.fn(() => Promise.resolve({ data: mockBookings, error: null })),
        update: mockUpdate,
        eq: vi.fn(() => chainObj)
      });
      return chainObj;
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}));

describe('ViewBookings Historical Matrix Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Test Case 1: Initial Roster Render Ledger Matrix ---
  it('unmounts loaders and lists present and historical data metrics cleanly', async () => {
    render(<ViewBookings />);

    // Verify header profile description resolves cleanly
    expect(await screen.findByText('Booking History')).toBeInTheDocument();

    // Verify row data outputs render correctly in table slots
    expect(screen.getByText('Angela Lopez')).toBeInTheDocument();
    expect(screen.getByText('(Biscuit)')).toBeInTheDocument();
    expect(screen.getByText('Judel Soriano')).toBeInTheDocument();
    expect(screen.getByText('(Choco)')).toBeInTheDocument();
  });

  // --- Test Case 2: Interactive Complex Filters & Core Reset Actions ---
  it('correctly filters down active table data arrays and handles filter reset signals', async () => {
    render(<ViewBookings />);
    expect(await screen.findByText('Angela Lopez')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Client or pet name...');
    
    // Filter rows by pet string "Biscuit"
    fireEvent.change(searchInput, { target: { value: 'Biscuit' } });
    expect(screen.getByText('Angela Lopez')).toBeInTheDocument();
    expect(screen.queryByText('Judel Soriano')).not.toBeInTheDocument();

    // Trigger clear reset macro command execution button
    const resetButton = screen.getByRole('button', { name: /Reset Filters/i });
    fireEvent.click(resetButton);

    // Verify full data arrays are populated back into view
    expect(screen.getByText('Angela Lopez')).toBeInTheDocument();
    expect(screen.getByText('Judel Soriano')).toBeInTheDocument();
  });

  // --- Test Case 3: Advanced Past Date Inline Dropdown Intercept / Edit Locks ---
  it('locks inline parameters as text blocks and prevents dropdown actions on old entries', async () => {
    render(<ViewBookings />);
    expect(await screen.findByText('Angela Lopez')).toBeInTheDocument();

    // Future booking (Editable) -> Rendered as interactive dropdown button components
    const editableStaffButtons = screen.getAllByRole('button', { name: 'Angela Crisp' });
    expect(editableStaffButtons[0]).toBeInTheDocument();

    // Historical booking (Completed/Past Date) -> Rendered as static spans with locked out properties
    // Testing library check: it should throw an error since no interactive trigger button role matches the string
    const lockedStaffButton = screen.queryByRole('button', { name: 'Judel Cruz' });
    expect(lockedStaffButton).not.toBeInTheDocument();

    // The text asset still prints safely as text representation elements inside columns
    expect(screen.getByText('Judel Cruz')).toBeInTheDocument();
  });

  // --- Test Case 4: Sort Direction Order Updates ---
  it('re-orders item indexes inside data rows list grid when clicking Date heading elements', async () => {
    render(<ViewBookings />);
    expect(await screen.findByText('Angela Lopez')).toBeInTheDocument();

    const dateSortHeader = screen.getByText('Date Parameters');
    
    // Initial load matches default sort order ('desc')
    let textCells = screen.getAllByRole('cell');
    // First tracking item row parameter matches row 1 date metadata index rules
    expect(textCells[1].textContent?.trim()).toBe('2026-07-12');

    // Click sorting button element text matrix wrapper to change layout constraints ('asc')
    fireEvent.click(dateSortHeader);

    textCells = screen.getAllByRole('cell');
    // Row indexes update positional boundaries cleanly matching alternative ordering rule vector
    expect(textCells[1].textContent?.trim()).toBe('2026-05-10');
  });
});