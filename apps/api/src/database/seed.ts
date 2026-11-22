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
  logger.info({ uri: env.MONGODB_URI }, "Connecting to MongoDB for Veyora Fashion database seeding...");
  await mongoose.connect(env.MONGODB_URI);

  try {
    logger.info("Initializing Veyora Fashion E-Commerce database seed...");

    // 1. Seed or Verify Admin User
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

    // 1b. Seed or Verify Default Verified Customer
    const customerPasswordHash = await bcrypt.hash("Customer@123456", 12);
    const existingCustomer = await User.findOne({ email: "customer@veyora.local" });
    if (!existingCustomer) {
      await User.create({
        email: "customer@veyora.local",
        passwordHash: customerPasswordHash,
        firstName: "Priya",
        lastName: "Sharma",
        role: "customer",
        permissions: [],
        isEmailVerified: true,
        isActive: true,
      });
      logger.info("Created test customer: customer@veyora.local (password: Customer@123456)");
    } else {
      existingCustomer.isEmailVerified = true;
      existingCustomer.isActive = true;
      await existingCustomer.save();
      logger.info("Verified active customer: customer@veyora.local");
    }

    const adminUser = (await User.findOne({ email: "sjat11463@gmail.com" }))!;

    // 2. Seed Fashion Brands
    const brandData = [
      {
        name: "Veyora Atelier",
        slug: "veyora-atelier",
        description: "Bespoke contemporary tailoring, handcrafted festive silhouettes and luxury Indian couture.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=VEYORA+ATELIER",
        website: "https://veyora.com",
        status: "active" as const,
      },
      {
        name: "Studio Jaipur",
        slug: "studio-jaipur",
        description: "Artisanal hand-block prints, pure mulmul cotton, and heritage Rajasthani craftsmanship.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=STUDIO+JAIPUR",
        website: "https://studiojaipur.design",
        status: "active" as const,
      },
      {
        name: "Élan Heritage",
        slug: "elan-heritage",
        description: "Regal Banarasi silk brocades, hand-woven zari work, and timeless bridal heirlooms.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=ELAN+HERITAGE",
        website: "https://elanheritage.in",
        status: "active" as const,
      },
      {
        name: "Kora Minimal",
        slug: "kora-minimal",
        description: "Organic European linen co-ord sets, breathable daily tunics, and modern monochrome cuts.",
        logo: "https://placehold.co/200x80/09090b/fafafa?text=KORA+MINIMAL",
        website: "https://koraminimal.com",
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

    // 3. Seed Fashion Categories (Indian & Contemporary Clothing)
    const categoryData = [
      {
        name: "Kurtis & Kurti Sets",
        slug: "kurtis",
        description: "Handcrafted straight kurtis, Anarkali sets with organza dupattas, and everyday office tunics.",
        image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
        order: 1,
        status: "active" as const,
      },
      {
        name: "Ethnic & Festive Wear",
        slug: "ethnic-wear",
        description: "Regal wedding lehengas, Rajasthani ghagras, traditional salwar suits, and celebratory ensembles.",
        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
        order: 2,
        status: "active" as const,
      },
      {
        name: "Sarees & Drapes",
        slug: "sarees",
        description: "Handwoven pure Banarasi silk, Chanderi zari brocades, and modern lightweight organza sarees.",
        image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80",
        order: 3,
        status: "active" as const,
      },
      {
        name: "Dresses & Western Wear",
        slug: "dresses",
        description: "Fluid silk maxi dresses, tailored jumpsuits, wrap tunics, and contemporary evening wear.",
        image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
        order: 4,
        status: "active" as const,
      },
      {
        name: "Co-ords & Loungewear",
        slug: "co-ords",
        description: "Pure cotton pajama sets, breathable linen co-ords, and effortless relaxed resort wear.",
        image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80",
        order: 5,
        status: "active" as const,
      },
      {
        name: "Dupattas & Accessories",
        slug: "accessories",
        description: "Artisanal hand-embroidered mirror-work dupattas, pure silk stoles, and handcrafted potlis.",
        image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80",
        order: 6,
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
    logger.info({ count: categories.size }, "Seeded fashion categories");

    // 4. Seed Fashion Products with Indian & Contemporary Silhouettes, Variants & Stock
    const productsToSeed = [
      {
        title: "Handcrafted Chanderi Silk Kurti Set with Organza Dupatta",
        slug: "chanderi-silk-kurti-set-organza-dupatta",
        description:
          "Crafted from handwoven Chanderi silk with delicate gota patti hand embroidery along the neckline and cuffs. Paired with matching silk cigarette pants and a feather-light scalloped organza dupatta with gold zari highlights.",
        price: 185,
        compareAtPrice: 240,
        costPrice: 90,
        sku: "VYR-KRT-001",
        stock: 45,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("kurtis")!,
        brandId: brands.get("veyora-atelier")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&q=85",
            alt: "Chanderi Silk Kurti Set full view",
            isPrimary: true,
            order: 0,
          },
          {
            url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&q=85",
            alt: "Chanderi Silk Kurti Set embroidery detail",
            isPrimary: false,
            order: 1,
          },
        ],
        variants: [
          {
            size: "S",
            color: "Crimson Red",
            sku: "VYR-KRT-001-S-RED",
            price: 185,
            stock: 15,
            image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&q=85",
          },
          {
            size: "M",
            color: "Crimson Red",
            sku: "VYR-KRT-001-M-RED",
            price: 185,
            stock: 15,
            image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&q=85",
          },
          {
            size: "L",
            color: "Emerald Green",
            sku: "VYR-KRT-001-L-GRN",
            price: 185,
            stock: 15,
            image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&q=85",
          },
        ],
        attributes: [
          { name: "Fabric", value: "Handwoven Chanderi Silk & Organza" },
          { name: "Fit", value: "Relaxed tailored A-line silhouette" },
          { name: "Craft", value: "Traditional Gota Patti & Zari Handwork" },
          { name: "Care", value: "Dry clean only to preserve natural silk lustre" },
          { name: "Includes", value: "Kurti, Cigarette Trousers, Organza Dupatta" },
        ],
        tags: ["kurti", "kurti-set", "festive", "new-arrivals", "best-seller", "chanderi"],
        seo: {
          metaTitle: "Chanderi Silk Kurti Set with Organza Dupatta — Veyora Atelier",
          metaDescription: "Exquisite handwoven Chanderi silk kurti set with gota patti hand embroidery and scalloped organza dupatta.",
          keywords: ["kurti set", "chanderi silk", "ethnic wear", "festive clothing"],
        },
      },
      {
        title: "Bandhani Silk Handcrafted Festive Lehenga Choli",
        slug: "bandhani-silk-festive-lehenga-choli",
        description:
          "Traditional Rajasthani tie-dye Bandhani art reimagined on pure gajji silk. Features a flared 4-meter ghera, hand-done zardozi and mirror work waist belt, backless tied choli, and an ethereal net dupatta with silk borders.",
        price: 495,
        compareAtPrice: 620,
        costPrice: 240,
        sku: "VYR-LHG-002",
        stock: 30,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("ethnic-wear")!,
        brandId: brands.get("studio-jaipur")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000&q=85",
            alt: "Bandhani Silk Festive Lehenga Choli",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "S",
            color: "Mustard Haldi",
            sku: "VYR-LHG-002-S-GLD",
            price: 495,
            stock: 10,
          },
          {
            size: "M",
            color: "Mustard Haldi",
            sku: "VYR-LHG-002-M-GLD",
            price: 495,
            stock: 10,
          },
          {
            size: "L",
            color: "Vermilion Red",
            sku: "VYR-LHG-002-L-RED",
            price: 495,
            stock: 10,
          },
        ],
        attributes: [
          { name: "Fabric", value: "Pure Gajji Silk with Hand Bandhani" },
          { name: "Flare", value: "Full 4.2 Meter Ghera with Can-Can Lining" },
          { name: "Embroidery", value: "Artisan Zardozi, Resham & Mirror Work" },
          { name: "Occasion", value: "Sangeet, Weddings, Festive Celebrations" },
        ],
        tags: ["lehenga", "bandhani", "festive", "wedding", "ethnic-wear"],
      },
      {
        title: "Embroidered Floor-Length Anarkali Suit with Dupatta",
        slug: "embroidered-floor-length-anarkali-suit",
        description:
          "Floor-length kalidar Anarkali in georgette with intricate thread embroidery and micro-sequins. Features a sweetheart neckline, sheer embroidered churidar sleeves, and a complementary tonal dupatta with latkan tassels.",
        price: 260,
        compareAtPrice: 320,
        costPrice: 120,
        sku: "VYR-ANK-003",
        stock: 35,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("kurtis")!,
        brandId: brands.get("veyora-atelier")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=1000&q=85",
            alt: "Embroidered Floor-Length Anarkali Suit",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "M",
            color: "Blush Rose",
            sku: "VYR-ANK-003-M-PNK",
            price: 260,
            stock: 18,
          },
          {
            size: "L",
            color: "Blush Rose",
            sku: "VYR-ANK-003-L-PNK",
            price: 260,
            stock: 17,
          },
        ],
        attributes: [
          { name: "Fabric", value: "Fine Viscose Georgette & Shantoon Lining" },
          { name: "Silhouette", value: "32-Kali Kalidar Floor Sweep" },
          { name: "Care", value: "Specialist Dry Clean Only" },
        ],
        tags: ["anarkali", "suit", "kurtis", "festive", "trending"],
      },
      {
        title: "Pure Mulmul Cotton Hand-Block Print Everyday Kurti",
        slug: "mulmul-cotton-hand-block-print-kurti",
        description:
          "Feather-light 100% organic mulmul cotton kurti with artisanal hand-block Bagru floral motifs. Breathable, naturally dyed, and designed for effortless all-day comfort.",
        price: 68,
        compareAtPrice: 85,
        costPrice: 28,
        sku: "VYR-KRT-004",
        stock: 60,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("kurtis")!,
        brandId: brands.get("studio-jaipur")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1000&q=85",
            alt: "Pure Mulmul Cotton Everyday Kurti",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "S",
            color: "Indigo Blue",
            sku: "VYR-KRT-004-S-BLU",
            price: 68,
            stock: 20,
          },
          {
            size: "M",
            color: "Indigo Blue",
            sku: "VYR-KRT-004-M-BLU",
            price: 68,
            stock: 20,
          },
          {
            size: "L",
            color: "Indigo Blue",
            sku: "VYR-KRT-004-L-BLU",
            price: 68,
            stock: 20,
          },
        ],
        attributes: [
          { name: "Fabric", value: "100% Certified Organic Mulmul Cotton" },
          { name: "Print Technique", value: "Hand Wooden Block Print with Natural Dyes" },
          { name: "Fit", value: "Straight cut with side slits" },
          { name: "Care", value: "Gentle cold hand wash" },
        ],
        tags: ["kurti", "cotton", "everyday", "block-print", "summer"],
      },
      {
        title: "Regal Banarasi Katan Silk Brocade Zari Saree",
        slug: "regal-banarasi-katan-silk-brocade-saree",
        description:
          "Woven by master weavers in Varanasi using pure katan silk and antique gold zari. Adorned with heritage Mughal jaal work, kadhwa weaving technique, and an opulent zari pallu. Accompanied by unstitched brocade blouse piece.",
        price: 380,
        compareAtPrice: 480,
        costPrice: 190,
        sku: "VYR-SRE-005",
        stock: 25,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("sarees")!,
        brandId: brands.get("elan-heritage")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=1000&q=85",
            alt: "Regal Banarasi Katan Silk Brocade Saree",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "Free Size (6.3m)",
            color: "Royal Emerald",
            sku: "VYR-SRE-005-FS-GRN",
            price: 380,
            stock: 12,
          },
          {
            size: "Free Size (6.3m)",
            color: "Deep Ruby",
            sku: "VYR-SRE-005-FS-RED",
            price: 380,
            stock: 13,
          },
        ],
        attributes: [
          { name: "Weave", value: "Authentic Kadhwa Handloom Brocade" },
          { name: "Fabric", value: "100% Pure Katan Silk with Silk Mark Certification" },
          { name: "Blouse", value: "Includes 0.8m Unstitched Matching Silk Blouse Piece" },
          { name: "Occasion", value: "Bridal, Wedding Reception, Royal Festivities" },
        ],
        tags: ["saree", "banarasi", "silk", "wedding", "heritage"],
      },
      {
        title: "Artisanal Pure Linen Relaxed Co-ord Set",
        slug: "artisanal-pure-linen-relaxed-co-ord-set",
        description:
          "Modern minimalist resort co-ord crafted from 60-lea European organic linen. Features a dropped-shoulder collared tunic shirt with shell buttons and relaxed wide-leg pull-on trousers with an elasticated waistband.",
        price: 145,
        compareAtPrice: 180,
        costPrice: 65,
        sku: "VYR-CRD-006",
        stock: 35,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("co-ords")!,
        brandId: brands.get("kora-minimal")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1544441893-675973e31985?w=1000&q=85",
            alt: "Artisanal Pure Linen Relaxed Co-ord Set",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "S",
            color: "Oatmeal Beige",
            sku: "VYR-CRD-006-S-BGE",
            price: 145,
            stock: 18,
          },
          {
            size: "M",
            color: "Oatmeal Beige",
            sku: "VYR-CRD-006-M-BGE",
            price: 145,
            stock: 17,
          },
        ],
        attributes: [
          { name: "Fabric", value: "100% European Certified Organic Linen" },
          { name: "Fit", value: "Relaxed fluid silhouette" },
          { name: "Care", value: "Machine wash cold on gentle cycle" },
        ],
        tags: ["co-ord", "linen", "loungewear", "minimal", "summer"],
      },
      {
        title: "Pure Silk Bias-Cut Contemporary Maxi Dress",
        slug: "pure-silk-bias-cut-contemporary-maxi-dress",
        description:
          "22mm heavyweight mulberry silk satin with a fluid bias drape, delicate adjustable micro-straps, cowl neckline, and French seams throughout.",
        price: 285,
        compareAtPrice: 350,
        costPrice: 125,
        sku: "VYR-DRS-007",
        stock: 28,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("dresses")!,
        brandId: brands.get("kora-minimal")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1000&q=85",
            alt: "Pure Silk Bias-Cut Maxi Dress",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "XS",
            color: "Champagne Pearl",
            sku: "VYR-DRS-007-XS-CHP",
            price: 285,
            stock: 14,
          },
          {
            size: "S",
            color: "Champagne Pearl",
            sku: "VYR-DRS-007-S-CHP",
            price: 285,
            stock: 14,
          },
        ],
        attributes: [
          { name: "Fabric", value: "100% Grade 6A Pure Mulberry Silk Satin" },
          { name: "Cut", value: "Classic 45-degree bias grain drape" },
          { name: "Length", value: "Ankle-length maxi" },
        ],
        tags: ["dress", "silk", "western-wear", "evening", "trending"],
      },
      {
        title: "Hand-Blocked Rajasthani Cotton Ghagra Choli Set",
        slug: "hand-blocked-rajasthani-cotton-ghagra-choli-set",
        description:
          "Celebration of traditional Mewar craftsmanship in pure cambric cotton. Features intricate dabu mud resist prints, mirror embroidery border, adjustable drawstring dori with brass bells, and a lightweight kota doria odhni.",
        price: 195,
        compareAtPrice: 245,
        costPrice: 85,
        sku: "VYR-GHG-008",
        stock: 32,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("ethnic-wear")!,
        brandId: brands.get("studio-jaipur")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1000&q=85",
            alt: "Rajasthani Cotton Ghagra Choli Set",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "M",
            color: "Terracotta Rust",
            sku: "VYR-GHG-008-M-RST",
            price: 195,
            stock: 16,
          },
          {
            size: "L",
            color: "Terracotta Rust",
            sku: "VYR-GHG-008-L-RST",
            price: 195,
            stock: 16,
          },
        ],
        attributes: [
          { name: "Fabric", value: "Pure Cambric Cotton & Kota Doria Odhni" },
          { name: "Craftsmanship", value: "Mewar Dabu Mud-Resist Block Print" },
          { name: "Fit", value: "Full kalidar ghagra with tied choli" },
        ],
        tags: ["ghagra", "rajasthani", "ethnic-wear", "cotton", "festive"],
      },
      {
        title: "Artisanal Hand-Embroidered Mirror-Work Festive Dupatta",
        slug: "hand-embroidered-mirror-work-festive-dupatta",
        description:
          "Hand-embroidered Kachhi mirror work on pure tussar silk with resham thread detailing and metallic gota kinari borders. The ultimate statement accessory to elevate any plain kurti or lehenga.",
        price: 95,
        compareAtPrice: 120,
        costPrice: 42,
        sku: "VYR-DPT-009",
        stock: 40,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("accessories")!,
        brandId: brands.get("elan-heritage")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=1000&q=85",
            alt: "Hand-Embroidered Mirror-Work Dupatta",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "Free Size (2.5m)",
            color: "Vermilion Crimson",
            sku: "VYR-DPT-009-FS-RED",
            price: 95,
            stock: 20,
          },
          {
            size: "Free Size (2.5m)",
            color: "Turmeric Gold",
            sku: "VYR-DPT-009-FS-GLD",
            price: 95,
            stock: 20,
          },
        ],
        attributes: [
          { name: "Fabric", value: "Pure Handloom Tussar Silk" },
          { name: "Work", value: "Authentic Abhala Kachhi Mirror Embroidery" },
          { name: "Length", value: "2.5 Meters x 36 Inches" },
        ],
        tags: ["dupatta", "accessories", "mirror-work", "festive", "silk"],
      },
      {
        title: "Tussar Silk Hand-Embroidered Tailored Tunic",
        slug: "tussar-silk-hand-embroidered-tailored-tunic",
        description:
          "Natural wild tussar silk tunic featuring subtle tone-on-tone kantha embroidery, mandarin collar, concealed placket with carved mother-of-pearl buttons, and structured side slits.",
        price: 135,
        compareAtPrice: 165,
        costPrice: 58,
        sku: "VYR-TNC-010",
        stock: 35,
        trackQuantity: true,
        status: "active" as const,
        categoryId: categories.get("kurtis")!,
        brandId: brands.get("veyora-atelier")!,
        images: [
          {
            url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1000&q=85",
            alt: "Tussar Silk Hand-Embroidered Tailored Tunic",
            isPrimary: true,
            order: 0,
          },
        ],
        variants: [
          {
            size: "M",
            color: "Raw Ecru",
            sku: "VYR-TNC-010-M-ECR",
            price: 135,
            stock: 18,
          },
          {
            size: "L",
            color: "Raw Ecru",
            sku: "VYR-TNC-010-L-ECR",
            price: 135,
            stock: 17,
          },
        ],
        attributes: [
          { name: "Fabric", value: "100% Natural Wild Tussar Silk" },
          { name: "Stitch", value: "Artisan Kantha Running Stitch Detail" },
          { name: "Fit", value: "Tailored Contemporary Tunic Cut" },
        ],
        tags: ["tunic", "kurti", "tussar-silk", "new-arrivals", "minimal"],
      },
    ];

    // Clean slate for fashion catalog and inventory
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await StockMovement.deleteMany({});

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
          reason: "Initial Indian & contemporary clothing inventory intake",
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
    logger.info({ count: productsToSeed.length }, "Seeded fashion products and variant inventories");

    logger.info("Veyora Fashion database seeding completed successfully!");
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
