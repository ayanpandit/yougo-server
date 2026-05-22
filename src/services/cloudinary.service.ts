import crypto from 'crypto';
import { env } from '../config/env';
import { BadRequestError } from '../utils/errors';

class CloudinaryService {
  isConfigured(): boolean {
    return !!(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);
  }

  private generateSignature(params: Record<string, any>, apiSecret: string): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    return crypto
      .createHash('sha1')
      .update(sortedParams + apiSecret)
      .digest('hex');
  }

  async uploadImage(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new BadRequestError(
        'Cloudinary is not configured on this server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
      );
    }

    const cloudName = env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = env.CLOUDINARY_API_KEY!;
    const apiSecret = env.CLOUDINARY_API_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = 'yougo_profiles';

    // Sign the folder and timestamp parameters (required by Cloudinary for secure uploads)
    const paramsToSign = {
      folder,
      timestamp
    };

    const signature = this.generateSignature(paramsToSign, apiSecret);

    // Create native FormData (since Hono runs on Node 20+, standard global FormData and Blob are built-in!)
    const formData = new FormData();

    // Create a Blob from the file buffer to upload it via standard fetch FormData
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });

    formData.append('file', blob, 'profile_image');
    formData.append('folder', folder);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[CloudinaryService] Upload failed:', errorData);
      throw new BadRequestError(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = (await response.json()) as any;
    return data.secure_url;
  }

  extractPublicId(url: string): string | null {
    if (!url || !url.includes('res.cloudinary.com')) return null;

    try {
      const parts = url.split('/image/upload/');
      if (parts.length < 2) return null;

      let path = parts[1];

      // Strip out the version number (e.g. v12345678/) if it exists
      if (path.startsWith('v')) {
        const firstSlash = path.indexOf('/');
        if (firstSlash !== -1) {
          path = path.substring(firstSlash + 1);
        }
      }

      // Strip file extension (.jpg, .png, etc.)
      const lastDot = path.lastIndexOf('.');
      if (lastDot !== -1) {
        path = path.substring(0, lastDot);
      }

      return path;
    } catch (error) {
      console.error('[CloudinaryService] Error extracting public ID:', error);
      return null;
    }
  }

  async deleteImage(url: string): Promise<boolean> {
    if (!this.isConfigured() || !url) return false;

    const publicId = this.extractPublicId(url);
    if (!publicId) return false;

    const cloudName = env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = env.CLOUDINARY_API_KEY!;
    const apiSecret = env.CLOUDINARY_API_SECRET!;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const paramsToSign = {
      public_id: publicId,
      timestamp
    };

    const signature = this.generateSignature(paramsToSign, apiSecret);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', signature);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[CloudinaryService] Destroy failed:', errorData);
        return false;
      }

      const result = (await response.json()) as any;
      console.log(`[CloudinaryService] Successfully deleted old image: ${publicId}`, result);
      return result.result === 'ok';
    } catch (error) {
      console.error('[CloudinaryService] Destroy request error:', error);
      return false;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
