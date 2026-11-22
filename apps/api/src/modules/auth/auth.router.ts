import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../middleware/validate-request";
import { requireAuth } from "../../middleware/auth";
import { authRateLimiter, otpRateLimiter } from "../../middleware/rate-limiter";
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
  authRateLimiter,
  validateRequest({ body: registerSchema }),
  authController.register.bind(authController)
);

router.post(
  "/verify-email",
  otpRateLimiter,
  validateRequest({ body: verifyOtpSchema }),
  authController.verifyEmail.bind(authController)
);

router.post(
  "/resend-otp",
  otpRateLimiter,
  validateRequest({ body: resendOtpSchema }),
  authController.resendOtp.bind(authController)
);

router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.login.bind(authController)
);

router.post(
  "/admin/login",
  authRateLimiter,
  validateRequest({ body: loginSchema }),
  authController.adminLogin.bind(authController)
);

router.post("/refresh", authController.refreshTokens.bind(authController));

router.post("/logout", authController.logout.bind(authController));

router.post(
  "/forgot-password",
  otpRateLimiter,
  validateRequest({ body: forgotPasswordSchema }),
  authController.forgotPassword.bind(authController)
);

router.post(
  "/reset-password",
  otpRateLimiter,
  validateRequest({ body: resetPasswordSchema }),
  authController.resetPassword.bind(authController)
);

// Protected Authentication Endpoints
router.get("/me", requireAuth, authController.getMe.bind(authController));

router.get("/sessions", requireAuth, authController.getSessions.bind(authController));

router.delete(
  "/sessions/:sessionId",
  requireAuth,
  authController.revokeSession.bind(authController)
);

export const authRouter = router;
