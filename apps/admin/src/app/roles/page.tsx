/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { adminRbacApi } from "@/lib/api/admin-rbac-api";
import { RoleDto, PermissionDefinition, PermissionCategory } from "@veyora/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  Plus,
  Users,
  Key,
  Edit2,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  Lock,
} from "lucide-react";

const CATEGORY_LABELS: Record<PermissionCategory, string> = {
  products: "Couture Products & Apparel",
  categories: "Fashion Categories & Taxonomies",
  inventory: "Atelier Inventory & Stock",
  orders: "Orders & Fulfillment",
  customers: "Patrons & Customer Profiles",
  payments: "Financial Payments & Refunds",
  coupons: "Promotions & Luxury Coupons",
  analytics: "Executive Dashboard & Analytics",
  settings: "Platform & Atelier Settings",
  staff: "Administrative Staff Management",
  roles: "Roles & Permission Access",
  audit: "Security & Audit Trail",
};

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        adminRbacApi.listRoles(),
        adminRbacApi.getPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch {
      toast.error("Failed to load administrative roles or permissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const permissionsByCategory = useMemo(() => {
    const map = new Map<PermissionCategory, PermissionDefinition[]>();
    for (const p of permissions) {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [permissions]);

  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.displayName.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setName("");
    setDisplayName("");
    setDescription("");
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleDto) => {
    setEditingRole(role);
    setName(role.name);
    setDisplayName(role.displayName);
    setDescription(role.description);
    setSelectedPermissions(role.permissions || []);
    setIsModalOpen(true);
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const toggleCategoryPermissions = (category: PermissionCategory) => {
    const catPerms = permissionsByCategory.get(category) || [];
    const catKeys = catPerms.map((p) => p.key);
    const allSelected = catKeys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !catKeys.includes(k as any)));
    } else {
      const union = new Set([...selectedPermissions, ...catKeys]);
      setSelectedPermissions(Array.from(union));
    }
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error("Role display name is required");
      return;
    }

    if (!editingRole && !name.trim()) {
      toast.error("Role identifier name is required");
      return;
    }

    if (selectedPermissions.length === 0) {
      toast.error("Please grant at least one permission to this role");
      return;
    }

    try {
      setSubmitting(true);
      if (editingRole) {
        await adminRbacApi.updateRole(editingRole.id, {
          displayName,
          description,
          permissions: selectedPermissions,
        });
        toast.success(`Role '${displayName}' updated successfully`);
      } else {
        await adminRbacApi.createRole({
          name: name.toLowerCase().trim(),
          displayName,
          description,
          permissions: selectedPermissions,
        });
        toast.success(`Role '${displayName}' created successfully`);
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to save role";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (role: RoleDto) => {
    if (role.isSystem) {
      toast.error("System-defined roles cannot be deleted");
      return;
    }

    if ((role.staffCount || 0) > 0) {
      toast.error(`Cannot delete role currently assigned to ${role.staffCount} staff member(s)`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete the role '${role.displayName}'?`)) {
      return;
    }

    try {
      setDeletingId(role.id);
      await adminRbacApi.deleteRole(role.id);
      toast.success(`Role '${role.displayName}' removed successfully`);
      fetchInitialData();
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to delete role";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Administrative Roles & Permissions
            </h1>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary font-mono text-[11px]"
            >
              RBAC v2.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure granular access tiers, security privileges, and domain-level authorization
            matrices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            <span>Create Custom Role</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Configured Roles</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{roles.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Granular Permissions</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{permissions.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Staff Member Assignments</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {roles.reduce((acc, r) => acc + (r.staffCount || 0), 0)}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">System Protected Tiers</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {roles.filter((r) => r.isSystem).length}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles by title, key, or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading administrative authorization matrix...</p>
        </div>
      ) : filteredRoles.length === 0 ? (
        <Card className="border-dashed border-2 py-12 text-center">
          <CardContent className="space-y-3">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-semibold text-foreground">No administrative roles found</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No roles match your search filter. Create custom roles to grant tailored permissions
              to atelier staff.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoles.map((role) => {
            const isSuperadmin = role.name === "superadmin";
            const isDeleting = deletingId === role.id;

            return (
              <Card
                key={role.id}
                className="border-border hover:border-primary/50 transition-all flex flex-col justify-between shadow-sm"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                        <span>{role.displayName}</span>
                        {role.isSystem && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] uppercase font-mono tracking-wider"
                          >
                            System
                          </Badge>
                        )}
                      </CardTitle>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        slug: {role.name}
                      </span>
                    </div>

                    <Badge
                      variant="outline"
                      className="gap-1 text-[11px] font-semibold text-foreground bg-accent/30"
                    >
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span>{role.staffCount || 0} Staff</span>
                    </Badge>
                  </div>

                  <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2">
                    {role.description || "No specific operational scope detailed."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0 space-y-4">
                  {/* Permissions Preview */}
                  <div className="space-y-1.5 border-t border-border/60 pt-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-primary" />
                        <span>Granted Permissions:</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-primary">
                        {isSuperadmin ? "ALL (Wildcard *)" : `${role.permissions.length} keys`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-muted/30 rounded-lg border border-border/40">
                      {isSuperadmin ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                          * (Full Ecosystem Authority)
                        </Badge>
                      ) : (
                        role.permissions.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="text-[10px] font-mono px-1.5 py-0.5 bg-background border border-border"
                          >
                            {p}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(role)}
                      className="gap-1.5 text-xs h-8"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Configure</span>
                    </Button>

                    {!role.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting || (role.staffCount || 0) > 0}
                        onClick={() => handleDeleteRole(role)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                        title={
                          (role.staffCount || 0) > 0
                            ? "Reassign staff members before deleting"
                            : "Delete role"
                        }
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Role Creation & Configuration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>
                {editingRole ? `Configure Role: ${editingRole.displayName}` : "Create Custom Role"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Define the role identity and select granular access privileges across operational
              modules.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRole} className="flex-1 overflow-y-auto space-y-5 pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" className="text-xs font-bold">
                  Role Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Couture Merchandiser"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold">
                  Role Identifier Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. couture_merchandiser"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={Boolean(editingRole)}
                  required
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold">
                Role Description & Operational Scope
              </Label>
              <Textarea
                id="description"
                placeholder="Describe responsibilities and access boundaries..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Permission Matrix */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span>Granular Domain Privileges ({selectedPermissions.length} selected)</span>
                </Label>
              </div>

              <div className="space-y-4">
                {Array.from(permissionsByCategory.entries()).map(([category, perms]) => {
                  const catKeys = perms.map((p) => p.key);
                  const allSelected = catKeys.every((k) => selectedPermissions.includes(k));
                  const someSelected = catKeys.some((k) => selectedPermissions.includes(k));

                  return (
                    <div
                      key={category}
                      className="rounded-xl border border-border/80 bg-card/60 p-3.5 space-y-2.5 transition-colors"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={() => toggleCategoryPermissions(category)}
                            id={`cat-${category}`}
                          />
                          <Label
                            htmlFor={`cat-${category}`}
                            className="text-xs font-bold capitalize cursor-pointer text-foreground"
                          >
                            {CATEGORY_LABELS[category] || category}
                          </Label>
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {catKeys.filter((k) => selectedPermissions.includes(k)).length}/
                          {catKeys.length} active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {perms.map((p) => {
                          const isChecked = selectedPermissions.includes(p.key);
                          return (
                            <div
                              key={p.key}
                              onClick={() => togglePermission(p.key)}
                              className={`flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-primary/5 border-primary/40 text-foreground"
                                  : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              <Checkbox checked={isChecked} className="mt-0.5" />
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold flex items-center gap-1.5">
                                  <span>{p.label}</span>
                                  {isChecked && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                  {p.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{editingRole ? "Save Changes" : "Create Role"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
