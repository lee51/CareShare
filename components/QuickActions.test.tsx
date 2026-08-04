import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuickActions from './QuickActions';
import React from 'react';

const selectMock = vi.fn();

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: selectMock,
    })
  }
}));

describe('QuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders default quick actions', async () => {
    selectMock.mockResolvedValue({
      data: [
        { id: '1', name: 'food' },
        { id: '2', name: 'walk' },
        { id: '3', name: 'pee' },
      ],
    });

    render(<QuickActions profileId="profile-123" profileKind="dog" />);
    
    await waitFor(() => {
      expect(screen.getByText('food')).toBeInTheDocument();
      expect(screen.getByText('pee')).toBeInTheDocument();
    });
    // 'walk' is not in the default names ['food', 'pee', 'poop', 'nap']
    expect(screen.queryByText('walk')).not.toBeInTheDocument();
  });

  it('opens modal when action is clicked', async () => {
    selectMock.mockResolvedValue({
      data: [
        { id: '1', name: 'food' },
      ],
    });

    render(<QuickActions profileId="profile-123" profileKind="dog" />);
    
    await waitFor(() => {
      expect(screen.getByText('food')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('food'));
    
    expect(screen.getByText('Log food')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });
});
