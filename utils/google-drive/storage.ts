import { createHash } from "node:crypto";
import { createDriveFolder, deleteDriveFile, findDriveFolder, uploadDriveFile } from "@/utils/google-drive/api";
import { getDriveConnection } from "@/utils/google-drive/oauth";
import { getSupabaseServerClient } from "@/utils/supabase/server";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "sem-identificacao"; }
function cleanFileName(value: string) { return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 140) || "imagem"; }

async function ensureFolder(userId: string, connection: { refresh_token_ciphertext: string }, parentId: string, kind: "brand" | "product" | "images", key: string, name: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não está configurado no servidor.");
  const { data: cached, error: cacheError } = await supabase.from("google_drive_folders").select("drive_folder_id").eq("user_id", userId).eq("parent_drive_folder_id", parentId).eq("folder_kind", kind).eq("folder_key", key).maybeSingle();
  if (cacheError) throw cacheError;
  if (cached) return cached.drive_folder_id;

  const existing = await findDriveFolder(connection, parentId, name);
  const driveFolder = existing ?? await createDriveFolder(connection, parentId, name);
  const { error } = await supabase.from("google_drive_folders").upsert({ user_id: userId, drive_folder_id: driveFolder.id, parent_drive_folder_id: parentId, folder_kind: kind, folder_key: key, name }, { onConflict: "user_id,parent_scope,folder_kind,folder_key" });
  if (error) throw error;
  return driveFolder.id;
}

async function downloadImage(url: string) {
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error("A URL de uma imagem coletada é inválida."); }
  if (parsed.protocol !== "https:") throw new Error("Somente imagens HTTPS podem ser armazenadas.");
  const response = await fetch(parsed, { signal: AbortSignal.timeout(30_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Não foi possível baixar a imagem (${response.status}).`);
  const contentType = response.headers.get("content-type")?.split(";")[0].trim() || "application/octet-stream";
  if (!contentType.startsWith("image/")) throw new Error("A URL coletada não retornou uma imagem.");
  const declaredLength = Number(response.headers.get("content-length") || 0);
  if (declaredLength > MAX_IMAGE_BYTES) throw new Error("A imagem excede o limite de 25 MB.");
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error("A imagem excede o limite de 25 MB.");
  return { bytes, contentType };
}

function extensionForMime(mimeType: string) { return ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" } as Record<string, string>)[mimeType] || "bin"; }

export async function uploadProductImages(input: { userId: string; source: string; productId: string; productUrl: string; productName: string; brand: string | null; images: Array<{ url: string; alt?: string | null }> }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase não está configurado no servidor.");
  const connection = await getDriveConnection(input.userId);
  const brandKey = slugify(input.brand || "sem-marca");
  const brandFolder = await ensureFolder(input.userId, connection, connection.root_folder_id, "brand", brandKey, input.brand || "Sem marca");
  const productKey = slugify(input.productId);
  const productFolder = await ensureFolder(input.userId, connection, brandFolder, "product", productKey, `${input.productId} - ${input.productName}`.slice(0, 160));
  const imagesFolder = await ensureFolder(input.userId, connection, productFolder, "images", "images", "Imagens");
  const results: Array<{ fileId: string; driveFileId: string; sha256: string; reused: boolean; name: string }> = [];

  for (const [index, image] of input.images.entries()) {
    const downloaded = await downloadImage(image.url);
    const sha256 = createHash("sha256").update(downloaded.bytes).digest("hex");
    const { data: existing, error: existingError } = await supabase.from("google_drive_files").select("id,drive_file_id,name,sha256").eq("user_id", input.userId).eq("sha256", sha256).maybeSingle();
    if (existingError) throw existingError;
    let file = existing;
    let reused = Boolean(existing);
    if (!file) {
      const sourceName = image.url.split("/").pop()?.split("?")[0] || `imagem-${index + 1}`;
      const name = `${String(index + 1).padStart(2, "0")}-${cleanFileName(sourceName.replace(/\.[^.]+$/, ""))}.${extensionForMime(downloaded.contentType)}`;
      const uploaded = await uploadDriveFile(connection, imagesFolder, name, downloaded.contentType, downloaded.bytes);
      const insert = await supabase.from("google_drive_files").insert({ user_id: input.userId, drive_file_id: uploaded.id, drive_folder_id: imagesFolder, name, mime_type: downloaded.contentType, byte_size: downloaded.bytes.byteLength, sha256 }).select("id,drive_file_id,name,sha256").single();
      if (insert.error?.code === "23505") {
        const duplicate = await supabase.from("google_drive_files").select("id,drive_file_id,name,sha256").eq("user_id", input.userId).eq("sha256", sha256).single();
        if (duplicate.error) throw duplicate.error;
        await deleteDriveFile(connection, uploaded.id);
        file = duplicate.data;
        reused = true;
      } else if (insert.error) throw insert.error;
      else file = insert.data;
    }
    if (!file) throw new Error("Não foi possível registrar o arquivo do Google Drive.");
    const relation = await supabase.from("google_drive_product_files").upsert({ user_id: input.userId, product_source: input.source, external_product_id: input.productId, product_url: input.productUrl, drive_file_id: file.id, sort_order: index }, { onConflict: "user_id,product_source,external_product_id,drive_file_id" });
    if (relation.error) throw relation.error;
    results.push({ fileId: file.id, driveFileId: file.drive_file_id, sha256: file.sha256, reused, name: file.name });
  }
  return { folders: { brand: brandFolder, product: productFolder, images: imagesFolder }, files: results };
}
