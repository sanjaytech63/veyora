import { AuthUser } from "@veyora/types";
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      requestId?: string;
      user?: AuthUser;
      sessionId?: string;
      guestId?: string;
      rawBody?: string;
      log?: Logger;
    }
  }
}

export {};
