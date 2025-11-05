// Firebase Storage Helper Functions for Next.js
// Based on Firebase Storage SDK documentation

import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
} from 'firebase/storage';
import type {
  UploadResult,
  UploadTaskSnapshot,
  ListResult,
  FullMetadata,
} from 'firebase/storage';
import { storage } from './firebase';

// Storage paths
export const STORAGE_PATHS = {
  DESTINATIONS: 'destinations',
  UMKM: 'umkm',
  TEMP: 'temp',
} as const;

export class StorageService {
  /**
   * Upload file to Firebase Storage
   */
  static async uploadFile(
    file: File | Buffer,
    path: string,
    options: {
      contentType?: string;
      customMetadata?: Record<string, string>;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<{
    downloadURL: string;
    path: string;
    metadata: FullMetadata;
  }> {
    try {
      const storageRef = ref(storage, path);

      // Set metadata
      const metadata: any = {};
      if (options.contentType) {
        metadata.contentType = options.contentType;
      }
      if (options.customMetadata) {
        metadata.customMetadata = options.customMetadata;
      }

      let uploadResult: UploadResult;

      if (options.onProgress) {
        // Use resumable upload for progress tracking
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadResult = await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot: UploadTaskSnapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              options.onProgress?.(progress);
            },
            (error) => reject(error),
            () => resolve(uploadTask.snapshot)
          );
        });
      } else {
        // Simple upload
        uploadResult = await uploadBytes(storageRef, file, metadata);
      }

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Get metadata
      const fileMetadata = await getMetadata(uploadResult.ref);

