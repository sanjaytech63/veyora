/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useEffect, useState, useMemo } from "react";
import { adminRbacApi } from "@/lib/api/admin-rbac-api";
import { StaffUserDto, RoleDto, PermissionDefinition, UserRole } from "@veyora/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notifyApiError, notifyApiSuccess, notifyWarning } from "@/lib/notifications";
import {
  UserCheck,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Power,
  Loader2,
  Key,
  Shield,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<StaffUserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUserDto | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedCustomPerms, setSelectedCustomPerms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Status Deactivation Modal
  const [statusTarget, setStatusTarget] = useState<StaffUserDto | null>(null);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchStaffData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesData, permsData] = await Promise.all([
        adminRbacApi.listStaff({ limit: 100 }),
        adminRbacApi.listRoles(),
        adminRbacApi.getPermissions(),
      ]);
      setStaffList(staffRes.staff);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (roleFilter !== "all" && s.role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.email.toLowerCase().includes(q) ||
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    });
  }, [staffList, searchQuery, roleFilter]);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setPhone("");
    setSelectedRole("admin");
    setSelectedRoleIds([]);
    setSelectedCustomPerms([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffUserDto) => {
    setEditingStaff(staff);
    setEmail(staff.email);
    setPassword("");
    setFirstName(staff.firstName);
    setLastName(staff.lastName);
    setPhone(staff.phone || "");
    setSelectedRole(staff.role);
    setSelectedRoleIds(staff.assignedRoleIds || []);
    setSelectedCustomPerms(staff.customPermissions || []);
    setIsModalOpen(true);
  };

  const toggleRoleId = (rId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(rId) ? prev.filter((id) => id !== rId) : [...prev, rId]
    );
  };

  const toggleCustomPerm = (pKey: string) => {
    setSelectedCustomPerms((prev) =>
      prev.includes(pKey) ? prev.filter((p) => p !== pKey) : [...prev, pKey]
    );
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      notifyWarning("First and last name are required");
      return;
    }

    try {
      setSubmitting(true);
      if (editingStaff) {
        const updated = await adminRbacApi.updateStaff(editingStaff.id, {
          firstName,
          lastName,
          phone: phone.trim() || undefined,
          role: selectedRole,
          assignedRoleIds: selectedRoleIds,
          customPermissions: selectedCustomPerms,
        });
        notifyApiSuccess(updated);
      } else {
        if (!email.trim()) {
          notifyWarning("Email address is required");
          return;
        }
        const created = await adminRbacApi.createStaff({
          email,
          password: password.trim() || undefined,
          firstName,
          lastName,
          phone: phone.trim() || undefined,
          role: selectedRole,
          assignedRoleIds: selectedRoleIds,
          customPermissions: selectedCustomPerms,
        });
        notifyApiSuccess(created);
      }
      setIsModalOpen(false);
      fetchStaffData();
    } catch (error: any) {
      notifyApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatusClick = (staff: StaffUserDto) => {
    if (staff.isActive) {
      // Prompt for deactivation reason
      setStatusTarget(staff);
      setDeactivationReason("");
    } else {
      // Immediately reactivate
      executeToggleStatus(staff, true);
    }
  };

  const executeToggleStatus = async (staff: StaffUserDto, makeActive: boolean, reason?: string) => {
    try {
      setUpdatingStatus(true);
      const updated = await adminRbacApi.updateStaffStatus(staff.id, makeActive, reason);
      notifyApiSuccess(updated);
      setStatusTarget(null);
      fetchStaffData();
    } catch (error: any) {
      notifyApiError(error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteStaff = async (staff: StaffUserDto) => {
    if (
      !confirm(
        `Are you sure you want to permanently remove staff member '${staff.firstName} ${staff.lastName}' (${staff.email})?`
      )
    ) {
      return;
    }

    try {
      const deleted = await adminRbacApi.deleteStaff(staff.id);
      notifyApiSuccess(deleted);
      fetchStaffData();
    } catch (error: any) {
      notifyApiError(error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Staff & Team Management
            </h1>
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]"
            >
              Access Control
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Enroll administrative team members, assign operational roles, and manage access
            security.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm">
            <UserPlus className="h-4 w-4" />
            <span>Enroll Staff Member</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Total Staff Members</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{staffList.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Active Team Accounts</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {staffList.filter((s) => s.isActive).length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Super Administrators</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">
                {staffList.filter((s) => s.role === "superadmin").length}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Available Roles</p>
              <h3 className="text-xl font-bold text-foreground mt-0.5">{roles.length}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={roleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("all")}
            className="h-8 text-xs"
          >
            All Staff
          </Button>
          <Button
            variant={roleFilter === "superadmin" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("superadmin")}
            className="h-8 text-xs"
          >
            Superadmin
          </Button>
          <Button
            variant={roleFilter === "admin" ? "default" : "outline"}
            size="sm"
            onClick={() => setRoleFilter("admin")}
            className="h-8 text-xs"
          >
            Admin
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-bold text-xs">Staff Member</TableHead>
              <TableHead className="font-bold text-xs">Administrative Tier</TableHead>
              <TableHead className="font-bold text-xs">Assigned Roles</TableHead>
              <TableHead className="font-bold text-xs">Effective Access</TableHead>
              <TableHead className="font-bold text-xs">Status</TableHead>
              <TableHead className="font-bold text-xs">Last Login</TableHead>
              <TableHead className="text-right font-bold text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs">Loading staff roster...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-semibold">
                      No staff members found matching criteria
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((staff) => {
                const initials =
                  `${staff.firstName[0] || ""}${staff.lastName[0] || ""}`.toUpperCase();
                const isSuperadmin = staff.role === "superadmin";

                return (
                  <TableRow key={staff.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                          {initials || "ST"}
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            <span>
                              {staff.firstName} {staff.lastName}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{staff.email}</span>
                          </div>
                          {staff.phone && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                              <Phone className="h-2.5 w-2.5" />
                              <span>{staff.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={isSuperadmin ? "default" : "secondary"}
                        className={`text-[10px] uppercase font-mono tracking-wider ${
                          isSuperadmin
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {staff.role}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {staff.assignedRoles.length > 0 ? (
                          staff.assignedRoles.map((r) => (
                            <Badge
                              key={r.id}
                              variant="outline"
                              className="text-[10px] font-medium bg-accent/30 text-foreground"
                            >
                              {r.displayName || r.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            None assigned
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] border-border text-foreground"
                        >
                          {isSuperadmin
                            ? "Root (*)"
                            : `${staff.effectivePermissions.length} permissions`}
                        </Badge>
                        {staff.customPermissions.length > 0 && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          >
                            +{staff.customPermissions.length} custom
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={staff.isActive}
                          onCheckedChange={() => handleToggleStatusClick(staff)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                        <span className="text-xs font-medium">
                          {staff.isActive ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                          ) : (
                            <span className="text-muted-foreground">Disabled</span>
                          )}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {staff.lastLoginAt ? (
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(staff.lastLoginAt).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] italic">Never</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel className="text-xs">Staff Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(staff)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Edit Dossier</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatusClick(staff)}
                            className="text-xs gap-2 cursor-pointer"
                          >
                            <Power className="h-3.5 w-3.5" />
                            <span>{staff.isActive ? "Deactivate" : "Activate"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteStaff(staff)}
                            className="text-xs gap-2 text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Account</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Enroll / Edit Staff Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>{editingStaff ? "Edit Staff Dossier" : "Enroll Staff Member"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure identity credentials, administrative tier, and assigned operational roles.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitStaff} className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-bold">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Julian"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-bold">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Laurent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold">
                  Atelier Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="julian@veyora.luxury"
                  disabled={Boolean(editingStaff)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold">
                  Contact Phone
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {!editingStaff && (
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold">
                  Initial Temporary Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty for default 'TemporaryPass123!'"
                />
              </div>
            )}

            {/* Administrative Tier */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <Label className="text-xs font-bold">Administrative Tier</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setSelectedRole("admin")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === "admin"
                      ? "bg-primary/5 border-primary text-foreground"
                      : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Administrator</span>
                    {selectedRole === "admin" && <ShieldCheck className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Standard staff member bound by assigned roles and permissions.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedRole("superadmin")}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedRole === "superadmin"
                      ? "bg-purple-500/10 border-purple-500 text-foreground"
                      : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between">
                    <span>Superadmin</span>
                    {selectedRole === "superadmin" && (
                      <Shield className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Full, root access across the entire platform ecosystem (*).
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Roles Multi-select */}
            {selectedRole === "admin" && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">
                    Assigned Operational Roles ({selectedRoleIds.length} selected)
                  </Label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
                  {roles
                    .filter((r) => r.name !== "superadmin")
                    .map((r) => {
                      const isSelected = selectedRoleIds.includes(r.id);
                      return (
                        <div
                          key={r.id}
                          onClick={() => toggleRoleId(r.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSelected
                              ? "bg-primary/5 border-primary/40 text-foreground"
                              : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="mt-0.5 h-3.5 w-3.5 rounded text-primary"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-semibold block">{r.displayName}</span>
                            <span className="text-[10px] text-muted-foreground line-clamp-1">
                              {r.description || `${r.permissions.length} permissions`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Custom Permissions Accordion */}
            {selectedRole === "admin" && (
              <details className="space-y-2 pt-2 border-t border-border group">
                <summary className="text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground flex items-center justify-between py-1">
                  <span>
                    Additional Direct Custom Permissions ({selectedCustomPerms.length} granted)
                  </span>
                  <span className="text-[10px] font-mono text-primary font-normal">
                    Click to expand
                  </span>
                </summary>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 pt-2">
                  {permissions.map((p) => {
                    const isGranted = selectedCustomPerms.includes(p.key);
                    return (
                      <div
                        key={p.key}
                        onClick={() => toggleCustomPerm(p.key)}
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                          isGranted
                            ? "bg-amber-500/10 border-amber-500/40 text-foreground"
                            : "bg-background border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <div className="text-xs font-medium">{p.label}</div>
                        <span className="text-[9px] font-mono text-muted-foreground">{p.key}</span>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}

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
                <span>{editingStaff ? "Save Dossier" : "Enroll Member"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivation Reason Modal */}
      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => !open && setStatusTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Power className="h-5 w-5 text-destructive" />
              <span>Deactivate Staff Account</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to suspend administrative access for{" "}
              <strong className="text-foreground">{statusTarget?.email}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reason" className="text-xs font-semibold">
              Reason for Deactivation (Optional)
            </Label>
            <Input
              id="reason"
              placeholder="e.g. Departure from atelier team, role rotation"
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusTarget(null)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                statusTarget && executeToggleStatus(statusTarget, false, deactivationReason)
              }
              disabled={updatingStatus}
              className="gap-2"
            >
              {updatingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm Deactivation</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
