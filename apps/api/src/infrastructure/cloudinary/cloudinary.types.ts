export interface CloudinarySignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string[];
  maxFileSize: number;
  publicId: string;
  tags: string[];
}

export interface CloudinaryAssetMetadata {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}
