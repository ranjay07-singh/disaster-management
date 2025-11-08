import { API_CONFIG } from '../config/ApiConfig';

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ProfileImageService {
  /**
   * Upload profile image to S3 bucket via backend API
   * @param userId - User ID for the profile
   * @param imageUri - Local URI of the image
   * @param token - Authentication token
   * @returns Promise with upload result
   */
  static async uploadProfileImage(
    userId: string,
    imageUri: string,
    token?: string
  ): Promise<ImageUploadResult> {
    try {
      // Create form data for multipart upload
      const formData = new FormData();
      
      // Extract filename from URI or generate one
      const filename = imageUri.split('/').pop() || `profile_${userId}_${Date.now()}.jpg`;
      const fileType = this.getFileType(filename);

      // Create file object for upload
      const file: any = {
        uri: imageUri,
        type: fileType,
        name: filename,
      };

      formData.append('file', file);
      formData.append('userId', userId);
      formData.append('type', 'profile');

      // Upload to backend which handles S3 upload
      console.log('📤 Uploading to:', `${API_CONFIG.BASE_URL}${API_CONFIG.UPLOAD}`);
      console.log('📦 Form data - userId:', userId, 'type: profile');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.UPLOAD}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📥 Raw response:', responseText);
      
      const result = JSON.parse(responseText);
      console.log('📋 Parsed result:', JSON.stringify(result, null, 2));
      console.log('🖼️ Image URL from result:', result.imageUrl);
      
      return {
        success: true,
        imageUrl: result.imageUrl || result.fileUrl || result.url,
      };
    } catch (error) {
      console.error('❌ Profile image upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Update user profile with new image URL
   * @param userId - User ID
   * @param imageUrl - S3 URL of uploaded image
   * @param token - Authentication token
   */
  static async updateProfileImageUrl(
    userId: string,
    imageUrl: string,
    token?: string
  ): Promise<boolean> {
    try {
      console.log('📝 Updating profile image URL in database...');
      console.log('👤 User ID:', userId);
      console.log('🖼️ Image URL:', imageUrl);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.USERS}/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          profileImage: imageUrl,
        }),
      });

      console.log('📡 Update response status:', response.status);
      console.log('📡 Update response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to update profile in database:', errorText);
      } else {
        console.log('✅ Profile image URL updated in database successfully!');
      }

      return response.ok;
    } catch (error) {
      console.error('❌ Profile image URL update error:', error);
      return false;
    }
  }

  /**
   * Delete profile image from S3
   * @param imageUrl - S3 URL of the image
   * @param token - Authentication token
   */
  static async deleteProfileImage(
    imageUrl: string,
    token?: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.UPLOAD}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          fileUrl: imageUrl,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Profile image deletion error:', error);
      return false;
    }
  }

  /**
   * Compress image before upload (if needed)
   * @param imageUri - Local URI of the image
   * @param quality - Compression quality (0-1)
   */
  static async compressImage(imageUri: string, quality: number = 0.8): Promise<string> {
    // This would require expo-image-manipulator
    // For now, return original URI
    return imageUri;
  }

  /**
   * Validate image file
   * @param imageUri - Local URI of the image
   */
  static validateImage(imageUri: string): { valid: boolean; error?: string } {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const extension = imageUri.toLowerCase().split('.').pop();
    
    if (!extension || !validExtensions.includes(`.${extension}`)) {
      return {
        valid: false,
        error: 'Invalid file type. Please select a JPG, PNG, GIF, or WebP image.',
      };
    }

    return { valid: true };
  }

  /**
   * Get MIME type from filename
   */
  private static getFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };

    return mimeTypes[extension || 'jpg'] || 'image/jpeg';
  }

  /**
   * Generate optimized filename
   */
  static generateFilename(userId: string, extension: string = 'jpg'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `profile_${userId}_${timestamp}_${random}.${extension}`;
  }
}
