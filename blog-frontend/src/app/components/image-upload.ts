import { createImageUpload } from '@/lib/novel';

const onUpload = async (file: File): Promise<string> => {
  // Create a local URL for the image
  const url = URL.createObjectURL(file);
  
  // In production, you would upload to your server or cloud storage
  // Example:
  // const formData = new FormData();
  // formData.append('file', file);
  // const response = await fetch('/api/upload', {
  //   method: 'POST',
  //   body: formData,
  // });
  // const data = await response.json();
  // return data.url;
  
  // For now, just use the local URL
  return url;
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    if (!file.type.includes('image/')) {
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      return false;
    }
    return true;
  },
});
