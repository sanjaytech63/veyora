import { NewsletterSubscribeInput } from "@veyora/validators";
import { NewsletterSubscribeResult } from "@veyora/types";
import { NewsletterSubscriptionModel } from "../models/newsletter-subscription.model";

export class NewsletterService {
  public async subscribe(input: NewsletterSubscribeInput): Promise<NewsletterSubscribeResult> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const now = new Date();

    await NewsletterSubscriptionModel.findOneAndUpdate(
      { normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          status: "pending",
          consentAt: now,
          source: "website",
          verificationAt: null,
          unsubscribedAt: null,
        },
        $setOnInsert: {
          normalizedEmail,
          createdAt: now,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return { accepted: true, status: "pending" };
  }
}

export const newsletterService = new NewsletterService();
