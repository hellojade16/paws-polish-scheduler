// src/components/AdminDashboard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';

// --- Establish Today's Date String Context ---
const todayStr = new Date().toISOString().split('T')[0];

// --- Mock Dataset for Testing Assertions ---
const mockStaff = [
  { id: 101, name: 'Angela Crisp' },
  { id: 102, name: 'Judel Cruz' }
];

const mockServices = [
  { id: 10, name: 'Full Grooming' },
  { id: 20, name: 'Bath & Blowdry' }
];

const mockBookings = [
  {
    id: 1,
    customer_name: 'Jade Domingo',
    customer_email: 'jade@example.com',
    pet_name: 'Bantay',
    appointment_date: todayStr,
    appointment_time: '09:00',
    status: 'Confirmed',
    booking_type: 'Scheduled',
    staff_id: 101,
    services: { name: 'Full Grooming' }
  },
  {
    id: 2,
    customer_name: 'Clarise Diaz',
    customer_email: 'clarise@example.com',
    pet_name: 'Sam',
    appointment_date: todayStr,
    appointment_time: '14:30',
    status: 'Completed',
    booking_type: 'Walk-in',
    staff_id: 102,
    services: { name: 'Bath & Blowdry' }
  }
];

// --- Global Supabase Database Pipeline Spies ---
const mockInsert = vi.fn(() => ({
  select: vi.fn(() => Promise.resolve({ data: [mockBookings[0]], error: null }))
}));

const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null }))
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      return {
        select: vi.fn(() => {
          let data: any = [];
          if (table === 'staff') data = mockStaff;
          if (table === 'services') data = mockServices;
          if (table === 'bookings') data = mockBookings;

          // Creates a chainable promise object that safely supports both raw awaits and trailing filters (.eq, .gte)
          const promise = Promise.resolve({ data, error: null });
          (promise as any).eq = vi.fn(() => promise);
          (promise as any).gte = vi.fn(() => promise);
          return promise;
        }),
        insert: mockInsert,
        update: mockUpdate
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}));

describe('AdminDashboard Automated Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Test Case 1: Dynamic Counter Aggregation ---
  it('correctly calculates metrics cards based on booking status categories', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText("Today's active operations and real-time scheduling metrics.")).toBeInTheDocument();

    expect(screen.getByText('Total Active Bookings')).toBeInTheDocument();
    expect(screen.getAllByText('2')[0]).toBeInTheDocument();

    expect(screen.getByText('Completed Sessions')).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();

    expect(screen.getByText('Pending / Confirmed')).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();
  });

  // --- Test Case 2: Real-Time Table Text Search ---
  it('filters rows instantly when typing match query parameters into the search input', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText("Jade Domingo")).toBeInTheDocument();
    
    const searchBar = screen.getByPlaceholderText('Search client or pet...');
    fireEvent.change(searchBar, { target: { value: 'Bantay' } });

    expect(screen.getByText('Jade Domingo')).toBeInTheDocument();
    expect(screen.queryByText('Clarise Diaz')).not.toBeInTheDocument();
  });

  // --- Test Case 3: Walk-In Form Fields Empty String Block validation ---
  it('prevents blank walk-in check-ins and displays custom error alert toast', async () => {
    render(<AdminDashboard />);
    expect(await screen.findByText("Today's active operations and real-time scheduling metrics.")).toBeInTheDocument();

    fireEvent.click(screen.getByText('Add Walk-In'));
    expect(screen.getByText('Register Walk-In Customer')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Owner's name"), { target: { value: '    ' } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Sam (Shih Tzu)"), { target: { value: '    ' } });

    fireEvent.click(screen.getByText('Check In Pet'));

    const validationToast = await screen.findByText(
      'Please populate the Customer Name, Pet Profile, Service Suite, and Stylist selections.'
    );
    expect(validationToast).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });

 // --- Test Case 4: Destructive Action Modal Overlay ---
it('surfaces premium confirmation modal drawer overlay when hitting Cancel action', async () => {
  render(<AdminDashboard />);
  expect(await screen.findByText("Jade Domingo")).toBeInTheDocument();

  // Click the cancel button on the row template layout
  const cancelButtons = screen.getAllByText('Cancel');
  fireEvent.click(cancelButtons[0]);

  // Verify the modal wrapper header popped up cleanly
  expect(screen.getByText('Cancel Appointment?')).toBeInTheDocument();
  
  // CORRECTED ASSERTION: Jade Domingo is now in the table AND the modal. 
  // We assert that both instances are loaded into the browser workspace context.
  expect(screen.getAllByText('Jade Domingo')).toHaveLength(2);

  // Execute the destructive confirmation script action
  fireEvent.click(screen.getByText('Yes, Cancel'));

  // Assert that update payload hits Supabase correctly
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'Cancelled' });
  });
});
});