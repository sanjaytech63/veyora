import { Request, Response, NextFunction } from "express";
import { checkoutService } from "../services/checkout.service";
import { sendSuccess } from "../../../utils/response";

export class AddressController {
  public async listAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await checkoutService.listAddresses(req.user?.id, req.guestId);
      sendSuccess(res, {
        statusCode: 200,
        code: "CUSTOMER_ADDRESSES_FETCHED",
        message: "Addresses retrieved successfully.",
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  public async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = await checkoutService.createAddress(req.user?.id, req.guestId, req.body);
      sendSuccess(res, {
        statusCode: 201,
        code: "CUSTOMER_ADDRESS_CREATED",
        message: "Address created successfully.",
        data: address,
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
      sendSuccess(res, {
        statusCode: 200,
        code: "CUSTOMER_ADDRESS_UPDATED",
        message: "Address updated successfully.",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await checkoutService.deleteAddress(req.user?.id, req.guestId, req.params["addressId"]!);
      sendSuccess(res, {
        statusCode: 200,
        code: "CUSTOMER_ADDRESS_DELETED",
        message: "Address deleted successfully.",
        data: null,
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
      sendSuccess(res, {
        statusCode: 200,
        code: "CUSTOMER_DEFAULT_ADDRESS_UPDATED",
        message: "Default address set successfully.",
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const addressController = new AddressController();
