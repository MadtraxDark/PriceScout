import { getGoogleAccessToken } from "@/utils/google-drive/oauth";

type DriveFile = { id: string; name?: string; mimeType?: string; size?: string; parents?: string[]; webViewLink?: string };
type DriveListResponse = { files?: DriveFile[]; nextPageToken?: string };

async function driveFetch<T>(connection: { refresh_token_ciphertext: string }, path: string, init?: RequestInit): Promise<T> {
  const token = await getGoogleAccessToken(connection.refresh_token_ciphertext);
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...(init?.headers || {}) },
    cache: "no-store",
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Google Drive respondeu ${response.status}: ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) as T : ({} as T);
}

function escapeDriveQuery(value: string) { return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'"); }

export async function findDriveFolder(connection: { refresh_token_ciphertext: string }, parentId: string, name: string) {
  const query = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${escapeDriveQuery(name)}' and '${escapeDriveQuery(parentId)}' in parents`;
  const result = await driveFetch<DriveListResponse>(connection, `files?q=${encodeURIComponent(query)}&pageSize=10&fields=files(id,name,mimeType,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true`);
  return result.files?.[0] ?? null;
}

export async function createDriveFolder(connection: { refresh_token_ciphertext: string }, parentId: string, name: string) {
  return driveFetch<DriveFile>(connection, "files?fields=id,name,mimeType,parents&supportsAllDrives=true", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
}

export async function uploadDriveFile(connection: { refresh_token_ciphertext: string }, folderId: string, name: string, mimeType: string, bytes: Buffer) {
  const token = await getGoogleAccessToken(connection.refresh_token_ciphertext);
  const start = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,size,parents,webViewLink", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8", "x-upload-content-type": mimeType, "x-upload-content-length": String(bytes.byteLength) },
    body: JSON.stringify({ name, parents: [folderId], mimeType }),
    cache: "no-store",
  });
  const sessionUrl = start.headers.get("location");
  if (!start.ok || !sessionUrl) throw new Error(`Não foi possível iniciar o upload no Google Drive (${start.status}).`);
  const uploaded = await fetch(sessionUrl, { method: "PUT", headers: { "content-length": String(bytes.byteLength), "content-type": mimeType }, body: new Uint8Array(bytes), cache: "no-store" });
  const body = await uploaded.text();
  if (!uploaded.ok) throw new Error(`Upload do Google Drive falhou (${uploaded.status}): ${body.slice(0, 300)}`);
  return JSON.parse(body) as DriveFile;
}

export async function updateDriveFile(connection: { refresh_token_ciphertext: string }, fileId: string, metadata: { name?: string; addParents?: string; removeParents?: string }) {
  const params = new URLSearchParams({ supportsAllDrives: "true", fields: "id,name,mimeType,size,parents,webViewLink" });
  if (metadata.addParents) params.set("addParents", metadata.addParents);
  if (metadata.removeParents) params.set("removeParents", metadata.removeParents);
  return driveFetch<DriveFile>(connection, `files/${encodeURIComponent(fileId)}?${params}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: metadata.name }) });
}

export async function deleteDriveFile(connection: { refresh_token_ciphertext: string }, fileId: string) {
  await driveFetch<Record<string, never>>(connection, `files/${encodeURIComponent(fileId)}?supportsAllDrives=true`, { method: "DELETE" });
}

export async function downloadDriveFile(connection: { refresh_token_ciphertext: string }, fileId: string) {
  const token = await getGoogleAccessToken(connection.refresh_token_ciphertext);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error(`Google Drive respondeu ${response.status} ao carregar a imagem.`);
  return { bytes: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get("content-type")?.split(";")[0].trim() || "application/octet-stream" };
}
