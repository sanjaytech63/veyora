import { UserRole } from "./auth";
import { AddressDto } from "./address";
import { OrderDto } from "./order";

export interface CustomerDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  statusReason?: string | null;
  notes?: string | null;
  ordersCount: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerDetailDto extends CustomerDto {
  addresses: AddressDto[];
  recentOrders: OrderDto[];
}

export interface CustomerActivityDto {
  id: string;
  customerId: string;
  action: string;
  performedBy: string;
  performerRole: string;
  details?: Record<string, unknown>;
  reason?: string | null;
  timestamp: string;
}

export interface AdminCustomerListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "active" | "inactive";
  isEmailVerified?: boolean;
  sortBy?: "createdAt" | "name" | "ordersCount" | "totalSpent";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedCustomersDto {
  items: CustomerDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UpdateCustomerStatusPayload {
  isActive: boolean;
  reason?: string;
}

export interface UpdateCustomerNotesPayload {
  notes: string;
}
