// src/components/ManageStaff.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ManageStaff from './ManageStaff';

// --- Global Mock setup for Supabase Data Pipelines ---
const mockStaffList = [
  { id: 1, name: 'Angela Crisp', role: 'Senior Stylist', is_active: true },
  { id: 2, name: 'Judel Cruz', role: 'Junior Groomer', is_active: false }
];

// Reusable mock spy triggers
const mockSelect = vi.fn(() => ({
  order: vi.fn(() => Promise.resolve({ data: mockStaffList, error: null }))
}));
const mockInsert = vi.fn(() => Promise.resolve({ data: null, error: null }));
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => Promise.resolve({ error: null }))
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === 'staff') {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
        };
      }
      return {};
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn()
  }
}));

describe('ManageStaff Component Testing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Test Case 1: Form Validation ---
  it('blocks registration form submissions consisting only of blank spaces', async () => {
    render(<ManageStaff />);

    // Wait for loader skeleton to close and data rows to render
    expect(await screen.findByText('Angela Crisp')).toBeInTheDocument();

    // Open creation modal drawer
    const addButton = screen.getByText('Add New Staff');
    fireEvent.click(addButton);

    // Populate fields with invalid empty space metrics
    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    const roleInput = screen.getByPlaceholderText('e.g. Pet Care Specialist');
    fireEvent.change(nameInput, { target: { value: '    ' } });
    fireEvent.change(roleInput, { target: { value: '    ' } });

    // Submit form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Assert that the protective error toast notification is mounted safely
    const errorToast = await screen.findByText('Please fill out both the Name and Role Description fields.');
    expect(errorToast).toBeInTheDocument();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // --- Test Case 2: Successful Profile Creation ---
  it('successfully creates new staff entries and fires correct data payloads', async () => {
    render(<ManageStaff />);
    expect(await screen.findByText('Angela Crisp')).toBeInTheDocument();

    // Open modal
    fireEvent.click(screen.getByText('Add New Staff'));

    // Populate clean valid target data strings
    fireEvent.change(screen.getByPlaceholderText('e.g. Jane Doe'), { target: { value: 'Clarise Diaz' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. Pet Care Specialist'), { target: { value: 'Nail Specialist' } });

    // Execute save routine
    fireEvent.click(screen.getByText('Save Changes'));

    // Verify correct data payloads hit the database layer
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({
        name: 'Clarise Diaz',
        role: 'Nail Specialist',
        is_active: true
      });
    });

    // Check for success feedback message confirmation toast
    const successToast = await screen.findByText('Clarise Diaz added to the team roster!');
    expect(successToast).toBeInTheDocument();
  });

  // --- Test Case 3: Edit Profile Pre-fill Injection ---
  it('pre-populates modal input fields correctly when launching Edit Profile mode', async () => {
    render(<ManageStaff />);
    expect(await screen.findByText('Angela Crisp')).toBeInTheDocument();

    // Locate and click Edit button for the first roster row entry
    const editButtons = screen.getAllByText('Edit Profile');
    fireEvent.click(editButtons[0]);

    // Assert that the header switches context dynamically
    expect(screen.getByText('Edit Staff Details')).toBeInTheDocument();

    // Assert that the field inputs match existing database row parameters exactly
    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe') as HTMLInputElement;
    const roleInput = screen.getByPlaceholderText('e.g. Pet Care Specialist') as HTMLInputElement;
    expect(nameInput.value).toBe('Angela Crisp');
    expect(roleInput.value).toBe('Senior Stylist');
  });

  // --- Test Case 4: Real-time Roster Visibility Switch ---
  it('triggers visibility shifts seamlessly when the active status switch is clicked', async () => {
    render(<ManageStaff />);
    expect(await screen.findByText('Angela Crisp')).toBeInTheDocument();

    // Locate the status indicator badge element inside the row layout matrix
    const statusToggleButton = screen.getByText('ACTIVE');
    fireEvent.click(statusToggleButton);

    // Verify correct ID parameter and inverted boolean value stream to update script
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ is_active: false });
    });

    // Confirm that the success confirmation message displays inside the toast engine viewport
    const successToast = await screen.findByText('Specialist work status shifted seamlessly.');
    expect(successToast).toBeInTheDocument();
  });
});