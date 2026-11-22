import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

logger.info(
  { cloudName: env.CLOUDINARY_CLOUD_NAME },
  "Cloudinary infrastructure initialized successfully."
);

export { cloudinary };
