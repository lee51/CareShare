import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivityFeed from './ActivityFeed';
import React from 'react';

const { selectMock, eqMock, orderMock, limitMock, channelMock, onMock, subscribeMock, removeChannelMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  eqMock: vi.fn(),
  orderMock: vi.fn(),
  limitMock: vi.fn(),
  channelMock: vi.fn(),
  onMock: vi.fn(),
  subscribeMock: vi.fn(),
  removeChannelMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: selectMock,
    }),
    channel: channelMock,
    removeChannel: removeChannelMock,
  }
}));

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    selectMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ order: orderMock });
    orderMock.mockReturnValue({ limit: limitMock });
    
    channelMock.mockReturnValue({ on: onMock });
    onMock.mockReturnValue({ subscribe: subscribeMock });
  });

  it('renders a list of activities', async () => {
    limitMock.mockResolvedValue({
      data: [
        { 
          id: '1', 
          activity_types: { name: 'food' }, 
          created_at: '2023-10-01T12:00:00Z', 
          metadata: { note: 'Ate well' } 
        },
      ],
    });

    render(<ActivityFeed profileId="profile-123" />);
    
    await waitFor(() => {
      expect(screen.getByText(/Food/i)).toBeInTheDocument();
      expect(screen.getByText('Ate well')).toBeInTheDocument();
    });
  });

  it('shows empty state when no activities exist', async () => {
    limitMock.mockResolvedValue({
      data: [],
    });

    render(<ActivityFeed profileId="profile-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('No recent activity')).toBeInTheDocument();
    });
  });
});
