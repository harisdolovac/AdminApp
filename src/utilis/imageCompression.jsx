import imageCompression from 'browser-image-compression';

export async function compressImage(imageFile, isThumb = false) {
  const options = {
    maxSizeMB: isThumb ? 0.1 : 0.3, // 100KB for thumbnails, 300KB for main images
    maxWidthOrHeight: isThumb ? 400 : 800, // Smaller dimensions for thumbnails
    useWebWorker: true,
    fileType: 'image/jpeg' // Convert all images to JPEG for better compression
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    return imageFile; // Return original file if compression fails
  }
}