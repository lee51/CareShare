import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AcceptInvitePage from './page';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    use: () => ({ id: 'invite-123' }),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const rpcMock = vi.fn();
const getSessionMock = vi.fn();

vi.mock('../../../lib/supabaseClient', () => ({
  supabase: {
    rpc: (fn: string, args: any) => rpcMock(fn, args),
    auth: {
      getSession: () => getSessionMock(),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

describe('accept invite page ui', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders invitation prompt for authenticated user', async () => {
    rpcMock.mockImplementation((fn) => {
      if (fn === 'get_invite') {
        return Promise.resolve({
          data: [{ id: 'invite-123', p_id: 'profile-123', used_by: null, profile_name: 'Buddy', profile_kind: 'dog' }],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-b', email: 'userb@example.com' } } },
    });

    render(<AcceptInvitePage params={Promise.resolve({ id: 'invite-123' })} />);

    await waitFor(() => {
      expect(screen.getByText("Join Buddy's care team")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Accept Invite' })).toBeInTheDocument();
    });
  });
});
