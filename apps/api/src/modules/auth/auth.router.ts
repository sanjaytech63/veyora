import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validate-request";
import { requireAuth } from "../../middleware/auth";
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@veyora/validators";

const router = Router();

// Public Authentication Endpoints
router.post(
  "/register",
  validateRequest({ body: registerSchema }),
  authController.register.bind(authController)
);

router.post(
  "/verify-email",
  validateRequest({ body: verifyOtpSchema }),
  authController.verifyEmail.bind(authController)
);

router.post(
  "/resend-otp",
  validateRequest({ body: resendOtpSchema }),
  authController.resendOtp.bind(authController)
);

router.post(
  "/login",
  validateRequest({ body: loginSchema }),
  authController.login.bind(authController)
);

router.post(
  "/admin/login",
  validateRequest({ body: loginSchema }),
  authController.adminLogin.bind(authController)
);

router.post(
  "/refresh",
  authController.refreshTokens.bind(authController)
);

router.post(
  "/logout",
  authController.logout.bind(authController)
);

router.post(
  "/forgot-password",
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword.bind(authController)
);

router.post(
  "/reset-password",
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword.bind(authController)
);

// Protected Authentication Endpoints
router.get(
  "/me",
  requireAuth,
  authController.getMe.bind(authController)
);

router.get(
  "/sessions",
  requireAuth,
  authController.getSessions.bind(authController)
);

router.delete(
  "/sessions/:sessionId",
  requireAuth,
  authController.revokeSession.bind(authController)
);

export const authRouter = router;
