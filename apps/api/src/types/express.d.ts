import { AuthUser } from "@veyora/types";

declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: AuthUser;
      sessionId?: string;
      guestId?: string;
    }
  }
}

export {};
