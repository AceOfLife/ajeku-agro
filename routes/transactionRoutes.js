const express = require("express");
const router = express.Router();
const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getUserTransactionHistory,
} = require("../controllers/TransactionController");

const { authenticate, authorizeAdmin } = require("../middlewares/authMiddleware");

// User's personal transaction history
router.get("/my-history", authenticate, getUserTransactionHistory);

// Admin only routes
router.post("/create", authenticate, authorizeAdmin, createTransaction);
router.get("/", authenticate, authorizeAdmin, getAllTransactions);
router.get("/:id", authenticate, authorizeAdmin, getTransactionById);

module.exports = router;