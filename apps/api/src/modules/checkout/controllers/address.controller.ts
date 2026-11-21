import { Request, Response, NextFunction } from "express";
import { checkoutService } from "../services/checkout.service";

export class AddressController {
  public async listAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await checkoutService.listAddresses(req.user?.id, req.guestId);
      res.status(200).json({
        success: true,
        data: addresses,
        message: "Addresses retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await checkoutService.createAddress(req.user?.id, req.guestId, req.body);
      res.status(201).json({
        success: true,
        data: address,
        message: "Address created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await checkoutService.updateAddress(
        req.user?.id,
        req.guestId,
        req.params["addressId"]!,
        req.body
      );
      res.status(200).json({
        success: true,
        data: address,
        message: "Address updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await checkoutService.deleteAddress(req.user?.id, req.guestId, req.params["addressId"]!);
      res.status(200).json({
        success: true,
        data: null,
        message: "Address deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  public async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await checkoutService.setDefaultAddress(
        req.user?.id,
        req.guestId,
        req.params["addressId"]!
      );
      res.status(200).json({
        success: true,
        data: address,
        message: "Default address set successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const addressController = new AddressController();
