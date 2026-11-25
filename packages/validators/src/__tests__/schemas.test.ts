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
  // Inventory
  adjustStockSchema,
  reserveStockSchema,
  releaseReservationSchema,
  commitReservationSchema,
  updateThresholdSchema,
  inventoryQuerySchema,
  // Env
  apiEnvSchema,
  webEnvSchema,
  // Reviews
  createReviewSchema,
  moderateReviewSchema,
  reviewQuerySchema,
  adminReviewQuerySchema,
  // Shipping
  calculateShippingSchema,
  createShipmentSchema,
  updateShipmentTrackingSchema,
  shipmentStatusEnum,
  createShippingZoneSchema,
  createShippingMethodSchema,
  // Notifications
  notificationTypeEnum,
  createNotificationSchema,
  notificationListQuerySchema,
  markNotificationReadSchema,
  // Analytics
  analyticsPeriodEnum,
  dashboardQuerySchema,
  // RBAC
  standardPermissionEnum,
  createRoleSchema,
  updateRoleSchema,
  createStaffUserSchema,
  updateStaffUserSchema,
  assignRolesSchema,
  assignPermissionsSchema,
  // Search
  searchSortEnum,
  searchQuerySchema,
  searchSuggestionQuerySchema,
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
      expect(loginSchema.safeParse({ email: "bob@example.com", password: "pwd" }).success).toBe(
        true
      );
      expect(loginSchema.safeParse({ email: "bob@example.com", password: "" }).success).toBe(false);
    });

    it("verifyOtpSchema enforces exact 6 digit numeric code", () => {
      expect(verifyOtpSchema.safeParse({ email: "test@example.com", otp: "123456" }).success).toBe(
        true
      );
      expect(verifyOtpSchema.safeParse({ email: "test@example.com", otp: "12345" }).success).toBe(
        false
      );
      expect(verifyOtpSchema.safeParse({ email: "test@example.com", otp: "abcdef" }).success).toBe(
        false
      );
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
          {
            size: "Standard",
            color: "Matte Black",
            sku: "MOU-WL-001-BLK",
            price: 49.99,
            stock: 60,
          },
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
      expect(checkoutSessionSchema.safeParse({ ...checkoutPayload, items: [] }).success).toBe(
        false
      );
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
      expect(
        createOrderSchema.safeParse({ ...orderPayload, paymentMethod: "crypto" }).success
      ).toBe(false);
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
      expect(
        stripeWebhookHeaderSchema.safeParse({ "stripe-signature": "t=123,v1=abc" }).success
      ).toBe(true);
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

  describe("Inventory Schemas", () => {
    it("adjustStockSchema validates increase, decrease, and correction operations", () => {
      const validIncrease = {
        sku: "PROD-SKU-01",
        type: "increase",
        quantity: 50,
        reason: "Supplier shipment PO-9921",
      };
      expect(adjustStockSchema.safeParse(validIncrease).success).toBe(true);

      const validCorrection = {
        sku: "PROD-SKU-01",
        type: "correction",
        quantity: 0,
        reason: "Physical count reconciliation",
      };
      expect(adjustStockSchema.safeParse(validCorrection).success).toBe(true);

      // Rejects negative quantity
      expect(adjustStockSchema.safeParse({ ...validIncrease, quantity: -5 }).success).toBe(false);

      // Rejects empty reason
      expect(adjustStockSchema.safeParse({ ...validIncrease, reason: "" }).success).toBe(false);

      // Rejects invalid type
      expect(adjustStockSchema.safeParse({ ...validIncrease, type: "unsupported" }).success).toBe(
        false
      );
    });

    it("reserveStockSchema and releaseReservationSchema enforce positive quantities", () => {
      const validReserve = {
        sku: "IPHONE-15-PRO",
        quantity: 2,
        referenceId: "ORDER-7721",
      };
      expect(reserveStockSchema.safeParse(validReserve).success).toBe(true);
      expect(releaseReservationSchema.safeParse(validReserve).success).toBe(true);
      expect(commitReservationSchema.safeParse(validReserve).success).toBe(true);

      expect(reserveStockSchema.safeParse({ ...validReserve, quantity: 0 }).success).toBe(false);
      expect(reserveStockSchema.safeParse({ ...validReserve, referenceId: "" }).success).toBe(
        false
      );
    });

    it("updateThresholdSchema accepts valid non-negative thresholds", () => {
      expect(updateThresholdSchema.safeParse({ lowStockThreshold: 10 }).success).toBe(true);
      expect(updateThresholdSchema.safeParse({ lowStockThreshold: 0 }).success).toBe(true);
      expect(updateThresholdSchema.safeParse({ lowStockThreshold: -1 }).success).toBe(false);
    });

    it("inventoryQuerySchema parses defaults and filter params", () => {
      const parsed = inventoryQuerySchema.parse({
        page: "2",
        limit: "15",
        status: "low_stock",
        lowStockOnly: "true",
      });
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(15);
      expect(parsed.status).toBe("low_stock");
      expect(parsed.lowStockOnly).toBe(true);
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

    it("apiEnvSchema rejects default fallback secrets in production mode", () => {
      const prodWithDefaults = {
        NODE_ENV: "production",
      };
      const result = apiEnvSchema.safeParse(prodWithDefaults);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issues = result.error.issues.map((i) => i.path[0]);
        expect(issues).toContain("JWT_ACCESS_SECRET");
        expect(issues).toContain("JWT_REFRESH_SECRET");
        expect(issues).toContain("COOKIE_SECRET");
        expect(issues).toContain("CORS_ORIGIN");
        expect(issues).toContain("RAZORPAY_KEY_ID");
        expect(issues).toContain("RAZORPAY_KEY_SECRET");
        expect(issues).toContain("RAZORPAY_WEBHOOK_SECRET");
        expect(issues).toContain("CLOUDINARY_CLOUD_NAME");
        expect(issues).toContain("CLOUDINARY_API_KEY");
        expect(issues).toContain("CLOUDINARY_API_SECRET");
      }

      // Passes when custom production secrets provided
      const prodValid = {
        NODE_ENV: "production",
        JWT_ACCESS_SECRET: "a_very_strong_custom_production_jwt_access_secret_123",
        JWT_REFRESH_SECRET: "a_very_strong_custom_production_jwt_refresh_secret_123",
        COOKIE_SECRET: "a_very_strong_cookie_secret_123",
        CORS_ORIGIN: "https://veyora.luxury,https://admin.veyora.luxury",
        RAZORPAY_KEY_ID: "rzp_live_production_key",
        RAZORPAY_KEY_SECRET: "production_razorpay_secret",
        RAZORPAY_WEBHOOK_SECRET: "production_razorpay_webhook_secret",
        CLOUDINARY_CLOUD_NAME: "veyora-production",
        CLOUDINARY_API_KEY: "production_cloudinary_key",
        CLOUDINARY_API_SECRET: "production_cloudinary_secret",
      };
      expect(apiEnvSchema.safeParse(prodValid).success).toBe(true);
    });
  });

  describe("Product Review Schemas", () => {
    it("createReviewSchema validates ratings between 1 and 5 and enforces title/comment length", () => {
      const validReview = {
        rating: 5,
        title: "Exquisite mulmul fabric",
        comment: "The craftsmanship and softness are extraordinary. Perfect festive wear.",
      };
      expect(createReviewSchema.safeParse(validReview).success).toBe(true);

      // Rejects rating 0 or 6
      expect(createReviewSchema.safeParse({ ...validReview, rating: 0 }).success).toBe(false);
      expect(createReviewSchema.safeParse({ ...validReview, rating: 6 }).success).toBe(false);

      // Rejects empty or too short comment
      expect(createReviewSchema.safeParse({ ...validReview, comment: "bad" }).success).toBe(false);
    });

    it("moderateReviewSchema allows approved, rejected, pending statuses", () => {
      expect(moderateReviewSchema.safeParse({ status: "approved" }).success).toBe(true);
      expect(
        moderateReviewSchema.safeParse({
          status: "rejected",
          rejectionReason: "Inappropriate language in review body",
        }).success
      ).toBe(true);
      expect(moderateReviewSchema.safeParse({ status: "unknown" }).success).toBe(false);
    });

    it("reviewQuerySchema and adminReviewQuerySchema apply defaults and sorting", () => {
      const query = reviewQuerySchema.parse({});
      expect(query.page).toBe(1);
      expect(query.limit).toBe(10);
      expect(query.sort).toBe("newest");

      const adminQuery = adminReviewQuerySchema.parse({
        status: "pending",
        rating: "4",
      });
      expect(adminQuery.status).toBe("pending");
      expect(adminQuery.rating).toBe(4);
      expect(adminQuery.sortBy).toBe("createdAt");
      expect(adminQuery.sortOrder).toBe("desc");
    });
  });

  describe("Shipping Schemas", () => {
    it("calculateShippingSchema validates destination address and cart subtotal", () => {
      const validCalc = {
        destinationPostalCode: "302001",
        destinationCountry: "IN",
        destinationState: "Rajasthan",
        subtotal: 185.0,
        items: [{ productId: "prod-1", quantity: 2, weightGrams: 500 }],
      };
      expect(calculateShippingSchema.safeParse(validCalc).success).toBe(true);
      expect(calculateShippingSchema.safeParse({ ...validCalc, subtotal: -10 }).success).toBe(
        false
      );
      expect(
        calculateShippingSchema.safeParse({ ...validCalc, destinationPostalCode: "1" }).success
      ).toBe(false);
    });

    it("createShipmentSchema and updateShipmentTrackingSchema validate carrier tracking lifecycle", () => {
      const shipment = {
        orderId: "6b02bc89574f487cd44a76f2",
        carrier: "delhivery",
        trackingNumber: "DEL1234567890",
        notes: "Fragile silk garment packaging",
      };
      expect(createShipmentSchema.safeParse(shipment).success).toBe(true);

      expect(shipmentStatusEnum.safeParse("in_transit").success).toBe(true);
      expect(shipmentStatusEnum.safeParse("out_for_delivery").success).toBe(true);
      expect(shipmentStatusEnum.safeParse("delivered").success).toBe(true);
      expect(shipmentStatusEnum.safeParse("invalid_status").success).toBe(false);

      expect(
        updateShipmentTrackingSchema.safeParse({
          status: "in_transit",
          location: "Jaipur Sorting Hub",
          description: "Package departed fulfillment facility",
        }).success
      ).toBe(true);
    });

    it("createShippingZoneSchema and createShippingMethodSchema validate logistics configuration", () => {
      const zone = {
        name: "North India Domestic",
        code: "ZONE-NORTH-IN",
        countries: ["IN"],
        states: ["Rajasthan", "Delhi", "Punjab"],
      };
      expect(createShippingZoneSchema.safeParse(zone).success).toBe(true);

      const method = {
        code: "EXPRESS-AIR",
        name: "Express Courier Delivery",
        rate: 15.0,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      };
      expect(createShippingMethodSchema.safeParse(method).success).toBe(true);
    });
  });

  describe("Notification Schemas", () => {
    it("notificationTypeEnum validates supported notification categories", () => {
      expect(notificationTypeEnum.safeParse("order").success).toBe(true);
      expect(notificationTypeEnum.safeParse("payment").success).toBe(true);
      expect(notificationTypeEnum.safeParse("shipping").success).toBe(true);
      expect(notificationTypeEnum.safeParse("unsupported").success).toBe(false);
    });

    it("createNotificationSchema and markNotificationReadSchema validate payloads", () => {
      const notif = {
        userId: "user-991",
        type: "order",
        title: "Order Confirmed",
        message: "Your order #VYR-8831 has been placed.",
        data: { orderId: "ord-8831" },
      };
      expect(createNotificationSchema.safeParse(notif).success).toBe(true);
      expect(createNotificationSchema.safeParse({ ...notif, title: "" }).success).toBe(false);

      expect(markNotificationReadSchema.safeParse({ notificationId: "notif-01" }).success).toBe(
        true
      );
      expect(markNotificationReadSchema.safeParse({ notificationId: "" }).success).toBe(false);
    });

    it("notificationListQuerySchema transforms unreadOnly string to boolean", () => {
      const parsedUnread = notificationListQuerySchema.parse({ unreadOnly: "true" });
      expect(parsedUnread.unreadOnly).toBe(true);

      const parsedAll = notificationListQuerySchema.parse({ unreadOnly: "false" });
      expect(parsedAll.unreadOnly).toBe(false);
    });
  });

  describe("Analytics Schemas", () => {
    it("analyticsPeriodEnum supports standard dashboard reporting windows", () => {
      expect(analyticsPeriodEnum.safeParse("today").success).toBe(true);
      expect(analyticsPeriodEnum.safeParse("7d").success).toBe(true);
      expect(analyticsPeriodEnum.safeParse("30d").success).toBe(true);
      expect(analyticsPeriodEnum.safeParse("90d").success).toBe(true);
      expect(analyticsPeriodEnum.safeParse("12m").success).toBe(true);
      expect(analyticsPeriodEnum.safeParse("custom").success).toBe(true);
      expect(analyticsPeriodEnum.safeParse("invalid_period").success).toBe(false);
    });

    it("dashboardQuerySchema applies default period and validates ISO date bounds", () => {
      const defaultQuery = dashboardQuerySchema.parse({});
      expect(defaultQuery.period).toBe("30d");
      expect(defaultQuery.limit).toBe(5);

      const customQuery = dashboardQuerySchema.safeParse({
        period: "custom",
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2026-01-31T23:59:59.000Z",
      });
      expect(customQuery.success).toBe(true);

      const invalidDateQuery = dashboardQuerySchema.safeParse({
        period: "custom",
        startDate: "not-a-date",
      });
      expect(invalidDateQuery.success).toBe(false);
    });
  });

  describe("RBAC & Staff Authorization Schemas", () => {
    it("standardPermissionEnum encompasses all core domain privileges", () => {
      expect(standardPermissionEnum.safeParse("products:read").success).toBe(true);
      expect(standardPermissionEnum.safeParse("products:write").success).toBe(true);
      expect(standardPermissionEnum.safeParse("inventory:write").success).toBe(true);
      expect(standardPermissionEnum.safeParse("orders:cancel").success).toBe(true);
      expect(standardPermissionEnum.safeParse("analytics:read").success).toBe(true);
      expect(standardPermissionEnum.safeParse("staff:write").success).toBe(true);
      expect(standardPermissionEnum.safeParse("arbitrary:hack").success).toBe(false);
    });

    it("createRoleSchema validates lowercase slug name and non-empty permissions", () => {
      const validRole = {
        name: "catalog-manager",
        displayName: "Catalog Manager",
        description: "Manages products and inventory",
        permissions: ["products:read", "products:write", "inventory:read"],
      };
      expect(createRoleSchema.safeParse(validRole).success).toBe(true);

      // Rejects uppercase characters in role slug
      expect(createRoleSchema.safeParse({ ...validRole, name: "Catalog_Manager" }).success).toBe(
        false
      );

      // Rejects empty permissions
      expect(createRoleSchema.safeParse({ ...validRole, permissions: [] }).success).toBe(false);

      expect(
        updateRoleSchema.safeParse({
          displayName: "Catalog Lead",
          permissions: ["products:read"],
        }).success
      ).toBe(true);
    });

    it("createStaffUserSchema and updateStaffUserSchema validate staff credentials", () => {
      const staffUser = {
        email: "staff.ops@veyora.com",
        firstName: "Ananya",
        lastName: "Sharma",
        role: "admin",
      };
      expect(createStaffUserSchema.safeParse(staffUser).success).toBe(true);

      expect(
        updateStaffUserSchema.safeParse({
          firstName: "Ananya Updated",
          isActive: false,
        }).success
      ).toBe(true);
    });

    it("assignRolesSchema and assignPermissionsSchema enforce non-empty assignments", () => {
      expect(assignRolesSchema.safeParse({ roleIds: ["role-1"] }).success).toBe(true);
      expect(assignRolesSchema.safeParse({ roleIds: [] }).success).toBe(false);

      expect(assignPermissionsSchema.safeParse({ permissions: ["products:read"] }).success).toBe(
        true
      );
    });
  });

  describe("Search & SEO Schemas", () => {
    it("searchSortEnum supports relevancy and price sort keys", () => {
      expect(searchSortEnum.safeParse("relevance").success).toBe(true);
      expect(searchSortEnum.safeParse("price_asc").success).toBe(true);
      expect(searchSortEnum.safeParse("price_desc").success).toBe(true);
      expect(searchSortEnum.safeParse("newest").success).toBe(true);
      expect(searchSortEnum.safeParse("unsupported_sort").success).toBe(false);
    });

    it("searchQuerySchema parses faceted query strings and coerces numbers and booleans", () => {
      const parsed = searchQuerySchema.parse({
        q: "Chanderi Silk",
        minPrice: "50",
        maxPrice: "300",
        inStock: "true",
        minRating: "4",
        sortBy: "price_asc",
        page: "2",
        limit: "24",
      });

      expect(parsed.q).toBe("Chanderi Silk");
      expect(parsed.minPrice).toBe(50);
      expect(parsed.maxPrice).toBe(300);
      expect(parsed.inStock).toBe(true);
      expect(parsed.minRating).toBe(4);
      expect(parsed.sortBy).toBe("price_asc");
      expect(parsed.page).toBe(2);
      expect(parsed.limit).toBe(24);
    });

    it("searchSuggestionQuerySchema enforces query parameter presence", () => {
      expect(searchSuggestionQuerySchema.safeParse({ q: "kurt" }).success).toBe(true);
      expect(searchSuggestionQuerySchema.safeParse({ q: "" }).success).toBe(false);
      expect(searchSuggestionQuerySchema.safeParse({}).success).toBe(false);
    });
  });
});
