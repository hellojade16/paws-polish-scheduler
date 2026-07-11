// src/components/LoginPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';

// --- Mock Routing Layer mechanics ---
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// --- Mock Supabase Auth Pipeline Spies ---
const mockSignInWithPassword = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
    },
  },
}));

describe('LoginPage Automated Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Test Case 1: Interface Rendering Verification ---
  it('renders core layout branding assets and form fields cleanly into view', () => {
    render(<LoginPage />);

    // Check branding signature lines
    expect(screen.getAllByText(/Paws/i)[0]).toBeInTheDocument();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();

    // Verify input layouts exist via placeholder parameters
    expect(screen.getByPlaceholderText('admin@pawsandpolish.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  // --- Test Case 2: Rejected Auth Pipeline Interaction ---
  it('displays the inline warning notification bar when authentication request returns errors', async () => {
    // Injects a mock authentication failure response payload
    mockSignInWithPassword.mockResolvedValueOnce({
      error: { message: 'Invalid login credentials' },
    });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('admin@pawsandpolish.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Sign In to Dashboard' });

    // Populate mismatched credentials parameters
    fireEvent.change(emailInput, { target: { value: 'wrong@pawsandpolish.com' } });
    fireEvent.change(passwordInput, { target: { value: 'incorrectpassword' } });
    fireEvent.click(submitButton);

    // Assert correct matching argument strings hit the authentication engine api
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'wrong@pawsandpolish.com',
      password: 'incorrectpassword',
    });

    // Assert that the inline alert message card catches the update and mounts onto the DOM template
    const errorCard = await screen.findByText('Invalid login credentials');
    expect(errorCard).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // --- Test Case 3: Accepted Validation Routing Redirection ---
  it('redirects user viewpoint location path to /admin dashboard workspace on code clearance', async () => {
    // Injects a clean validation success response payload with no errors
    mockSignInWithPassword.mockResolvedValueOnce({ error: null });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('admin@pawsandpolish.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: 'Sign In to Dashboard' });

    // Populate authentic account parameters
    fireEvent.change(emailInput, { target: { value: 'admin@pawsandpolish.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secureadminpassword' } });
    fireEvent.click(submitButton);

    // Wait for asynchronous validations to complete and execute navigation scripts
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'admin@pawsandpolish.com',
        password: 'secureadminpassword',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });
});