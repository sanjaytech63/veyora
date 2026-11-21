import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserPermission } from "@veyora/types";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { User } from "../modules/auth/models/user.model";
import { Brand } from "../modules/catalog/models/brand.model";
import { Category } from "../modules/catalog/models/category.model";
import { Product } from "../modules/catalog/models/product.model";
import { Inventory } from "../modules/inventory/models/inventory.model";
import { StockMovement } from "../modules/inventory/models/stock-movement.model";

const ADMIN_PERMISSIONS: UserPermission[] = [
  "read:users",
  "write:users",
  "read:system",
  "manage:system",
  "manage:catalog",
  "manage:orders",
];

export async function runDatabaseSeed(): Promise<void> {
  logger.info({ uri: env.MONGODB_URI }, "Connecting to MongoDB for database seeding...");
  await mongoose.connect(env.MONGODB_URI);

  try {
    logger.info("Initializing Veyora database seed...");

    // 1. Seed or Verify Users
    const defaultPasswordHash = await bcrypt.hash("Admin@123456", 12);
    const existingAdmin = await User.findOne({ email: "sjat11463@gmail.com" });
    if (!existingAdmin) {
      await User.create({
        email: "sjat11463@gmail.com",
        passwordHash: defaultPasswordHash,
        firstName: "Sanjay",
        lastName: "Admin",
        role: "admin",
        permissions: ADMIN_PERMISSIONS,
        isEmailVerified: true,
        isActive: true,
      });
      logger.info("Created admin user: sjat11463@gmail.com");
    } else {
      existingAdmin.role = "admin";
      existingAdmin.permissions = ADMIN_PERMISSIONS;
      existingAdmin.isEmailVerified = true;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      logger.info("Verified active admin user: sjat11463@gmail.com");
    }

    const adminUser = (await User.findOne({ email: "sjat11463@gmail.com" }))!;

    // 2. Seed Brands
    const brandData = [
      {
        name: "Veyora Atelier",
        slug: "veyora-atelier",
        description: "Minimalist luxury tailoring & bespoke ready-to-wear.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=VEYORA",
        website: "https://veyora.com",
        status: "active" as const,
      },
      {
        name: "Studio Minimal",
        slug: "studio-minimal",
        description: "Essential architectural silhouettes crafted from organic fabrics.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=MINIMAL",
        website: "https://studiominimal.design",
        status: "active" as const,
      },
      {
        name: "Nordcraft",
        slug: "nordcraft",
        description: "Scandinavian technical outerwear and weather-resistant luxury knitwear.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=NORDCRAFT",
        website: "https://nordcraft.co",
        status: "active" as const,
      },
      {
        name: "Élan Maison",
        slug: "elan-maison",
        description: "Modern Parisian leather goods and refined accessories.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=ELAN",
        website: "https://elanmaison.fr",
        status: "active" as const,
      },
    ];

    const brands = new Map<string, mongoose.Types.ObjectId>();
    for (const b of brandData) {
      const brand = await Brand.findOneAndUpdate(
        { slug: b.slug },
        { $set: b },
        { upsert: true, new: true }
      );
      brands.set(b.slug, brand._id);
    }
    logger.info({ count: brands.size }, "Seeded luxury fashion brands");

    // 3. Seed Categories
    const categoryData = [
      {
        name: "Women",
        slug: "women",
        description: "Contemporary luxury womenswear, tailoring and elevated daily essentials.",
        image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
        order: 1,
        status: "active" as const,
      },
      {
        name: "Men",
        slug: "men",
        description: "Architectural menswear, sharp tailoring and technical relaxed wardrobe.",
        image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
        order: 2,
        status: "active" as const,
      },
      {
        name: "Outerwear",
        slug: "outerwear",
        description: "Heavyweight wool overcoats, technical trenches and sculptural jackets.",
        image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&q=80",
        order: 3,
        status: "active" as const,
      },
      {
        name: "Accessories",
        slug: "accessories",
        description: "Handcrafted calfskin bags, minimal belts and refined eyewear.",
        image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80",
        order: 4,
        status: "active" as const,
      },
      {
        name: "Footwear",
        slug: "footwear",
        description: "Italian leather derby shoes, sculptural boots and minimalist sneakers.",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
        order: 5,
        status: "active" as const,
      },
    ];

    const categories = new Map<string, mongoose.Types.ObjectId>();
    for (const c of categoryData) {
      const category = await Category.findOneAndUpdate(
        { slug: c.slug },
        { $set: c },
        { upsert: true, new: true }
      );
      categories.set(c.slug, category._id);
    }
    logger.info({ count: categories.size }, "Seeded curated fashion categories");

    // 4. Seed Products
    const productsToSeed = [
      {
        title: "Cashmere Double-Breasted Overcoat",
        slug: "cashmere-double-breasted-overcoat",
        description:
          "Expertly crafted from 100% Mongolian double-faced cashmere. Features peak lapels, horn buttons, a relaxed drop shoulder silhouette, and satin interior lining.",
        price: 680,
        compareAtPrice: 850,
        costPrice: 320,
        sku: "VYR-CBR-001",
        stock: 45,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("outerwear")!,
        brandId: brands.get("veyora-atelier")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&q=85",
            alt: "Cashmere Double-Breasted Overcoat front view",
            isPrimary: true,
            order: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=85",
            alt: "Cashmere Double-Breasted Overcoat detail view",
            isPrimary: false,
            order: 1,
          },
        ],
        variants: [
          {
            size: "S",
            color: "Midnight Black",
            sku: "VYR-CBR-001-S-BLK",
            price: 680,
            stock: 15,
            image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&q=85",
          },
          {
            size: "M",
            color: "Midnight Black",
            sku: "VYR-CBR-001-M-BLK",
            price: 680,
            stock: 15,
            image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1000&q=85",
          },
          {
            size: "L",
            color: "Camel",
            sku: "VYR-CBR-001-L-CML",
            price: 680,
            stock: 15,
            image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1000&q=85",
          },
        ],
        attributes: [
          { name: "Material", value: "100% Mongolian Cashmere" },
          { name: "Fit", value: "Relaxed tailored fit" },
          { name: "Care", value: "Specialist dry clean only" },
        ],
        tags: ["cashmere", "overcoat", "outerwear", "luxury", "winter"],
        seo: {
          metaTitle: "Cashmere Double-Breasted Overcoat — Veyora",
          metaDescription: "Hand-finished Mongolian double-faced cashmere tailored overcoat.",
          keywords: ["overcoat", "cashmere", "luxury coat"],
        },
      },
      {
        title: "Architectural Heavyweight Trench",
        slug: "architectural-heavyweight-trench",
        description:
          "Constructed from 420gsm waterproof bonded cotton twill. Features storm flaps, waist tie belt, storm collar latch, and tonal matte horn hardware.",
        price: 490,
        compareAtPrice: 590,
        costPrice: 220,
        sku: "VYR-TRN-002",
        stock: 35,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("outerwear")!,
        brandId: brands.get("nordcraft")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=85",
            alt: "Architectural Heavyweight Trench Coat",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "M",
            color: "Bone Stone",
            sku: "VYR-TRN-002-M-BNE",
            price: 490,
            stock: 18,
            image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=85",
          },
          {
            size: "L",
            color: "Bone Stone",
            sku: "VYR-TRN-002-L-BNE",
            price: 490,
            stock: 17,
            image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=85",
          },
        ],
        attributes: [
          { name: "Material", value: "Bonded Cotton Twill" },
          { name: "Fit", value: "Oversized tailored drape" },
          { name: "Origin", value: "Made in Portugal" },
        ],
        tags: ["trench", "cotton", "outerwear", "rainwear"],
      },
      {
        title: "Structured Poplin Relaxed Shirt",
        slug: "structured-poplin-relaxed-shirt",
        description:
          "Woven from high-twist 120s Egyptian cotton poplin with crisp architectural structure, Mother of Pearl buttons, and clean covered placket.",
        price: 185,
        compareAtPrice: 220,
        costPrice: 75,
        sku: "VYR-SHT-003",
        stock: 50,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("men")!,
        brandId: brands.get("studio-minimal")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&q=85",
            alt: "Structured Poplin Relaxed Shirt",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "S",
            color: "Crisp White",
            sku: "VYR-SHT-003-S-WHT",
            price: 185,
            stock: 25,
          },
          {
            size: "M",
            color: "Crisp White",
            sku: "VYR-SHT-003-M-WHT",
            price: 185,
            stock: 25,
          },
        ],
        attributes: [
          { name: "Material", value: "100% Giza Egyptian Cotton" },
          { name: "Collar", value: "Pointed spread collar" },
        ],
        tags: ["shirt", "poplin", "minimal", "cotton", "men"],
      },
      {
        title: "Pleated Wool Wide-Leg Trousers",
        slug: "pleated-wool-wide-leg-trousers",
        description:
          "Flawlessly draped virgin wool high-waisted trousers with deep double front pleats, invisible hems, and tailored slash pockets.",
        price: 295,
        compareAtPrice: 340,
        costPrice: 130,
        sku: "VYR-TRS-004",
        stock: 40,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("women")!,
        brandId: brands.get("veyora-atelier")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85",
            alt: "Pleated Wool Wide-Leg Trousers",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "36",
            color: "Charcoal Heather",
            sku: "VYR-TRS-004-36-CHR",
            price: 295,
            stock: 20,
          },
          {
            size: "38",
            color: "Charcoal Heather",
            sku: "VYR-TRS-004-38-CHR",
            price: 295,
            stock: 20,
          },
        ],
        attributes: [
          { name: "Material", value: "100% Super 120s Virgin Wool" },
          { name: "Rise", value: "High Rise" },
        ],
        tags: ["trousers", "wool", "tailoring", "women"],
      },
      {
        title: "Sculpted Italian Calfskin Tote",
        slug: "sculpted-italian-calfskin-tote",
        description:
          "Hand-stitched full grain vegetable tanned calfskin leather tote. Features edge-painted finishes, magnetic closure, and removable suede organizer pouch.",
        price: 540,
        compareAtPrice: 620,
        costPrice: 240,
        sku: "VYR-BAG-005",
        stock: 30,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("accessories")!,
        brandId: brands.get("elan-maison")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1000&q=85",
            alt: "Sculpted Italian Calfskin Tote Bag",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "One Size",
            color: "Cognac Brown",
            sku: "VYR-BAG-005-OS-CGN",
            price: 540,
            stock: 15,
          },
          {
            size: "One Size",
            color: "Noir Black",
            sku: "VYR-BAG-005-OS-BLK",
            price: 540,
            stock: 15,
          },
        ],
        attributes: [
          { name: "Leather", value: "Full-Grain Italian Calfskin" },
          { name: "Hardware", value: "Brushed Antique Brass" },
        ],
        tags: ["bag", "leather", "accessories", "tote"],
      },
      {
        title: "Handcrafted Minimalist Derby Shoe",
        slug: "handcrafted-minimalist-derby-shoe",
        description:
          "Goodyear welted smooth boxcalf derby shoes with blind eyelets, calfskin lining, and durable Vibram micro-lug sole.",
        price: 380,
        compareAtPrice: 440,
        costPrice: 170,
        sku: "VYR-SHOE-006",
        stock: 24,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("footwear")!,
        brandId: brands.get("veyora-atelier")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1000&q=85",
            alt: "Handcrafted Minimalist Derby Shoe",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "41",
            color: "Polished Black",
            sku: "VYR-SHOE-006-41-BLK",
            price: 380,
            stock: 12,
          },
          {
            size: "42",
            color: "Polished Black",
            sku: "VYR-SHOE-006-42-BLK",
            price: 380,
            stock: 12,
          },
        ],
        attributes: [
          { name: "Upper", value: "Boxcalf Leather" },
          { name: "Construction", value: "Goodyear Welted" },
        ],
        tags: ["shoes", "footwear", "derby", "leather"],
      },
      {
        title: "Pure Silk Bias-Cut Slip Dress",
        slug: "pure-silk-bias-cut-slip-dress",
        description:
          "22mm heavyweight mulberry silk satin with a fluid bias cut, delicate micro-straps, and French seams.",
        price: 360,
        compareAtPrice: 420,
        costPrice: 150,
        sku: "VYR-DRS-007",
        stock: 30,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("women")!,
        brandId: brands.get("studio-minimal")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1000&q=85",
            alt: "Pure Silk Bias-Cut Slip Dress",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "XS",
            color: "Champagne Pearl",
            sku: "VYR-DRS-007-XS-CHP",
            price: 360,
            stock: 15,
          },
          {
            size: "S",
            color: "Champagne Pearl",
            sku: "VYR-DRS-007-S-CHP",
            price: 360,
            stock: 15,
          },
        ],
        attributes: [
          { name: "Fabric", value: "100% Grade 6A Mulberry Silk" },
          { name: "Finish", value: "High-Lustre Satin" },
        ],
        tags: ["dress", "silk", "evening", "women"],
      },
      {
        title: "Fine Merino Knit Turtleneck",
        slug: "fine-merino-knit-turtleneck",
        description:
          "Seamless 18-gauge extra-fine Australian Merino wool rollneck sweater designed for lightweight thermal comfort and effortless layering.",
        price: 220,
        compareAtPrice: 260,
        costPrice: 90,
        sku: "VYR-KNT-008",
        stock: 40,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("men")!,
        brandId: brands.get("nordcraft")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1000&q=85",
            alt: "Fine Merino Knit Turtleneck",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "M",
            color: "Oatmeal Melange",
            sku: "VYR-KNT-008-M-OTM",
            price: 220,
            stock: 20,
          },
          {
            size: "L",
            color: "Oatmeal Melange",
            sku: "VYR-KNT-008-L-OTM",
            price: 220,
            stock: 20,
          },
        ],
        attributes: [
          { name: "Yarn", value: "100% Extra-Fine Australian Merino" },
          { name: "Gauge", value: "18 Gauge Seamless Knit" },
        ],
        tags: ["knitwear", "merino", "sweater", "turtleneck", "men"],
      },
    ];

    for (const p of productsToSeed) {
      const product = await Product.findOneAndUpdate(
        { slug: p.slug },
        { $set: p },
        { upsert: true, new: true }
      );

      // Seed Main Inventory for Product
      const mainOnHand = p.stock;
      const mainInv = await Inventory.findOneAndUpdate(
        { sku: p.sku },
        {
          $set: {
            productId: product._id,
            productTitle: product.title,
            variantId: null,
            variantName: undefined,
            sku: p.sku,
            onHand: mainOnHand,
            reserved: 0,
            lowStockThreshold: 5,
            status: mainOnHand > 5 ? "in_stock" : "low_stock",
            trackQuantity: true,
          },
        },
        { upsert: true, new: true }
      );

      // Seed initial StockMovement for main product
      const existingMovement = await StockMovement.findOne({ sku: p.sku });
      if (!existingMovement) {
        await StockMovement.create({
          inventoryId: mainInv._id,
          productId: product._id,
          variantId: null,
          sku: p.sku,
          type: "restock",
          quantity: mainOnHand,
          previousOnHand: 0,
          newOnHand: mainOnHand,
          previousReserved: 0,
          newReserved: 0,
          reason: "Initial catalog intake & inventory seed",
          referenceId: `SEED-${p.sku}`,
          userId: adminUser._id,
          userName: `${adminUser.firstName} ${adminUser.lastName}`,
        });
      }

      // Seed Variant Inventories
      if (p.variants && p.variants.length > 0) {
        for (const variant of p.variants) {
          const varDoc = product.variants.find((v) => v.sku === variant.sku) as
            | (typeof product.variants[number] & { _id?: mongoose.Types.ObjectId })
            | undefined;
          const varDocId = varDoc?._id ?? null;
          const varOnHand = variant.stock || 15;
          const varInv = await Inventory.findOneAndUpdate(
            { sku: variant.sku },
            {
              $set: {
                productId: product._id,
                productTitle: product.title,
                variantId: varDocId,
                variantName: `${variant.size ?? ""} / ${variant.color ?? ""}`.trim(),
                sku: variant.sku,
                onHand: varOnHand,
                reserved: 0,
                lowStockThreshold: 5,
                status: varOnHand > 5 ? "in_stock" : "low_stock",
                trackQuantity: true,
              },
            },
            { upsert: true, new: true }
          );

          const existingVarMovement = await StockMovement.findOne({ sku: variant.sku });
          if (!existingVarMovement) {
            await StockMovement.create({
              inventoryId: varInv._id,
              productId: product._id,
              variantId: varDocId,
              sku: variant.sku,
              type: "restock",
              quantity: varOnHand,
              previousOnHand: 0,
              newOnHand: varOnHand,
              previousReserved: 0,
              newReserved: 0,
              reason: "Initial variant intake",
              referenceId: `SEED-${variant.sku}`,
              userId: adminUser._id,
              userName: `${adminUser.firstName} ${adminUser.lastName}`,
            });
          }
        }
      }
    }
    logger.info({ count: productsToSeed.length }, "Seeded catalog products and inventory");

    logger.info("Database seeding completed successfully!");
  } finally {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected after seeding.");
  }
}

// Direct execution support
if (require.main === module) {
  runDatabaseSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.fatal({ err }, "Database seeding failed");
      process.exit(1);
    });
}
