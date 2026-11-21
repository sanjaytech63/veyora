import { IPaymentProvider } from "./payment-provider.interface";
import { RazorpayPaymentProvider } from "./razorpay.provider";
import { PaymentProvider } from "@veyora/types";
import { BadRequestError } from "@veyora/utils";

export class PaymentProviderFactory {
  private static razorpayInstance: RazorpayPaymentProvider | null = null;

  public static getProvider(provider: PaymentProvider = "razorpay"): IPaymentProvider {
    switch (provider) {
      case "razorpay":
        if (!this.razorpayInstance) {
          this.razorpayInstance = new RazorpayPaymentProvider();
        }
        return this.razorpayInstance;
      default:
        throw new BadRequestError(`Unsupported payment provider: "${provider}"`);
    }
  }

  // Allow test mocking injection
  public static setProvider(provider: PaymentProvider, instance: IPaymentProvider): void {
    if (provider === "razorpay") {
      this.razorpayInstance = instance as RazorpayPaymentProvider;
    }
  }

  public static reset(): void {
    this.razorpayInstance = null;
  }
}
