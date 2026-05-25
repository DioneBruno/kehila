require("dotenv").config();
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { StorageInterface } from "src/@modules/shared/connections/connectionStorage.interface";

const region = process.env.STORAGE_REGION as string;
const credentials = {
  accessKeyId: process.env.STORAGE_KEYID as string,
  secretAccessKey: process.env.STORAGE_ACCESSKEY as string,
};

function detectContentType(buffer: Buffer): string {
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return "application/pdf";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return "image/gif";
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  )
    return "image/webp";
  // DOCX, XLSX, PPTX também iniciam com magic bytes ZIP — indistinguíveis sem inspecionar o conteúdo interno.
  // Nesse fallback retornamos application/zip; o contentType correto deve vir do caller via file.type.
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return "application/zip";
  if (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) return "application/msword";
  return "application/octet-stream";
}

export class ConnectionStorageAwsS3 implements StorageInterface {
  async generatePresignerUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const s3 = new S3Client({ region, credentials });
    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: path,
    });
    try {
      const url = await getSignedUrl(s3, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("Erro ao gerar URL temporária:", error);
      throw error;
    }
  }

  async generatePresignerUrlInline(path: string, expiresIn: number = 3600): Promise<string> {
    const s3 = new S3Client({ region, credentials });
    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: path,
      ResponseContentDisposition: "inline",
      ResponseContentType: "application/pdf",
    });
    try {
      const url = await getSignedUrl(s3, command, { expiresIn });
      return url;
    } catch (error) {
      console.error("Erro ao gerar URL temporária inline:", error);
      throw error;
    }
  } //TODO: Verificar sobre o inline (repliquei o generatePresignerUrl que virou generatePresignerUrlInline)

  async upload(path: string, file: Buffer, contentType?: string): Promise<{ path: string }> {
    const client = new S3Client({ region, credentials });
    const resolvedContentType = contentType ?? detectContentType(file);
    const params = {
      Bucket: process.env.STORAGE_BUCKET,
      Key: path,
      Body: file,
      ContentType: resolvedContentType,
      ContentDisposition: "inline",
    };
    const parallelUploads3 = new Upload({ client, params });
    try {
      await parallelUploads3.done();
      return { path };
    } catch (error) {
      throw error;
    }
  }

  async download(path: string): Promise<NodeJS.ReadableStream> {
    const s3 = new S3Client({ region, credentials });
    const command = new GetObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: path,
    });
    const item = await s3.send(command);
    return item.Body as NodeJS.ReadableStream;
  }
}
