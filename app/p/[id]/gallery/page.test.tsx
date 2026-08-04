import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GalleryPage from './page';
import React from 'react';

// Mock React.use
vi.mock('react', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    use: (promise: Promise<any>) => {
      // Very naive mock for React.use() unwrapping promises in tests
      let result;
      promise.then(res => { result = res; });
      // In this simple test setup where we pass an already resolved Promise.resolve()
      // or we can just mock it to return the resolved value directly for our tests
      return { id: 'profile-123' }; 
    },
  };
});

// Mock Next.js navigation
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock Supabase client
const listMock = vi.fn();
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const removeMock = vi.fn();
const updateMock = vi.fn();
const eqMock = vi.fn();

vi.mock('../../../../lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({
        list: listMock,
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
        remove: removeMock,
      }),
    },
    from: () => ({
      update: updateMock.mockReturnValue({ eq: eqMock }),
    }),
  },
}));

describe('GalleryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    listMock.mockResolvedValue({
      data: [
        { name: 'photo1.jpg', id: '1' },
        { name: 'photo2.jpg', id: '2' },
      ],
      error: null,
    });
    
    getPublicUrlMock.mockReturnValue({
      data: { publicUrl: 'https://example.com/photo.jpg' },
    });
  });

  it('renders loading state initially and then shows photos', async () => {
    render(<GalleryPage params={Promise.resolve({ id: 'profile-123' })} />);
    
    expect(screen.getByText('Loading photos...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading photos...')).not.toBeInTheDocument();
    });
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('shows empty state when no photos are returned', async () => {
    listMock.mockResolvedValue({ data: [], error: null });
    render(<GalleryPage params={Promise.resolve({ id: 'profile-123' })} />);
    
    await waitFor(() => {
      expect(screen.getByText('No photos yet.')).toBeInTheDocument();
    });
  });

  it('triggers set avatar function when clicked', async () => {
    eqMock.mockResolvedValue({ error: null });
    
    // Stub window.alert
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<GalleryPage params={Promise.resolve({ id: 'profile-123' })} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading photos...')).not.toBeInTheDocument();
    });
    
    const setAvatarButtons = screen.getAllByText('Set as Avatar');
    fireEvent.click(setAvatarButtons[0]);
    
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ avatar_url: 'https://example.com/photo.jpg' });
      expect(eqMock).toHaveBeenCalledWith('id', 'profile-123');
      expect(pushMock).toHaveBeenCalledWith('/p/profile-123');
    });
    
    alertMock.mockRestore();
  });
});
