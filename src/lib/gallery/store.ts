import "server-only";

/**
 * Credentials for the PRIVATE gallery Blob store (patient photos). This is a different store
 * from the public media library, so we always pass these explicitly: the SDK's defaults
 * (BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID) point at the PUBLIC store.
 *
 * - Locally: a read-write token for the private store.
 * - On Vercel: the store connected with the "GALLERY" env prefix gives a store id, and the SDK
 *   authenticates with the deployment's OIDC token.
 */
function galleryToken() {
  return process.env.GALLERY_READ_WRITE_TOKEN || process.env.GALLERY_BLOB_READ_WRITE_TOKEN || undefined;
}
function galleryStoreId() {
  return process.env.GALLERY_STORE_ID || process.env.GALLERY_BLOB_STORE_ID || undefined;
}

export const hasGalleryStore = () => Boolean(galleryToken() || galleryStoreId());

/** Options for every @vercel/blob call on the gallery store. Throws if it isn't configured. */
export function galleryBlob(): { token?: string; storeId?: string } {
  const token = galleryToken();
  const storeId = galleryStoreId();
  // Never fall through to the SDK defaults, which would hit the public media store.
  if (!token && !storeId) throw new Error("Gallery photo storage is not connected");
  return token ? { token } : { storeId };
}
