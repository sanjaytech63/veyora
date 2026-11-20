import { Category, ICategory } from "../models/category.model";
import { Product } from "../models/product.model";
import { CreateCategoryInput, UpdateCategoryInput } from "@veyora/validators";
import { Category as CategoryType, CategoryStatus } from "@veyora/types";
import { ConflictError, NotFoundError, slugify } from "@veyora/utils";
import mongoose from "mongoose";

export class CategoryService {
  private toCategoryDto(doc: ICategory): CategoryType {
    return {
      id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description || "",
      parentId: doc.parentId ? doc.parentId.toString() : null,
      image: doc.image || "",
      status: doc.status,
      order: doc.order,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;

    while (true) {
      const existing = await Category.findOne({
        slug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${count}`;
      count++;
    }
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryType> {
    const slug = input.slug
      ? await this.generateUniqueSlug(input.slug)
      : await this.generateUniqueSlug(input.name);

    if (input.parentId) {
      const parent = await Category.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError("Parent category not found.");
      }
    }

    const category = await Category.create({
      name: input.name.trim(),
      slug,
      description: input.description || "",
      parentId: input.parentId || null,
      image: input.image || "",
      status: input.status || "active",
      order: input.order || 0,
    });

    return this.toCategoryDto(category);
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryType> {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    if (input.slug && input.slug !== category.slug) {
      category.slug = await this.generateUniqueSlug(input.slug, id);
    } else if (input.name && !input.slug && input.name !== category.name) {
      category.slug = await this.generateUniqueSlug(input.name, id);
    }

    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw new ConflictError("A category cannot be its own parent.");
      }
      if (input.parentId) {
        const parent = await Category.findById(input.parentId);
        if (!parent) {
          throw new NotFoundError("Parent category not found.");
        }
      }
      category.parentId = input.parentId ? new mongoose.Types.ObjectId(input.parentId) : null;
    }

    if (input.name !== undefined) category.name = input.name.trim();
    if (input.description !== undefined) category.description = input.description;
    if (input.image !== undefined) category.image = input.image;
    if (input.status !== undefined) category.status = input.status;
    if (input.order !== undefined) category.order = input.order;

    await category.save();
    return this.toCategoryDto(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await Category.findById(id);
    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    const hasChildren = await Category.exists({ parentId: id });
    if (hasChildren) {
      throw new ConflictError(
        "Cannot delete category with subcategories. Reassign or delete child categories first."
      );
    }

    const hasProducts = await Product.exists({ categoryId: id });
    if (hasProducts) {
      throw new ConflictError(
        "Cannot delete category with associated products. Reassign products first."
      );
    }

    await Category.deleteOne({ _id: id });
  }

  async getCategoryByIdOrSlug(idOrSlug: string): Promise<CategoryType> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const category = await Category.findOne(
      isObjectId ? { $or: [{ _id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug }
    );

    if (!category) {
      throw new NotFoundError("Category not found.");
    }

    return this.toCategoryDto(category);
  }

  async getCategories(options?: { status?: CategoryStatus }): Promise<CategoryType[]> {
    const filter = options?.status ? { status: options.status } : {};
    const categories = await Category.find(filter).sort({ order: 1, name: 1 });
    return categories.map((c) => this.toCategoryDto(c));
  }

  async getCategoryTree(): Promise<CategoryType[]> {
    const categories = await this.getCategories({ status: "active" });
    const categoryMap = new Map<string, CategoryType>();
    const roots: CategoryType[] = [];

    // Initialize items with empty children arrays
    for (const cat of categories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    // Build hierarchy
    for (const cat of categories) {
      const current = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children!.push(current);
      } else {
        roots.push(current);
      }
    }

    return roots;
  }
}

export const categoryService = new CategoryService();