      return {
        downloadURL,
        path: uploadResult.ref.fullPath,
        metadata: fileMetadata,
      };
    } catch (error: any) {
      console.error('File upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload destination image
   */
  static async uploadDestinationImage(
    file: File | Buffer,
    destinationId: string,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<{
    downloadURL: string;
    path: string;
    metadata: FullMetadata;
  }> {
    const path = `${STORAGE_PATHS.DESTINATIONS}/${destinationId}/${filename}`;

    const uploadOptions: {
      contentType: string;
      customMetadata: { destinationId: string; uploadedAt: string; };
      onProgress?: (progress: number) => void;
    } = {
      contentType: file instanceof File ? file.type : 'image/jpeg',
      customMetadata: {
        destinationId,
        uploadedAt: new Date().toISOString(),
      },
    };

    if (onProgress) {
      uploadOptions.onProgress = onProgress;
    }

    return this.uploadFile(file, path, uploadOptions);
  }

  /**
   * Upload UMKM image
   */
  static async uploadUMKMImage(
    file: File | Buffer,
    umkmId: string,
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<{
    downloadURL: string;
    path: string;
    metadata: FullMetadata;
  }> {
    const path = `${STORAGE_PATHS.UMKM}/${umkmId}/${filename}`;

    const uploadOptions: {
      contentType: string;
      customMetadata: { umkmId: string; uploadedAt: string; };
      onProgress?: (progress: number) => void;
    } = {
      contentType: file instanceof File ? file.type : 'image/jpeg',
      customMetadata: {
        umkmId,
        uploadedAt: new Date().toISOString(),
      },
    };

    if (onProgress) {
      uploadOptions.onProgress = onProgress;
    }

    return this.uploadFile(file, path, uploadOptions);
  }

  /**
   * Delete file from Storage
   */
  static async deleteFile(path: string): Promise<void> {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch (error: any) {
      console.error('File deletion error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Get file download URL
   */
  static async getDownloadURL(path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      return await getDownloadURL(storageRef);
    } catch (error: any) {
      console.error('Get download URL error:', error);
      throw new Error(`Get URL failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(path: string): Promise<FullMetadata> {
    try {
      const storageRef = ref(storage, path);
      return await getMetadata(storageRef);
    } catch (error: any) {
      console.error('Get metadata error:', error);
      throw new Error(`Get metadata failed: ${error.message}`);
    }
  }

  /**
   * Update file metadata
   */
  static async updateFileMetadata(
    path: string,
    updates: {
      contentType?: string;
      customMetadata?: Record<string, string>;
    }
  ): Promise<FullMetadata> {
    try {
      const storageRef = ref(storage, path);
      return await updateMetadata(storageRef, updates);
    } catch (error: any) {
      console.error('Update metadata error:', error);
      throw new Error(`Update metadata failed: ${error.message}`);
    }
  }

  /**
   * List files in a directory
   */
  static async listFiles(
    path: string,
    _options: {
      maxResults?: number;
    } = {}
  ): Promise<ListResult> {
    try {
      const storageRef = ref(storage, path);
      return await listAll(storageRef);
    } catch (error: any) {
      console.error('List files error:', error);
      throw new Error(`List files failed: ${error.message}`);
    }
  }

  /**
   * List destination images
   */
  static async listDestinationImages(destinationId: string): Promise<ListResult> {
    const path = `${STORAGE_PATHS.DESTINATIONS}/${destinationId}`;
    return this.listFiles(path);
  }

  /**
   * List UMKM images
   */
  static async listUMKMImages(umkmId: string): Promise<ListResult> {
    const path = `${STORAGE_PATHS.UMKM}/${umkmId}`;
    return this.listFiles(path);
  }

  /**
   * Clean up old files (utility function)
   */
  static async cleanupTempFiles(): Promise<void> {
    try {
      const tempFiles = await this.listFiles(STORAGE_PATHS.TEMP);

      const deletePromises = tempFiles.items.map(async (itemRef) => {
        try {
          // Check if file is older than 24 hours
          const metadata = await getMetadata(itemRef);
          const uploadedAt = metadata.timeCreated ? new Date(metadata.timeCreated) : new Date();
          const age = Date.now() - uploadedAt.getTime();
          const oneDay = 24 * 60 * 60 * 1000;

          if (age > oneDay) {
            await deleteObject(itemRef);
          }
        } catch (error) {
          console.warn(`Failed to check/delete temp file ${itemRef.fullPath}:`, error);
        }
      });

      await Promise.all(deletePromises);
      console.log('Temp files cleanup completed');
    } catch (error: any) {
      console.error('Cleanup error:', error);
      throw new Error(`Cleanup failed: ${error.message}`);
    }
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    return `${timestamp}_${random}.${extension}`;
  }

  /**
   * Validate file type
   */
  static validateImageFile(file: File | Buffer, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): boolean {
    if (file instanceof File) {
      return allowedTypes.includes(file.type);
    }
    // For Buffer, we can't easily check MIME type without additional libraries
    return true;
  }

  /**
   * Validate file size
   */
  static validateFileSize(file: File | Buffer, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file instanceof File) {
      return file.size <= maxSizeBytes;
    } else if (Buffer.isBuffer(file)) {
      return file.length <= maxSizeBytes;
    }

    return false;
  }
}

// Utility functions for Next.js API routes
export class StorageUtils {
  /**
   * Handle file upload from Next.js API route
   */
  static async handleFileUpload(
    files: any, // From formidable or similar
    uploadPath: string,
    options: {
      maxSizeMB?: number;
      allowedTypes?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png'] } = options;

      // Validate file
      if (!StorageService.validateImageFile(files.file, allowedTypes)) {
        return { success: false, error: 'Invalid file type' };
      }

      if (!StorageService.validateFileSize(files.file, maxSizeMB)) {
        return { success: false, error: `File too large (max ${maxSizeMB}MB)` };
      }

      // Upload file
      const filename = StorageService.generateUniqueFilename(files.file.name || 'image.jpg');
      const result = await StorageService.uploadFile(files.file, uploadPath, {
        contentType: files.file.type || 'image/jpeg',
      });

      return {
        success: true,
        data: {
          filename,
          downloadURL: result.downloadURL,
          path: result.path,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default StorageService;
