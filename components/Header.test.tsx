import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';
import React from 'react';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

const { getUserMock, onAuthStateChangeMock, signOutMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    }
  }
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onAuthStateChangeMock.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } }
    });
  });

  it('renders CareShare title', () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    render(<Header />);
    expect(screen.getByText('CareShare')).toBeInTheDocument();
  });

  it('shows Account menu when user is logged in', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'test@example.com', user_metadata: { name: 'Test User' } } }
    });
    
    render(<Header />);
    
    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByLabelText('Account menu')).toBeInTheDocument();
    });
    
    // Click Account menu
    fireEvent.click(screen.getByLabelText('Account menu'));
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });
});
