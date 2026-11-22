import { Router } from "express";
import { productController } from "./controllers/product.controller";
import { categoryController } from "./controllers/category.controller";
import { brandController } from "./controllers/brand.controller";
import { collectionController } from "./controllers/collection.controller";
import { validate } from "../../middleware/validate-request";
import { requireAuth, requireRole, requirePermission } from "../../middleware/auth";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
  createCollectionSchema,
  updateCollectionSchema,
} from "@veyora/validators";

const router = Router();

// ==========================================
// Public Storefront Catalog Routes
// ==========================================

// Categories
router.get("/categories", categoryController.listCategories.bind(categoryController));
router.get("/categories/tree", categoryController.getCategoryTree.bind(categoryController));
router.get("/categories/:idOrSlug", categoryController.getCategory.bind(categoryController));

// Brands
router.get("/brands", brandController.listBrands.bind(brandController));
router.get("/brands/:idOrSlug", brandController.getBrand.bind(brandController));

// Collections
router.get("/collections", collectionController.listCollections.bind(collectionController));
router.get("/collections/:idOrSlug", collectionController.getCollection.bind(collectionController));

// Products
router.get(
  "/products",
  validate({ query: productQuerySchema }),
  productController.listProducts.bind(productController)
);
router.get("/products/:idOrSlug", productController.getProduct.bind(productController));

// ==========================================
// Protected Administration Catalog Routes
// ==========================================

// Catalog Summary Stats
router.get(
  "/admin/catalog/stats",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:read"),
  productController.getStats.bind(productController)
);

// Admin Category Management
router.post(
  "/admin/categories",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:write"),
  validate({ body: createCategorySchema }),
  categoryController.createCategory.bind(categoryController)
);

router.put(
  "/admin/categories/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:write"),
  validate({ body: updateCategorySchema }),
  categoryController.updateCategory.bind(categoryController)
);

router.delete(
  "/admin/categories/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:delete"),
  categoryController.deleteCategory.bind(categoryController)
);

// Admin Brand Management
router.post(
  "/admin/brands",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:write"),
  validate({ body: createBrandSchema }),
  brandController.createBrand.bind(brandController)
);

router.put(
  "/admin/brands/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:write"),
  validate({ body: updateBrandSchema }),
  brandController.updateBrand.bind(brandController)
);

router.delete(
  "/admin/brands/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:delete"),
  brandController.deleteBrand.bind(brandController)
);

// Admin Collection Management
router.post(
  "/admin/collections",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:write"),
  validate({ body: createCollectionSchema }),
  collectionController.createCollection.bind(collectionController)
);

router.put(
  "/admin/collections/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:write"),
  validate({ body: updateCollectionSchema }),
  collectionController.updateCollection.bind(collectionController)
);

router.delete(
  "/admin/collections/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("categories:delete"),
  collectionController.deleteCollection.bind(collectionController)
);

// Admin Product Management
router.post(
  "/admin/products",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:write"),
  validate({ body: createProductSchema }),
  productController.createProduct.bind(productController)
);

router.put(
  "/admin/products/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:write"),
  validate({ body: updateProductSchema }),
  productController.updateProduct.bind(productController)
);

router.delete(
  "/admin/products/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  requirePermission("products:delete"),
  productController.deleteProduct.bind(productController)
);

export const catalogRouter = router;
