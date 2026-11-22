import { CarrierType } from "@veyora/types";
import { IShippingProvider } from "./shipping-provider.interface";
import { MockLogisticsProvider } from "./mock-logistics.provider";

export class ShippingProviderRegistry {
  private static instance: ShippingProviderRegistry;
  private providers: Map<string, IShippingProvider> = new Map();

  private constructor() {
    // Default providers
    this.register(new MockLogisticsProvider("delhivery", "Delhivery Express"));
    this.register(new MockLogisticsProvider("shiprocket", "Shiprocket Air"));
    this.register(new MockLogisticsProvider("bluedart", "Blue Dart Apex"));
    this.register(new MockLogisticsProvider("fedex", "FedEx Priority"));
    this.register(new MockLogisticsProvider("custom", "Veyora White-Glove Valet"));
  }

  public static getInstance(): ShippingProviderRegistry {
    if (!ShippingProviderRegistry.instance) {
      ShippingProviderRegistry.instance = new ShippingProviderRegistry();
    }
    return ShippingProviderRegistry.instance;
  }

  public register(provider: IShippingProvider): void {
    this.providers.set(provider.carrierCode.toLowerCase(), provider);
  }

  public getProvider(carrierCode?: CarrierType | string): IShippingProvider {
    if (!carrierCode) {
      return this.providers.get("delhivery")!;
    }
    const provider = this.providers.get(carrierCode.toLowerCase());
    return provider || this.providers.get("delhivery")!;
  }
}

export const providerRegistry = ShippingProviderRegistry.getInstance();
