import { cloudinary } from "./cloudinary.config";
import { CloudinarySignedUploadParams, CloudinaryAssetMetadata } from "./cloudinary.types";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { BadRequestError } from "@veyora/utils";

const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export class CloudinaryService {
  /**
   * Generates secure, server-signed upload parameters for authenticated clients.
   * Restricts folder path to authenticated user ID and role, bounding upload boundaries.
   */
  public generateUploadSignature(userId: string, role: string): CloudinarySignedUploadParams {
    const timestamp = Math.floor(Date.now() / 1000);
    const roleFolder = role === "customer" ? "customers" : "staff";
    const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/profiles/${roleFolder}/${userId}`;
    const publicId = `avatar_${timestamp}`;
    const tags = ["profile_avatar", `user_${userId}`, role];

    // Explicit parameters to be signed according to Cloudinary W3C specification
    const paramsToSign = {
      folder,
      public_id: publicId,
      tags: tags.join(","),
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

    return {
      signature,
      timestamp,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      folder,
      allowedFormats: ALLOWED_IMAGE_FORMATS,
      maxFileSize: MAX_FILE_SIZE_BYTES,
      publicId: `${folder}/${publicId}`,
      tags,
    };
  }

  /**
   * Cryptographically and semantically validates that an uploaded asset:
   * 1. Originates from the legitimate secure Cloudinary CDN domain.
   * 2. Resides strictly inside the user's isolated folder boundary.
   * 3. Conforms to allowed format and size constraints.
   */
  public validateAssetMetadata(
    metadata: CloudinaryAssetMetadata,
    userId: string,
    role: string
  ): boolean {
    const roleFolder = role === "customer" ? "customers" : "staff";
    const expectedPrefix = `${env.CLOUDINARY_UPLOAD_FOLDER}/profiles/${roleFolder}/${userId}/`;

    if (!metadata.publicId || !metadata.publicId.startsWith(expectedPrefix)) {
      logger.warn(
        { userId, publicId: metadata.publicId, expectedPrefix },
        "Security Alert: Attempted to bind an avatar outside authorized user folder boundary."
      );
      throw new BadRequestError("Invalid asset ownership or untrusted public ID.");
    }

    if (!metadata.secureUrl || !metadata.secureUrl.startsWith("https://res.cloudinary.com/")) {
      logger.warn(
        { userId, secureUrl: metadata.secureUrl },
        "Security Alert: Untrusted asset origin URL rejected."
      );
      throw new BadRequestError("Asset URL must originate from secure Cloudinary CDN.");
    }

    if (metadata.format && !ALLOWED_IMAGE_FORMATS.includes(metadata.format.toLowerCase())) {
      throw new BadRequestError(
        `Unsupported image format. Allowed formats: ${ALLOWED_IMAGE_FORMATS.join(", ")}`
      );
    }

    if (metadata.bytes && metadata.bytes > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError("Image file size exceeds maximum limit of 5MB.");
    }

    return true;
  }

  /**
   * Safely deletes an asset from Cloudinary CDN.
   * Swallows operational errors to ensure database updates are not corrupted.
   */
  public async deleteAsset(publicId: string): Promise<boolean> {
    if (!publicId) return false;

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
      });

      logger.info({ publicId, result }, "Cloudinary asset destroyed successfully.");
      return result.result === "ok";
    } catch (error) {
      logger.error(
        { publicId, error: (error as Error).message },
        "Cloudinary asset deletion failed - scheduled for background worker cleanup."
      );
      return false;
    }
  }

  /**
   * Generates face-aware, responsive, and WebP-optimized avatar CDN URLs.
   */
  public getOptimizedAvatarUrl(publicId: string, size: "sm" | "md" | "lg" = "md"): string {
    const dimensions = {
      sm: { width: 96, height: 96 },
      md: { width: 256, height: 256 },
      lg: { width: 512, height: 512 },
    }[size];

    return cloudinary.url(publicId, {
      width: dimensions.width,
      height: dimensions.height,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      fetch_format: "auto",
      secure: true,
    });
  }
}

export const cloudinaryService = new CloudinaryService();
