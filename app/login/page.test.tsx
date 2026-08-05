import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

const replaceMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

const signInWithOtpMock = vi.fn();
const verifyOtpMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => getSessionMock(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOtp: (args: any) => signInWithOtpMock(args),
      verifyOtp: (args: any) => verifyOtpMock(args),
    },
  },
}));

import LoginPage from './page';

describe('Login page UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ data: { session: null } });
  });

  it('renders initial email input form', async () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Magic Link / Code' })).toBeInTheDocument();
  });

  it('shows OTP token input after requesting code', async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Send Magic Link / Code' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(signInWithOtpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Verify Code' })).toBeInTheDocument();
    });
  });

  it('verifies 6-digit OTP token when submitted', async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });
    verifyOtpMock.mockResolvedValue({ error: null });

    render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Magic Link / Code' }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('123456')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('123456'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify Code' }));

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        token: '654321',
        type: 'email',
      });
      expect(replaceMock).toHaveBeenCalledWith('/');
    });
  });
});
