import { describe, it, expect } from "vitest";
import {
  // Common
  paginationQuerySchema,
  idParamSchema,
  mongoIdSchema,
  slugSchema,
  emailSchema,
  addressSchema,
  // Auth
  passwordSchema,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  // Products
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createCategorySchema,
  createBrandSchema,
  // Cart & Checkout
  addToCartSchema,
  updateCartItemSchema,
  checkoutSessionSchema,
  // Orders & Payments
  createOrderSchema,
  createPaymentIntentSchema,
  stripeWebhookHeaderSchema,
  // Coupons & Customers & Admin
  applyCouponSchema,
  createCouponSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  // Env
  apiEnvSchema,
  webEnvSchema,
} from "../index";

describe("Centralized Zod Validation Suite", () => {
  describe("Common Schemas", () => {
    it("paginationQuerySchema coerces numbers and provides defaults", () => {
      const parsed = paginationQuerySchema.parse({
        page: "2",
        limit: "50",
        sortBy: "createdAt",
        sortOrder: "asc",
      });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(50);
      expect(parsed.sortOrder).toBe("asc");

      const defaultParsed = paginationQuerySchema.parse({});
      expect(defaultParsed.page).toBe(1);
      expect(defaultParsed.limit).toBe(20);
      expect(defaultParsed.sortOrder).toBe("desc");
    });

    it("idParamSchema and mongoIdSchema validate identifiers", () => {
      expect(idParamSchema.safeParse({ id: "valid-id-123" }).success).toBe(true);
      expect(idParamSchema.safeParse({ id: "" }).success).toBe(false);

      expect(mongoIdSchema.safeParse("507f1f77bcf86cd799439011").success).toBe(true);
      expect(mongoIdSchema.safeParse("not-a-mongo-id").success).toBe(false);

      expect(slugSchema.safeParse("running-shoes-pro-2").success).toBe(true);
      expect(slugSchema.safeParse("Running Shoes").success).toBe(false);
    });

    it("emailSchema trims and lowercases emails", () => {
      const email = emailSchema.parse("  USER@Example.COM  ");
      expect(email).toBe("user@example.com");

      expect(emailSchema.safeParse("invalid-email-address").success).toBe(false);
    });

    it("addressSchema validates postal and street fields", () => {
      const validAddress = {
        street: "123 Market St",
        city: "San Francisco",
        state: "CA",
        postalCode: "94103",
        country: "USA",
      };
      expect(addressSchema.safeParse(validAddress).success).toBe(true);
      expect(addressSchema.safeParse({ ...validAddress, street: "" }).success).toBe(false);
    });
  });

  describe("Authentication Schemas", () => {
    it("passwordSchema enforces complexity rules", () => {
      expect(passwordSchema.safeParse("ValidPass123!").success).toBe(true);
      expect(passwordSchema.safeParse("short1!").success).toBe(false); // < 8 chars
      expect(passwordSchema.safeParse("alllowercase123!").success).toBe(false); // no uppercase
      expect(passwordSchema.safeParse("ALLUPPERCASE123!").success).toBe(false); // no lowercase
      expect(passwordSchema.safeParse("NoNumbersHere!").success).toBe(false); // no numbers
      expect(passwordSchema.safeParse("NoSymbols12345").success).toBe(false); // no special chars
    });

    it("registerSchema validates full registration payloads", () => {
      const payload = {
        email: "alice@example.com",
        password: "StrongPassword123!",
        firstName: "Alice",
        lastName: "Smith",
      };
      expect(registerSchema.safeParse(payload).success).toBe(true);
      expect(registerSchema.safeParse({ ...payload, email: "invalid" }).success).toBe(false);
    });

    it("loginSchema accepts valid email and non-empty password", () => {
      expect(loginSchema.safeParse({ email: "bob@example.com", password: "pwd" }).success).toBe(true);
      expect(loginSchema.safeParse({ email: "bob@example.com", password: "" }).success).toBe(false);
    });

    it("verifyOtpSchema enforces exact 6 digit numeric code", () => {
      expect(verifyOtpSchema.safeParse({ email: "test@example.com", otp: "123456" }).success).toBe(true);
      expect(verifyOtpSchema.safeParse({ email: "test@example.com", otp: "12345" }).success).toBe(false);
      expect(verifyOtpSchema.safeParse({ email: "test@example.com", otp: "abcdef" }).success).toBe(false);
    });

    it("resetPasswordSchema validates token and new password", () => {
      expect(
        resetPasswordSchema.safeParse({
          email: "user@example.com",
          otp: "654321",
          newPassword: "BrandNewPassword123!",
        }).success
      ).toBe(true);
    });
  });

  describe("Products & Catalog Schemas", () => {
    it("createProductSchema validates required product catalog fields", () => {
      const validProduct = {
        title: "Wireless Ergonomic Mouse",
        description: "High performance rechargeable ergonomic wireless mouse with silent clicks.",
        price: 49.99,
        sku: "MOU-WL-001",
        stock: 120,
        categoryId: "cat-electronics-123",
        variants: [
          { size: "Standard", color: "Matte Black", sku: "MOU-WL-001-BLK", price: 49.99, stock: 60 },
        ],
        images: [{ url: "https://example.com/mouse.jpg", alt: "Mouse top view", isPrimary: true }],
      };
      const parsed = createProductSchema.parse(validProduct);
      expect(parsed.price).toBe(49.99);
      expect(parsed.sku).toBe("MOU-WL-001");
      expect(parsed.stock).toBe(120);
      expect(parsed.status).toBe("draft"); // default
      expect(parsed.variants).toHaveLength(1);
    });

    it("createCategorySchema and createBrandSchema validate metadata", () => {
      const category = createCategorySchema.parse({
        name: "Laptops & Computers",
        description: "High performance computing hardware",
      });
      expect(category.status).toBe("active");
      expect(category.order).toBe(0);

      const brand = createBrandSchema.parse({
        name: "Logitech",
        website: "https://www.logitech.com",
      });
      expect(brand.status).toBe("active");
    });

    it("createProductSchema rejects negative prices or zero stock errors", () => {
      const invalidProduct = {
        title: "Item",
        description: "Valid description longer than 10 characters",
        price: -10,
        sku: "ITEM-01",
        categoryId: "cat-1",
      };
      expect(createProductSchema.safeParse(invalidProduct).success).toBe(false);
    });

    it("updateProductSchema allows partial field updates", () => {
      expect(updateProductSchema.safeParse({ price: 39.99 }).success).toBe(true);
      expect(updateProductSchema.safeParse({ title: "Updated Title" }).success).toBe(true);
      expect(updateProductSchema.safeParse({ price: -5 }).success).toBe(false);
    });

    it("productQuerySchema coerces inStock boolean and numeric filters", () => {
      const parsed = productQuerySchema.parse({
        page: "1",
        limit: "10",
        minPrice: "10",
        maxPrice: "100",
        inStock: "true",
      });
      expect(parsed.minPrice).toBe(10);
      expect(parsed.maxPrice).toBe(100);
      expect(parsed.inStock).toBe(true);
    });
  });

  describe("Cart & Checkout Schemas", () => {
    it("addToCartSchema validates item addition with quantity defaults", () => {
      const parsed = addToCartSchema.parse({ productId: "prod-123" });
      expect(parsed.quantity).toBe(1);

      expect(addToCartSchema.safeParse({ productId: "prod-123", quantity: 0 }).success).toBe(false);
    });

    it("updateCartItemSchema allows setting zero quantity (for deletion)", () => {
      expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(true);
      expect(updateCartItemSchema.safeParse({ quantity: -1 }).success).toBe(false);
    });

    it("checkoutSessionSchema validates complete checkout initialization", () => {
      const checkoutPayload = {
        items: [{ productId: "p1", quantity: 2 }],
        shippingAddress: {
          street: "456 Market St",
          city: "Seattle",
          state: "WA",
          postalCode: "98101",
          country: "USA",
        },
        shippingMethodId: "ship_express",
      };
      expect(checkoutSessionSchema.safeParse(checkoutPayload).success).toBe(true);
      expect(checkoutSessionSchema.safeParse({ ...checkoutPayload, items: [] }).success).toBe(false);
    });
  });

  describe("Orders, Payments & Webhooks", () => {
    it("createOrderSchema validates paymentMethod and items", () => {
      const orderPayload = {
        items: [{ productId: "p1", title: "Item 1", quantity: 1, price: 29.99 }],
        shippingAddress: {
          street: "123 Main",
          city: "Austin",
          state: "TX",
          postalCode: "78701",
          country: "USA",
        },
        billingAddress: {
          street: "123 Main",
          city: "Austin",
          state: "TX",
          postalCode: "78701",
          country: "USA",
        },
        paymentMethod: "stripe",
        shippingMethodId: "standard",
      };
      expect(createOrderSchema.safeParse(orderPayload).success).toBe(true);
      expect(createOrderSchema.safeParse({ ...orderPayload, paymentMethod: "crypto" }).success).toBe(false);
    });

    it("createPaymentIntentSchema uppercases ISO currency code", () => {
      const parsed = createPaymentIntentSchema.parse({
        orderId: "ord-123",
        paymentProvider: "stripe",
        currency: "eur",
      });
      expect(parsed.currency).toBe("EUR");
    });

    it("stripeWebhookHeaderSchema requires stripe-signature", () => {
      expect(stripeWebhookHeaderSchema.safeParse({ "stripe-signature": "t=123,v1=abc" }).success).toBe(true);
      expect(stripeWebhookHeaderSchema.safeParse({}).success).toBe(false);
    });
  });

  describe("Coupons, Customer Profile & Admin Schemas", () => {
    it("applyCouponSchema enforces uppercase coupon code", () => {
      const parsed = applyCouponSchema.parse({ code: "save20", cartTotal: "100" });
      expect(parsed.code).toBe("SAVE20");
      expect(parsed.cartTotal).toBe(100);
    });

    it("createCouponSchema validates discount types", () => {
      expect(
        createCouponSchema.safeParse({
          code: "SUMMER50",
          discountType: "percentage",
          discountValue: 50,
        }).success
      ).toBe(true);
    });

    it("changePasswordSchema validates password matching refinement", () => {
      expect(
        changePasswordSchema.safeParse({
          currentPassword: "OldPassword1!",
          newPassword: "NewPassword123!",
          confirmPassword: "NewPassword123!",
        }).success
      ).toBe(true);

      expect(
        changePasswordSchema.safeParse({
          currentPassword: "OldPassword1!",
          newPassword: "NewPassword123!",
          confirmPassword: "DifferentPassword123!",
        }).success
      ).toBe(false);
    });

    it("updateUserRoleSchema enforces valid roles", () => {
      expect(updateUserRoleSchema.safeParse({ role: "admin" }).success).toBe(true);
      expect(updateUserRoleSchema.safeParse({ role: "invalid_role" }).success).toBe(false);
    });
  });

  describe("Environment Schemas", () => {
    it("apiEnvSchema and webEnvSchema validate configurations", () => {
      const apiConfig = apiEnvSchema.parse({});
      expect(apiConfig.PORT).toBe(4000);
      expect(apiConfig.NODE_ENV).toBe("development");

      const webConfig = webEnvSchema.parse({
        NEXT_PUBLIC_API_URL: "https://api.veyora.com/api/v1",
      });
      expect(webConfig.NEXT_PUBLIC_API_URL).toBe("https://api.veyora.com/api/v1");
    });
  });
});
