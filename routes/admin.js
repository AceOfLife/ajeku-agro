const express = require('express');
const router = express.Router();
const investorRoutes = require('./investorRoutes');
const messageRoutes = require('./messageRoutes');
const { Investor } = require('../models'); 

const InvestorController = require('../controllers/InvestorController');
const FarmManagerController = require('../controllers/FarmManagerController');
const FarmController = require('../controllers/FarmController');
const TransactionController = require('../controllers/TransactionController');
const MessageController = require('../controllers/MessageController');
const FarmReviewController = require('../controllers/FarmReviewController');
const UserController = require('../controllers/UserController');
const AdminController = require('../controllers/AdminController');
const DocumentController = require('../controllers/documentController');

const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/multerConfig');

const bankOfHeavenRoutes = require('./bankOfHeavenRoutes');

router.put('/profile', authenticate, authorizeAdmin, upload, AdminController.updateProfile);
router.get('/profile', authenticate, authorizeAdmin, AdminController.getProfile);
router.put('/change-password', authenticate, authorizeAdmin, AdminController.changePassword);

// Investor routes
router.get('/investors', authenticate, authorizeAdmin, InvestorController.getAllInvestors);
router.get('/investors/:id', authenticate, (req, res, next) => {
  const isAdmin = req.user.role === 'admin';
  
  Investor.findByPk(req.params.id).then(investor => {
    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    if (isAdmin || req.user.id === investor.user_id) {
      req.investor = investor;
      next();
    } else {
      res.status(403).json({ message: 'Access denied' });
    }
  }).catch(err => {
    res.status(500).json({ message: 'Error fetching investor', error: err.message });
  });
}, InvestorController.getInvestor);

router.delete('/investors/:id', authenticate, authorizeAdmin, InvestorController.deleteInvestor);
router.use('/investors', investorRoutes);

// Farm Manager routes
router.get('/farm-managers', authenticate, FarmManagerController.getAllFarmManagers);
router.post('/farm-managers', authenticate, authorizeAdmin, FarmManagerController.createFarmManager);
router.put('/farm-managers/:id', authenticate, authorizeAdmin, FarmManagerController.updateFarmManager);
router.delete('/farm-managers/:id', authenticate, authorizeAdmin, FarmManagerController.deleteFarmManager);

router.post('/farm-managers/create-with-user', authenticate, authorizeAdmin, FarmManagerController.createFarmManagerWithUser);

// Farm Manager Specializations
router.get('/specializations', authenticate, FarmManagerController.getSpecializations);
router.post('/specializations', authenticate, authorizeAdmin, FarmManagerController.addSpecialization);

// Farm routes
router.get('/farms', authenticate, FarmController.getAllFarms);
router.get('/farms/filter', authenticate, FarmController.getFilteredFarms);
router.post('/farms', authenticate, authorizeAdmin, FarmController.createFarm);
router.put('/farms/:id', authenticate, authorizeAdmin, FarmController.updateFarm);
router.delete('/farms/:id', authenticate, authorizeAdmin, FarmController.deleteFarm);
router.get('/farms/:id', FarmController.getFarmById);
router.post('/farms/:id/monthly-expense', authenticate, authorizeAdmin, FarmController.updateMonthlyExpense);
router.put('/farms/:id/valuation', authenticate, authorizeAdmin, FarmController.updateFarmValuation);
router.get('/farms/:farm_id/units', authenticate, FarmController.getFarmUnits);

// Transaction routes
router.get("/transactions/revenue", authenticate, authorizeAdmin, TransactionController.getRevenueStats);
router.get("/customer-map", authenticate, authorizeAdmin, TransactionController.getCustomerMap);
router.get("/transactions/recent-customers", authenticate, authorizeAdmin, TransactionController.getRecentCustomers);
router.get("/transactions/history", authenticate, authorizeAdmin, TransactionController.getTransactionHistory);
router.get('/transactions', authenticate, TransactionController.getAllTransactions);
router.get("/transactions/:id", authenticate, authorizeAdmin, TransactionController.getTransactionById);
router.post('/transactions', authenticate, authorizeAdmin, TransactionController.createTransaction);
router.put('/transactions/:id', authenticate, authorizeAdmin, TransactionController.updateTransaction);
router.delete('/transactions/:id', authenticate, authorizeAdmin, TransactionController.deleteTransaction);

router.use('/messages', messageRoutes);

// Farm Review routes
router.get('/reviews', authenticate, FarmReviewController.getAllFarmReviews);
router.post('/reviews', authenticate, FarmReviewController.createFarmReview);
router.put('/reviews/:id', authenticate, FarmReviewController.updateFarmReview);
router.delete('/reviews/:id', authenticate, authorizeAdmin, FarmReviewController.deleteFarmReview);

// Stats Routes
router.get('/stats/summary', authenticate, authorizeAdmin, AdminController.getAdminStats);
router.get('/stats/referrals', authenticate, authorizeAdmin, AdminController.getReferralStats);

// Sales Goals
router.post('/sales-goals', authenticate, authorizeAdmin, AdminController.setSalesGoals);
router.get('/sales-goals/progress', authenticate, authorizeAdmin, AdminController.getSalesGoalsProgress);

// User routes
router.post('/signup', UserController.createUser);
router.post('/users', authenticate, authorizeAdmin, UserController.createUser);

// Document verification
router.patch('/documents/verify/:documentId', 
  authenticate, 
  authorizeAdmin,
  DocumentController.verifyDocument
);

module.exports = router;