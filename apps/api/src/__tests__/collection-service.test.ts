import { describe, it, expect, vi, beforeEach } from "vitest";
import { CollectionService } from "../modules/catalog/services/collection.service";
import { Collection } from "../modules/catalog/models/collection.model";
import { Setting } from "../modules/system/models/setting.model";
import { SystemService } from "../modules/system/system.service";

describe("Collection Service & Dynamic Catalog Management", () => {
  let collectionService: CollectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    collectionService = new CollectionService();
  });

  it("generates a valid slug from name if not provided", async () => {
    vi.spyOn(Collection, "findOne").mockResolvedValue(null);

    const slug = await collectionService.generateUniqueSlug("The Festive Edit 2026");
    expect(slug).toBe("the-festive-edit-2026");
  });

  it("increments slug suffix if duplicate slug exists", async () => {
    vi.spyOn(Collection, "findOne")
      .mockResolvedValueOnce({ _id: "existing-id" } as unknown as null)
      .mockResolvedValueOnce(null);

    const slug = await collectionService.generateUniqueSlug("Festive Edit");
    expect(slug).toBe("festive-edit-1");
  });

  it("creates a collection and maps DTO correctly", async () => {
    vi.spyOn(Collection, "findOne").mockResolvedValue(null);
    const mockCreated = {
      _id: { toString: () => "col-123" },
      name: "Bridal Trousseau",
      slug: "bridal-trousseau",
      tagline: "Heirloom Silks",
      description: "Regal Banarasi brocades",
      season: "Bridal 2026",
      image: "https://images.example.com/bridal.jpg",
      status: "active",
      productIds: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    vi.spyOn(Collection, "create").mockResolvedValue(mockCreated as unknown as never);

    const result = await collectionService.createCollection({
      name: "Bridal Trousseau",
      tagline: "Heirloom Silks",
      description: "Regal Banarasi brocades",
      season: "Bridal 2026",
      image: "https://images.example.com/bridal.jpg",
    });

    expect(result.id).toBe("col-123");
    expect(result.name).toBe("Bridal Trousseau");
    expect(result.productCount).toBe(0);
    expect(result.status).toBe("active");
  });
});

describe("System Settings Service", () => {
  it("initializes default settings if none exist", async () => {
    vi.spyOn(Setting, "findOne").mockResolvedValue(null);
    const mockSetting = {
      storeName: "Veyora Fashion Atelier",
      currency: "USD ($)",
      freeShippingThreshold: 150,
      enableExpress: true,
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    vi.spyOn(Setting, "create").mockResolvedValue(mockSetting as unknown as never);

    const settings = await SystemService.getSettings();
    expect(settings.storeName).toBe("Veyora Fashion Atelier");
    expect(settings.freeShippingThreshold).toBe(150);
  });
});
