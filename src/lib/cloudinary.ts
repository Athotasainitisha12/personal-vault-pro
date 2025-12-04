const CLOUD_NAME = 'deaixoaf0';
const UPLOAD_PRESET = 'personalmanger';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width?: number;
  height?: number;
}

export async function uploadToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('cloud_name', CLOUD_NAME);

  const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload to Cloudinary');
  }

  return response.json();
}

export function getCloudinaryUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: string;
}): string {
  const transforms: string[] = [];
  
  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);
  if (options?.quality) transforms.push(`q_${options.quality}`);

  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : '';
  
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformString}${publicId}`;
}
