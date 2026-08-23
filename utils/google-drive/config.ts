export const GOOGLE_DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

export function getGoogleDriveConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const tokenEncryptionKey = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  const scopes = process.env.GOOGLE_DRIVE_SCOPES || "https://www.googleapis.com/auth/drive.file";

  if (!clientId || !clientSecret || !redirectUri || !rootFolderId || !tokenEncryptionKey) {
    throw new Error("A integração Google Drive não está configurada no ambiente do servidor.");
  }
  return { clientId, clientSecret, redirectUri, rootFolderId, tokenEncryptionKey, scopes };
}
