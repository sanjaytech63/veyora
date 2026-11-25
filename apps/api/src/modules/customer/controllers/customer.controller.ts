import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customer.service";
import { AdminCustomerListQuery, ApiCustomerAdminCode } from "@veyora/types";
import { sendSuccess } from "../../../utils/response";

export class CustomerController {
  /**
   * Admin: List all customers with search, filter, pagination
   */
  public async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paginated = await customerService.listCustomers(
        req.query as unknown as AdminCustomerListQuery
      );
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMERS_FETCHED,
        message: "Customers retrieved successfully.",
        data: paginated,
        meta: {
          pagination: {
            page: paginated.page,
            limit: paginated.limit,
            total: paginated.total,
            totalPages: paginated.totalPages,
            hasNextPage: paginated.page < paginated.totalPages,
            hasPrevPage: paginated.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get customer details by ID (profile, addresses, stats, recent orders)
   */
  public async getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.getCustomerById(req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMER_FETCHED,
        message: "Customer details retrieved successfully.",
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get customer orders with pagination
   */
  public async getCustomerOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orders = await customerService.getCustomerOrders(
        req.params.id as string,
        req.query as unknown as { page?: number; limit?: number }
      );
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMER_ORDERS_FETCHED,
        message: "Customer orders retrieved successfully.",
        data: orders,
        meta: {
          pagination: {
            page: orders.page,
            limit: orders.limit,
            total: orders.total,
            totalPages: orders.totalPages,
            hasNextPage: orders.page < orders.totalPages,
            hasPrevPage: orders.page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get customer saved addresses
   */
  public async getCustomerAddresses(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const addresses = await customerService.getCustomerAddresses(req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMER_ADDRESSES_FETCHED,
        message: "Customer addresses retrieved successfully.",
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update customer active status (activate/suspend) with reason
   */
  public async updateCustomerStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const adminUser = {
        id: req.user?.id || "admin",
        email: req.user?.email || "admin@veyora.com",
        role: req.user?.role || "admin",
      };

      const updated = await customerService.updateCustomerStatus(
        req.params.id as string,
        req.body,
        adminUser
      );
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMER_STATUS_UPDATED,
        message: `Customer account is now ${updated.isActive ? "active" : "inactive"}.`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update customer internal dossier notes
   */
  public async updateCustomerNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUser = {
        id: req.user?.id || "admin",
        email: req.user?.email || "admin@veyora.com",
        role: req.user?.role || "admin",
      };

      const updated = await customerService.updateCustomerNotes(
        req.params.id as string,
        req.body,
        adminUser
      );
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMER_NOTES_UPDATED,
        message: "Customer notes updated successfully.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get customer account activity audit log
   */
  public async getCustomerActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activity = await customerService.getCustomerActivity(req.params.id as string);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCustomerAdminCode.ADMIN_CUSTOMER_ACTIVITY_FETCHED,
        message: "Customer activity log retrieved successfully.",
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
