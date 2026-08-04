import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Chat from './Chat';
import React from 'react';

const { selectMock, eqMock, orderMock, limitMock, channelMock, onMock, subscribeMock, removeChannelMock, getUserMock, insertMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  eqMock: vi.fn(),
  orderMock: vi.fn(),
  limitMock: vi.fn(),
  channelMock: vi.fn(),
  onMock: vi.fn(),
  subscribeMock: vi.fn(),
  removeChannelMock: vi.fn(),
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: selectMock,
      insert: insertMock,
    }),
    channel: channelMock,
    removeChannel: removeChannelMock,
    auth: {
      getUser: getUserMock,
    }
  }
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    selectMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ order: orderMock });
    orderMock.mockReturnValue({ limit: limitMock });
    
    channelMock.mockReturnValue({ on: onMock });
    onMock.mockReturnValue({ subscribe: subscribeMock });
  });

  it('renders existing messages', async () => {
    limitMock.mockResolvedValue({
      data: [
        { id: '1', content: 'Hello there!', created_at: '2023-10-01T12:00:00Z' },
      ],
    });

    render(<Chat profileId="profile-123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Hello there!')).toBeInTheDocument();
    });
  });

  it('allows sending a new message', async () => {
    limitMock.mockResolvedValue({ data: [] });
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    insertMock.mockResolvedValue({ error: null });

    render(<Chat profileId="profile-123" />);
    
    const input = screen.getByPlaceholderText('Message caretakers');
    const button = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'New message', p_id: 'profile-123', user_id: 'user-1' })
      );
    });
    
    // Input should be cleared
    expect(input).toHaveValue('');
  });
});
