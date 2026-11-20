import { Router } from "express";
import { productController } from "./controllers/product.controller";
import { categoryController } from "./controllers/category.controller";
import { brandController } from "./controllers/brand.controller";
import { validate } from "../../middleware/validate-request";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  createBrandSchema,
  updateBrandSchema,
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
  productController.getStats.bind(productController)
);

// Admin Category Management
router.post(
  "/admin/categories",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: createCategorySchema }),
  categoryController.createCategory.bind(categoryController)
);

router.put(
  "/admin/categories/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: updateCategorySchema }),
  categoryController.updateCategory.bind(categoryController)
);

router.delete(
  "/admin/categories/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  categoryController.deleteCategory.bind(categoryController)
);

// Admin Brand Management
router.post(
  "/admin/brands",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: createBrandSchema }),
  brandController.createBrand.bind(brandController)
);

router.put(
  "/admin/brands/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: updateBrandSchema }),
  brandController.updateBrand.bind(brandController)
);

router.delete(
  "/admin/brands/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  brandController.deleteBrand.bind(brandController)
);

// Admin Product Management
router.post(
  "/admin/products",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: createProductSchema }),
  productController.createProduct.bind(productController)
);

router.put(
  "/admin/products/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  validate({ body: updateProductSchema }),
  productController.updateProduct.bind(productController)
);

router.delete(
  "/admin/products/:id",
  requireAuth,
  requireRole("admin", "superadmin"),
  productController.deleteProduct.bind(productController)
);

export const catalogRouter = router;
