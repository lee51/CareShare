'use client';

import { use, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function GalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = use(params);
  const router = useRouter();
  
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('gallery').list(`${petId}/`);
    
    if (error) {
      console.error('Error fetching photos:', error);
    } else if (data) {
      const validFiles = data
        .filter(file => file.name !== '.emptyFolderPlaceholder')
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
      setPhotos(validFiles);
    }
    setLoading(false);
  }, [petId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let hasError = false;

    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${petId}/${fileName}`;

      const { error } = await supabase.storage.from('gallery').upload(filePath, file);
      if (error) {
        console.error('Error uploading:', error);
        hasError = true;
      }
    });

    await Promise.all(uploadPromises);

    if (hasError) {
      alert('Error uploading some photos');
    }
    
    await fetchPhotos();
    setUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetAvatar = async (fileName: string) => {
    const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(`${petId}/${fileName}`);
    
    const { error } = await supabase.from('pets').update({ avatar_url: publicUrl }).eq('id', petId);
    
    if (error) {
      console.error('Error setting avatar:', error);
      alert('Failed to set avatar');
    } else {
      alert('Avatar updated successfully!');
      router.push(`/pet/${petId}`);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    const { error } = await supabase.storage.from('gallery').remove([`${petId}/${fileName}`]);
    
    if (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    } else {
      await fetchPhotos();
    }
  };

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => router.push(`/pet/${petId}`)}
            className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold">Gallery</h2>
        </div>
        
        <div>
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload}
            disabled={uploading}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <p className="text-gray-500">No photos yet.</p>
          <p className="text-sm text-gray-400 mt-1">Upload a photo to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((file) => {
            const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(`${petId}/${file.name}`);
            return (
              <div key={file.id} className="relative group rounded-xl overflow-hidden aspect-square bg-gray-100 border border-gray-200">
                <img 
                  src={publicUrl} 
                  alt={file.name} 
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-2">
                  <button 
                    onClick={() => handleSetAvatar(file.name)}
                    className="w-full bg-white text-gray-900 text-sm font-medium py-1.5 rounded shadow-sm hover:bg-gray-100 transition-colors"
                  >
                    Set as Avatar
                  </button>
                  <button 
                    onClick={() => handleDelete(file.name)}
                    className="w-full bg-red-600 text-white text-sm font-medium py-1.5 rounded shadow-sm hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
