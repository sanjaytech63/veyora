import { Router } from "express";
import { addressController } from "./controllers/address.controller";
import { optionalAuth } from "../../middleware/auth";
import { validate } from "../../middleware/validate-request";
import {
  createAddressSchema,
  updateAddressSchema,
  addressParamSchema,
} from "@veyora/validators";

const router = Router();

router.use("/addresses", optionalAuth);

// 1. List addresses
router.get("/addresses", addressController.listAddresses.bind(addressController));

// 2. Create address
router.post(
  "/addresses",
  validate({ body: createAddressSchema }),
  addressController.createAddress.bind(addressController)
);

// 3. Update address
router.put(
  "/addresses/:addressId",
  validate({ params: addressParamSchema, body: updateAddressSchema }),
  addressController.updateAddress.bind(addressController)
);

// 4. Delete address
router.delete(
  "/addresses/:addressId",
  validate({ params: addressParamSchema }),
  addressController.deleteAddress.bind(addressController)
);

// 5. Set default address
router.patch(
  "/addresses/:addressId/default",
  validate({ params: addressParamSchema }),
  addressController.setDefaultAddress.bind(addressController)
);

export const addressRouter = router;
