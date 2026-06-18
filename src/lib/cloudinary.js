/**
 * Direct-to-Cloudinary uploads (unsigned preset).
 *
 * The backend never receives raw image bytes for products/KYB — the client
 * uploads straight to Cloudinary and persists only the resulting secure CDN
 * URL. Configure via .env:
 *   VITE_CLOUDINARY_CLOUD_NAME
 *   VITE_CLOUDINARY_UPLOAD_PRESET   (an *unsigned* preset)
 */
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/** True when both required env vars are present. */
export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Validate a file CLIENT-SIDE before upload. Returns an error string, or null
 * when the file is acceptable.
 */
export function validateImageFile(file) {
  if (!file) return 'No file selected.';
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are supported.';
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be under 5MB.';
  }
  return null;
}

/**
 * Upload a single image and return its permanent `secure_url`.
 * Throws on misconfiguration, validation failure, or a non-OK response.
 */
export async function uploadImageToCloudinary(file, folder = 'azaman-products') {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.');
  }
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData },
  );
  if (!res.ok) {
    let detail = res.statusText;
    try { detail = (await res.json())?.error?.message || detail; } catch { /* keep statusText */ }
    throw new Error(`Cloudinary upload failed: ${detail}`);
  }
  const data = await res.json();
  return data.secure_url;
}
