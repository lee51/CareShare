import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileNamePage from './page';
import React from 'react';

const { replaceMock, getUserMock, updateUserMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  getUserMock: vi.fn(),
  updateUserMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => new URLSearchParams('?next=/p/profile-123'),
}));

vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
      updateUser: updateUserMock,
    },
  },
}));

describe('ProfileNamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login if user is not authenticated', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    render(<ProfileNamePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/login');
    });
  });

  it('renders form and populates existing name if available', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com', user_metadata: { name: 'Alex' } },
      },
    });

    render(<ProfileNamePage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alex')).toBeInTheDocument();
    });
  });

  it('saves updated name and redirects to next parameter URL', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com', user_metadata: {} },
      },
    });
    updateUserMock.mockResolvedValue({ data: {}, error: null });

    render(<ProfileNamePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Alex Smith')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g. Alex Smith');
    const button = screen.getByRole('button', { name: /Save & Continue/i });

    fireEvent.change(input, { target: { value: 'Jordan Lee' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({
        data: { name: 'Jordan Lee' },
      });
      expect(replaceMock).toHaveBeenCalledWith('/p/profile-123');
    });
  });

  it('displays error if updateUser fails', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com', user_metadata: {} },
      },
    });
    updateUserMock.mockResolvedValue({ data: null, error: { message: 'Network error updating user' } });

    render(<ProfileNamePage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g. Alex Smith')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('e.g. Alex Smith');
    const button = screen.getByRole('button', { name: /Save & Continue/i });

    fireEvent.change(input, { target: { value: 'Sam Wilson' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Network error updating user')).toBeInTheDocument();
    });
  });
});
