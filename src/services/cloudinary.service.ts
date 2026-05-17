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

    const data = await response.json() as any;
    return data.secure_url;
  }
}

export const cloudinaryService = new CloudinaryService();
