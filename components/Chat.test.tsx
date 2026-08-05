import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Chat from './Chat';
import React from 'react';

const {
  selectMock,
  eqMock,
  orderMock,
  limitMock,
  channelMock,
  onMock,
  subscribeMock,
  removeChannelMock,
  getUserMock,
  insertMock,
  insertSelectMock,
  insertSingleMock,
  fromMock,
} = vi.hoisted(() => ({
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
  insertSelectMock: vi.fn(),
  insertSingleMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => {
      fromMock(table);
      return {
        select: selectMock,
        insert: insertMock,
      };
    },
    channel: channelMock,
    removeChannel: removeChannelMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    selectMock.mockReturnValue({ eq: eqMock });
    eqMock.mockReturnValue({ order: orderMock });
    orderMock.mockReturnValue({ limit: limitMock });

    insertMock.mockReturnValue({ select: insertSelectMock });
    insertSelectMock.mockReturnValue({ single: insertSingleMock });

    channelMock.mockReturnValue({ on: onMock });
    onMock.mockReturnValue({ subscribe: subscribeMock });

    // Mock scrollIntoView for jsdom
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders existing messages in chronological order and selects from messages_with_senders view', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1', email: 'alice@example.com' } } });
    limitMock.mockResolvedValue({
      data: [
        { id: '2', content: 'Second message', created_at: '2023-10-01T12:05:00Z', user_id: 'user-1', sender_name: 'Alice' },
        { id: '1', content: 'First message', created_at: '2023-10-01T12:00:00Z', user_id: 'user-2', sender_name: 'Bob' },
      ],
    });

    render(<Chat profileId="profile-123" />);

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('messages_with_senders');
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    const items = screen.getAllByText(/message/i);
    expect(items[0]).toHaveTextContent('First message');
    expect(items[1]).toHaveTextContent('Second message');
  });

  it('shows who sent any particular message using sender_name from read join', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1', email: 'alice@example.com' } } });
    limitMock.mockResolvedValue({
      data: [
        { id: '1', content: 'Hello from Bob', created_at: '2023-10-01T12:00:00Z', user_id: 'user-2', sender_name: 'Bob' },
        { id: '2', content: 'Hello from Alice', created_at: '2023-10-01T12:01:00Z', user_id: 'user-1', sender_name: 'Alice' },
      ],
    });

    render(<Chat profileId="profile-123" />);

    await waitFor(() => {
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Alice (You)')).toBeInTheDocument();
    });
  });

  it('renders newly sent messages instantly without inserting metadata.sender_name', async () => {
    limitMock.mockResolvedValue({ data: [] });
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1', email: 'alice@example.com', user_metadata: { name: 'Alice' } } } });
    insertSingleMock.mockResolvedValue({
      data: {
        id: 'new-1',
        content: 'New message',
        p_id: 'profile-123',
        user_id: 'user-1',
        created_at: '2023-10-01T12:10:00Z',
      },
    });

    render(<Chat profileId="profile-123" />);

    const input = screen.getByPlaceholderText('Message caretakers');
    const button = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'New message' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fromMock).toHaveBeenCalledWith('messages');
      expect(insertMock).toHaveBeenCalledWith({
        p_id: 'profile-123',
        user_id: 'user-1',
        content: 'New message',
      });
      expect(screen.getByText('New message')).toBeInTheDocument();
    });

    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('sends message when pressing Enter key', async () => {
    limitMock.mockResolvedValue({ data: [] });
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1', email: 'alice@example.com' } } });
    insertSingleMock.mockResolvedValue({
      data: {
        id: 'enter-1',
        content: 'Sent via Enter',
        p_id: 'profile-123',
        user_id: 'user-1',
        created_at: '2023-10-01T12:15:00Z',
      },
    });

    render(<Chat profileId="profile-123" />);

    const input = screen.getByPlaceholderText('Message caretakers');

    fireEvent.change(input, { target: { value: 'Sent via Enter' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Sent via Enter')).toBeInTheDocument();
    });
  });

  it('receives and appends realtime INSERT messages without duplicate entries', async () => {
    let realtimeCallback: ((payload: any) => void) | null = null;
    onMock.mockImplementation((event, filter, callback) => {
      realtimeCallback = callback;
      return { subscribe: subscribeMock };
    });

    limitMock.mockResolvedValue({
      data: [{ id: '1', content: 'Initial message', created_at: '2023-10-01T12:00:00Z', user_id: 'user-2', sender_name: 'Bob' }],
    });

    render(<Chat profileId="profile-123" />);

    await waitFor(() => {
      expect(screen.getByText('Initial message')).toBeInTheDocument();
    });

    // Simulate incoming realtime insert message
    if (realtimeCallback) {
      act(() => {
        (realtimeCallback as any)({
          new: { id: '2', content: 'Realtime message', created_at: '2023-10-01T12:02:00Z', user_id: 'user-3', sender_name: 'Charlie' },
        });
      });
    }

    await waitFor(() => {
      expect(screen.getByText('Realtime message')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });
  });

  it('displays fallback sender name when sender_name and metadata.sender_name are missing', async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    limitMock.mockResolvedValue({
      data: [{ id: '1', content: 'Legacy message', created_at: '2023-10-01T12:00:00Z', user_id: 'user-999', sender_name: null, metadata: null }],
    });

    render(<Chat profileId="profile-123" />);

    await waitFor(() => {
      expect(screen.getByText('Caretaker')).toBeInTheDocument();
    });
  });
});


