import { Request, Response, NextFunction } from "express";
import { AdminCouponListQuery, ApiCouponCode } from "@veyora/types";
import { couponService } from "../services/coupon.service";
import { sendSuccess } from "../../../utils/response";

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

      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPON_VALIDATED,
        message: result.message,
        data: result,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPONS_FETCHED,
        message: "Coupons retrieved successfully.",
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
   * Admin: Get coupon details by ID
   */
  public async getCouponById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const coupon = await couponService.getCouponById(id!);
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPON_FETCHED,
        message: "Coupon retrieved successfully.",
        data: coupon,
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
      sendSuccess(res, {
        statusCode: 201,
        code: ApiCouponCode.COUPON_CREATED,
        message: "Coupon created successfully.",
        data: coupon,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPON_UPDATED,
        message: "Coupon updated successfully.",
        data: coupon,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPON_STATUS_UPDATED,
        message: `Coupon is now ${coupon.isActive ? "active" : "inactive"}.`,
        data: coupon,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPON_DELETED,
        message: "Coupon deleted successfully.",
        data: null,
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
      sendSuccess(res, {
        statusCode: 200,
        code: ApiCouponCode.COUPON_ANALYTICS_FETCHED,
        message: "Coupon analytics retrieved successfully.",
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const couponController = new CouponController();
