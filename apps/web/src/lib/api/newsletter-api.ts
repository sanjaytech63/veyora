import { apiClient } from "./api-client";
import { NewsletterSubscribePayload, NewsletterSubscribeResult } from "@veyora/types";

export const newsletterApi = {
  subscribe(payload: NewsletterSubscribePayload): Promise<NewsletterSubscribeResult> {
    return apiClient.post<NewsletterSubscribeResult>("/newsletter/subscribe", payload);
  },
};
