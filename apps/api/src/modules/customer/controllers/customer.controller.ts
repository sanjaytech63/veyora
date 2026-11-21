import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customer.service";
import { AdminCustomerListQuery } from "@veyora/types";

export class CustomerController {
  /**
   * Admin: List all customers with search, filter, pagination
   */
  public async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paginated = await customerService.listCustomers(req.query as unknown as AdminCustomerListQuery);
      res.status(200).json({
        success: true,
        data: paginated,
        message: "Customers retrieved successfully.",
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
      res.status(200).json({
        success: true,
        data: customer,
        message: "Customer details retrieved successfully.",
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
      res.status(200).json({
        success: true,
        data: orders,
        message: "Customer orders retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get customer saved addresses
   */
  public async getCustomerAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await customerService.getCustomerAddresses(req.params.id as string);
      res.status(200).json({
        success: true,
        data: addresses,
        message: "Customer addresses retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update customer active status (activate/suspend) with reason
   */
  public async updateCustomerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminUser = {
        id: req.user?.id || "admin",
        email: req.user?.email || "admin@veyora.com",
        role: req.user?.role || "admin",
      };

      const updated = await customerService.updateCustomerStatus(req.params.id as string, req.body, adminUser);
      res.status(200).json({
        success: true,
        data: updated,
        message: `Customer account is now ${updated.isActive ? "active" : "inactive"}.`,
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

      const updated = await customerService.updateCustomerNotes(req.params.id as string, req.body, adminUser);
      res.status(200).json({
        success: true,
        data: updated,
        message: "Customer notes updated successfully.",
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
      res.status(200).json({
        success: true,
        data: activity,
        message: "Customer activity log retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const customerController = new CustomerController();
