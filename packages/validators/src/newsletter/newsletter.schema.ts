import { z } from "zod";
import { emailSchema } from "../common/email.schema";

export const newsletterSubscribeSchema = z.object({
  email: emailSchema,
  consent: z.literal(true),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
