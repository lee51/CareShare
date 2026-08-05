import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InvitePage from './page';
import React from 'react';

vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    use: () => ({ id: 'profile-123' }),
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const singleMock = vi.fn();
const limitMock = vi.fn();

vi.mock('../../../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'user-owner' } }, error: null }),
    },
    from: (table: string) => {
      if (table === 'profiles') {
        return { select: () => ({ eq: () => ({ single: singleMock }) }) };
      }
      if (table === 'p_invites') {
        return {
          select: () => ({
            eq: () => ({ is: () => ({ gt: () => ({ order: () => ({ limit: limitMock }) }) }) }),
          }),
        };
      }
      return {};
    },
  },
}));

describe('Invite page UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    singleMock.mockResolvedValue({ data: { id: 'profile-123', name: 'Buddy', kind: 'dog' } });
  });

  it('renders invite header and link', async () => {
    limitMock.mockResolvedValue({
      data: [{ id: 'invite-123', p_id: 'profile-123' }],
      error: null,
    });

    render(<InvitePage params={Promise.resolve({ id: 'profile-123' })} />);

    await waitFor(() => {
      expect(screen.getByText("Invite to Buddy's Care Team")).toBeInTheDocument();
    });
  });
});
