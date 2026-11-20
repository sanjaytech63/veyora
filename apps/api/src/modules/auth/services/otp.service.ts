import crypto from "crypto";
import { Otp } from "../models/otp.model";
import { OtpType } from "@veyora/types";
import { env } from "../../../config/env";
import { BadRequestError } from "@veyora/utils";

export class OtpService {
  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
  }

  async saveOtp(email: string, otp: string, type: OtpType): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = this.hashOtp(otp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_IN_MINUTES * 60 * 1000);

    // Delete any existing active OTP for this email & type
    await Otp.deleteMany({ email: normalizedEmail, type });

    await Otp.create({
      email: normalizedEmail,
      otpHash,
      type,
      attempts: 0,
      maxAttempts: env.OTP_MAX_ATTEMPTS,
      expiresAt,
    });
  }

  async verifyOtp(email: string, otp: string, type: OtpType): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({ email: normalizedEmail, type });

    if (!otpRecord) {
      throw new BadRequestError("Invalid or expired OTP. Please request a new code.");
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new BadRequestError("OTP has expired. Please request a new code.");
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new BadRequestError("Maximum OTP attempts exceeded. Please request a new code.");
    }

    const providedHash = this.hashOtp(otp);
    if (providedHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      const remaining = otpRecord.maxAttempts - otpRecord.attempts;
      throw new BadRequestError(`Invalid OTP code. ${remaining} attempt(s) remaining.`);
    }

    // Success -> delete record to prevent replay
    await Otp.deleteOne({ _id: otpRecord._id });
    return true;
  }
}

export const otpService = new OtpService();
