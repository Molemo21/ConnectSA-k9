'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
} from 'lucide-react';
import Image from 'next/image';

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  allowUrls?: boolean;
  catalogueItemId?: string;
  className?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  url?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 10,
  disabled = false,
  allowUrls = true,
  catalogueItemId,
  className,
}: ImageUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());
  const [urlInput, setUrlInput] = useState('');

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const filesArray = Array.from(files);
      const remainingSlots = maxImages - value.length;

      if (filesArray.length > remainingSlots) {
        toast({
          title: 'Too many images',
          description: `You can only upload ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'}.`,
          variant: 'destructive',
        });
        return;
      }

      // Validate and upload each file
      for (const file of filesArray) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: 'Invalid file type',
            description: `${file.name} is not a valid image file.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: 'File too large',
            description: `${file.name} exceeds 5MB limit.`,
            variant: 'destructive',
          });
          continue;
        }

        // Create upload progress entry
        const progressId = `${Date.now()}-${Math.random()}`;
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(progressId, {
            file,
            progress: 0,
            status: 'uploading',
          });
          return newMap;
        });

        try {
          // Create FormData
          const formData = new FormData();
          formData.append('file', file);
          if (catalogueItemId) {
            formData.append('catalogueItemId', catalogueItemId);
          }

          // Upload file
          const response = await fetch('/api/upload/catalogue-image', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Upload failed');
          }

          const data = await response.json();

          // Update progress to success
          setUploadProgress((prev) => {
            const newMap = new Map(prev);
            const progress = newMap.get(progressId);
            if (progress) {
              newMap.set(progressId, {
                ...progress,
                progress: 100,
                status: 'success',
                url: data.url,
              });
            }
            return newMap;
          });

          // Add URL to value after a short delay
          setTimeout(() => {
            onChange([...value, data.url]);
            setUploadProgress((prev) => {
              const newMap = new Map(prev);
              newMap.delete(progressId);
              return newMap;
            });
          }, 500);
        } catch (error) {
          console.error('Upload error:', error);
          setUploadProgress((prev) => {
            const newMap = new Map(prev);
            const progress = newMap.get(progressId);
            if (progress) {
              newMap.set(progressId, {
                ...progress,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              });
            }
            return newMap;
          });

          toast({
            title: 'Upload failed',
            description: error instanceof Error ? error.message : 'Failed to upload image',
            variant: 'destructive',
          });
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [value, onChange, maxImages, catalogueItemId, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [disabled, handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
    },
    [handleFileSelect]
  );

  const handleRemoveImage = useCallback(
    async (index: number) => {
      const imageUrl = value[index];

      // If it's a Supabase URL, try to delete from storage
      if (imageUrl && imageUrl.includes('supabase.co')) {
        try {
          const response = await fetch('/api/upload/catalogue-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: imageUrl }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Delete failed' }));
            console.warn('Failed to delete image from storage:', error);
            // Continue anyway - remove from UI
          } else {
            toast({
              title: 'Image deleted',
              description: 'Image has been removed from storage',
            });
          }
        } catch (error) {
          console.error('Error deleting image:', error);
          // Continue anyway - remove from UI
        }
      }

      // Remove from local state (always happens)
      const newValue = value.filter((_, i) => i !== index);
      onChange(newValue);
    },
    [value, onChange, toast]
  );

  const handleAddUrl = useCallback(() => {
    if (!urlInput.trim()) return;

    try {
      new URL(urlInput.trim()); // Validate URL
      if (value.length >= maxImages) {
        toast({
          title: 'Maximum images reached',
          description: `You can only add up to ${maxImages} images.`,
          variant: 'destructive',
        });
        return;
      }
      onChange([...value, urlInput.trim()]);
      setUrlInput('');
      if (urlInputRef.current) {
        urlInputRef.current.value = '';
      }
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid image URL.',
        variant: 'destructive',
      });
    }
  }, [urlInput, value, onChange, maxImages, toast]);

  const uploadingImages = Array.from(uploadProgress.values());
  const canAddMore = value.length < maxImages;

  return (
    <div className={className}>
      {/* Drag and Drop Zone */}
      {canAddMore && !disabled && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragging
              ? 'border-blue-400 bg-blue-50/10 border-blue-400/50'
              : 'border-gray-300/20 bg-black/40 hover:border-gray-300/40'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
            <div className="text-sm">
              <span className="text-white font-medium">
                {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
              </span>
              <p className="text-gray-400 text-xs mt-1">
                PNG, JPG, WEBP up to 5MB (max {maxImages} images)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URL Input (if enabled) */}
      {allowUrls && canAddMore && !disabled && (
        <div className="mt-4 flex gap-2">
          <Input
            ref={urlInputRef}
            type="url"
            placeholder="Or paste image URL here"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
            className="flex-1 bg-black/60 border-gray-300/20 text-white placeholder-gray-400"
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={handleAddUrl}
            variant="outline"
            size="sm"
            disabled={disabled || !urlInput.trim()}
            className="border-gray-300/20 text-gray-300 hover:bg-gray-700/50"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Add URL
          </Button>
        </div>
      )}

      {/* Image Previews */}
      {(value.length > 0 || uploadingImages.length > 0) && (
        <div className="mt-4">
          <Label className="text-white/70 text-sm mb-2 block">
            Images ({value.length}/{maxImages})
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {/* Existing Images */}
            {value.map((url, index) => (
              <div
                key={`existing-${index}`}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-300/20"
              >
                <Image
                  src={url}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                {!disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/90 hover:bg-red-700"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* Uploading Images */}
            {uploadingImages.map((progress, index) => (
              <div
                key={`uploading-${index}`}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 border border-gray-300/20 flex items-center justify-center"
              >
                {progress.status === 'uploading' && (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/70 mt-1 truncate">{progress.file.name}</p>
                    </div>
                  </>
                )}
                {progress.status === 'success' && (
                  <>
                    {progress.url && (
                      <Image
                        src={progress.url}
                        alt="Uploaded"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                  </>
                )}
                {progress.status === 'error' && (
                  <>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 p-2">
                      <AlertCircle className="w-6 h-6 text-red-400 mb-1" />
                      <p className="text-xs text-red-300 text-center truncate w-full">
                        {progress.error || 'Upload failed'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                      onClick={() => {
                        setUploadProgress((prev) => {
                          const newMap = new Map(prev);
                          Array.from(newMap.entries()).forEach(([key, val]) => {
                            if (val === progress) {
                              newMap.delete(key);
                            }
                          });
                          return newMap;
                        });
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      {value.length === 0 && uploadingImages.length === 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Add up to {maxImages} images to showcase your service. Images will be displayed in your
          package cards.
        </p>
      )}
    </div>
  );
}

