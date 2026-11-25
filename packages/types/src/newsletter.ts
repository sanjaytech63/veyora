export type NewsletterSubscriptionStatus = "pending" | "active" | "unsubscribed";

export interface NewsletterSubscriptionDto {
  id: string;
  email: string;
  status: NewsletterSubscriptionStatus;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscribePayload {
  email: string;
  consent: true;
}

export interface NewsletterSubscribeResult {
  accepted: true;
  status: "pending";
}
