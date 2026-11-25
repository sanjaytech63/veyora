import { NextFunction, Request, Response } from "express";
import { ApiNewsletterCode } from "@veyora/types";
import { NewsletterSubscribeInput } from "@veyora/validators";
import { sendSuccess } from "../../../utils/response";
import { newsletterService } from "../services/newsletter.service";

export class NewsletterController {
  public async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as unknown as NewsletterSubscribeInput;
      const result = await newsletterService.subscribe(input);

      sendSuccess(res, {
        statusCode: 201,
        code: ApiNewsletterCode.NEWSLETTER_SUBSCRIBED,
        message: "Your newsletter subscription request was received and recorded.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const newsletterController = new NewsletterController();
