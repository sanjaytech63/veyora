import { Router } from "express";
import { profileController } from "./profile.controller";
import { requireAuth } from "../../middleware/auth";
import { validateRequest } from "../../middleware/validate-request";
import { updateProfileSchema, updateAvatarSchema } from "@veyora/validators";

const router = Router();

// Profile Endpoints (Self-service authenticated user scope)
router.get("/profile", requireAuth, profileController.getProfile.bind(profileController));

router.patch(
  "/profile",
  requireAuth,
  validateRequest({ body: updateProfileSchema }),
  profileController.updateProfile.bind(profileController)
);

router.post(
  "/profile/avatar/upload-signature",
  requireAuth,
  profileController.getAvatarUploadSignature.bind(profileController)
);

router.patch(
  "/profile/avatar",
  requireAuth,
  validateRequest({ body: updateAvatarSchema }),
  profileController.updateAvatar.bind(profileController)
);

router.delete(
  "/profile/avatar",
  requireAuth,
  profileController.removeAvatar.bind(profileController)
);

router.get(
  "/profile/completion",
  requireAuth,
  profileController.getProfileCompletion.bind(profileController)
);

export const profileRouter = router;
