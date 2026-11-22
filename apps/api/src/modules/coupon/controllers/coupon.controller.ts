import { Request, Response, NextFunction } from "express";
import { AdminCouponListQuery } from "@veyora/types";
import { couponService } from "../services/coupon.service";

export class CouponController {
  /**
   * Customer: Validate coupon code against bag/cart
   */
  public async validateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, cartTotal, items } = req.body;
      const result = await couponService.validateAndCalculateDiscount(code, cartTotal, items, {
        userId: req.user?.id,
        email: req.user?.email,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List coupons
   */
  public async listCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const paginated = await couponService.listCoupons(
        req.query as unknown as AdminCouponListQuery
      );
      res.status(200).json({
        success: true,
        data: paginated,
        message: "Coupons retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get coupon details by ID
   */
  public async getCouponById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id!);
      res.status(200).json({
        success: true,
        data: coupon,
        message: "Coupon retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Create new coupon
   */
  public async createCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const coupon = await couponService.createCoupon(req.body);
      res.status(201).json({
        success: true,
        data: coupon,
        message: "Coupon created successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update coupon
   */
  public async updateCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const coupon = await couponService.updateCoupon(id!, req.body);
      res.status(200).json({
        success: true,
        data: coupon,
        message: "Coupon updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Toggle coupon active/inactive status
   */
  public async toggleCouponStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const coupon = await couponService.toggleCouponStatus(id!);
      res.status(200).json({
        success: true,
        data: coupon,
        message: `Coupon is now ${coupon.isActive ? "active" : "inactive"}.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete coupon
   */
  public async deleteCoupon(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await couponService.deleteCoupon(id!);
      res.status(200).json({
        success: true,
        message: "Coupon deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get coupon analytics
   */
  public async getCouponAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const analytics = await couponService.getCouponAnalytics(id!);
      res.status(200).json({
        success: true,
        data: analytics,
        message: "Coupon analytics retrieved successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const couponController = new CouponController();
