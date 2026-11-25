"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { adminCatalogApi } from "@/lib/api/admin-catalog-api";
import { adminCatalogKeys } from "@/lib/api/query-keys";
import { notifyApiError, notifyApiSuccess } from "@/lib/notifications";
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Boxes,
  CheckCircle,
  FileEdit,
  AlertCircle,
} from "lucide-react";

export function ProductsListClient() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: adminCatalogKeys.products({ limit: 50 }),
    queryFn: () => adminCatalogApi.getProducts({ limit: 50 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: adminCatalogKeys.categories(),
    queryFn: () => adminCatalogApi.getCategories(),
  });

  const { data: stats = null } = useQuery({
    queryKey: ["admin-catalog", "stats"],
    queryFn: () => adminCatalogApi.getStats(),
  });

  const loading = loadingProducts;

  const loadData = () => {
    queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all });
  };

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => adminCatalogApi.deleteProduct(id),
    onSuccess: (archived) => {
      queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all });
      notifyApiSuccess(archived);
    },
    onError: (err: unknown) => {
      notifyApiError(err);
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to archive or delete "${title}"?`)) return;
    deleteProductMutation.mutate(id);
  };

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        search === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, search, statusFilter, categoryFilter]);

  return (
    <PageContainer
      title="Product Catalog"
      description="Manage your storefront products, variants, pricing, and stock levels."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild size="sm" className="flex items-center gap-1.5">
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      }
    >
      {/* 1. Summary Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts ?? products.length}</div>
            <p className="text-xs text-muted-foreground">In store database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published / Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.activeProducts ?? products.filter((p) => p.status === "active").length}
            </div>
            <p className="text-xs text-muted-foreground">Visible on storefront</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileEdit className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.draftProducts ?? products.filter((p) => p.status === "draft").length}
            </div>
            <p className="text-xs text-muted-foreground">Pending review or launch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.archivedProducts ?? products.filter((p) => p.status === "archived").length}
            </div>
            <p className="text-xs text-muted-foreground">Inactive / decommissioned</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Search & Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by title, SKU, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Loading catalog products...
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes className="h-8 w-8 text-muted-foreground/50" />
                      <p className="font-medium">No products found</p>
                      <p className="text-xs">
                        {search || statusFilter !== "all"
                          ? "Try clearing filters to see more results."
                          : "Get started by adding your first product."}
                      </p>
                      <Button asChild size="sm" variant="outline" className="mt-2">
                        <Link href="/products/new">Add Product</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const primaryImage =
                    product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {primaryImage ? (
                              <OptimizedImage
                                src={primaryImage}
                                alt={product.title}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-foreground truncate max-w-[220px]">
                              {product.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                      <TableCell className="font-medium">
                        ${product.price.toFixed(2)}
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="ml-1.5 text-xs text-muted-foreground line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.stock > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20"
                          >
                            {product.stock} in stock
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/20"
                          >
                            Out of stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{product.variants?.length || 0} variants</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "active"
                              ? "default"
                              : product.status === "draft"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => router.push(`/products/${product.id}`)}
                            title="Edit product"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(product.id, product.title)}
                            title="Delete or Archive product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
