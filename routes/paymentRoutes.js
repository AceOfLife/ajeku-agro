const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware"); 

const { 
  initializePayment, 
  verifyPayment, 
  getFarmInstallmentStatus, 
  getUserFarmInstallments,
  processHarvestPayout,
} = require("../controllers/paymentController");

router.get("/verify-payment", verifyPayment);
router.post("/initialize-payment", authenticate, initializePayment);

router.get("/installment-status/:userId/:farmId", authenticate, getFarmInstallmentStatus);
router.get("/my-installments/:userId", authenticate, getUserFarmInstallments);

// NEW: Harvest payout routes
router.post("/harvest/:harvest_cycle_id/payout", authenticate, processHarvestPayout);


module.exports = router;