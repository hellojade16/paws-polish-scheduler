// src/components/BookingForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookingForm from './BookingForm';

// --- Global Context State Toggles for Dynamic Mock Adjustments ---
let shouldConflictOnSubmit = false;
let mockInsertFail = false;
let currentFilters: Record<string, any> = {};

// --- Mock EmailJS Pipeline to Prevent Extraneous Network Overhead ---
vi.mock('@emailjs/browser', () => ({
  default: {
    send: vi.fn(() => Promise.resolve({ text: 'OK', status: 200 }))
  }
}));

// --- Advanced Chain-Capable Supabase Mock Pipeline Engine ---
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      const chainObj = {};
      Object.assign(chainObj, {
        select: vi.fn(() => chainObj),
        insert: vi.fn(() => Promise.resolve({ error: mockInsertFail ? { message: 'Insert Error' } : null })),
        eq: vi.fn((column: string, value: any) => {
          currentFilters[column] = value;
          return chainObj;
        }),
        neq: vi.fn(() => chainObj),
        single: vi.fn(() => {
          if (table === 'staff') return Promise.resolve({ data: { is_active: true }, error: null });
          if (table === 'services') return Promise.resolve({ data: { id: 1 }, error: null });
          return Promise.resolve({ data: null, error: null });
        }),
        then: (resolve: any) => {
          let data: any = [];
          if (table === 'bookings') {
            // If the component is verifying a specific slot constraint during checkout submission
            if (currentFilters.appointment_time) {
              if (shouldConflictOnSubmit) {
                data = [{ id: 999 }];
              } else {
                data = []; // Clear path for successful checkouts
              }
            } else {
              // Standard daily timeline view initial load parameter configuration
              data = [
                {
                  appointment_time: '10:00:00',
                  duration_minutes: 60,
                  staff_id: 1,
                  status: 'Confirmed'
                }
              ];
            }
          }
          currentFilters = {}; // Reset filter context parameters for next run loop
          return Promise.resolve({ data, error: null }).then(resolve);
        }
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

describe('BookingForm Logic & Workflow Automation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    shouldConflictOnSubmit = false;
    mockInsertFail = false;
    currentFilters = {};
  });

  // --- Test Case 1: Time Slot Calculation & Buffer Exclusion ---
  it('correctly renders available slots while excluding active timeline conflict blocks', async () => {
    render(<BookingForm selectedServiceId={1} selectedStaffId={1} />);

    const dateInput = screen.getByText('1. Pick a Date').nextElementSibling as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-08-15' } });

    // 11:30 AM should render cleanly as the first open slot after the conflict clearance
    expect(await screen.findByText('11:30 AM')).toBeInTheDocument();
    
    // 10:00 AM and 10:30 AM must be completely omitted due to duration overlap rules
    expect(screen.queryByText('10:00 AM')).not.toBeInTheDocument();
    expect(screen.queryByText('10:30 AM')).not.toBeInTheDocument();
  });

  // --- Test Case 2: Mid-Air Collision Detection (Slot Just Taken) ---
  it('blocks checkouts and raises error toast if slot is claimed right before submission', async () => {
    render(<BookingForm selectedServiceId={1} selectedStaffId={1} />);

    const dateInput = screen.getByText('1. Pick a Date').nextElementSibling as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    
    fireEvent.change(screen.getByPlaceholderText('e.g. Juan Dela Cruz'), { target: { value: 'Jade Soriano' } });
    fireEvent.change(screen.getByPlaceholderText('juan@example.com'), { target: { value: 'jade@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Bantay 🐶'), { target: { value: 'Bantay' } });

    // Select an available open timeline block button
    const slotButton = await screen.findByText('11:30 AM');
    fireEvent.click(slotButton);

    // Force subsequent data validation runs to intercept with a database conflict
    shouldConflictOnSubmit = true;

    const checkoutButton = screen.getByRole('button', { name: /Confirm Appointment/i });
    fireEvent.click(checkoutButton);

    const collisionToast = await screen.findByText(
      'This specific time block was just reserved by another client or walk-in. Please pick an alternate time slot.'
    );
    expect(collisionToast).toBeInTheDocument();
  });

  // --- Test Case 3: Successful Submission View Transformation ---
  it('renders confirmation panel layout screen when client parameters pass validations cleanly', async () => {
    render(<BookingForm selectedServiceId={1} selectedStaffId={1} />);

    const dateInput = screen.getByText('1. Pick a Date').nextElementSibling as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '2026-08-15' } });
    
    fireEvent.change(screen.getByPlaceholderText('e.g. Juan Dela Cruz'), { target: { value: 'Princess Jade' } });
    fireEvent.change(screen.getByPlaceholderText('juan@example.com'), { target: { value: 'princess@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Bantay 🐶'), { target: { value: 'Sam' } });

    const slotButton = await screen.findByText('02:00 PM');
    fireEvent.click(slotButton);

    const checkoutButton = screen.getByRole('button', { name: /Confirm Appointment/i });
    fireEvent.click(checkoutButton);

    expect(await screen.findByText('Booking Confirmed!')).toBeInTheDocument();
  });
});