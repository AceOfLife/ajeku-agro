const { Farm, User, Transaction, FarmSalesGoal } = require('../models');
const bcryptjs = require('bcryptjs');
const { uploadImagesToCloudinary } = require('../config/multerConfig');
const { Op } = require('sequelize');

const AdminController = {};

AdminController.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, address, contactNumber, city, state, gender } = req.body;
    const adminId = req.user.id;

    const admin = await User.findOne({ where: { id: adminId } });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.firstName = firstName || admin.firstName;
    admin.lastName = lastName || admin.lastName;
    admin.email = email || admin.email;
    admin.address = address || admin.address;
    admin.contactNumber = contactNumber || admin.contactNumber;
    admin.city = city || admin.city;
    admin.state = state || admin.state;
    admin.gender = gender ? gender.toLowerCase() : admin.gender;

    if (req.files && req.files.length > 0) {
      const uploadedImages = await uploadImagesToCloudinary(req.files);
      const profileImageUrl = uploadedImages[0];
      admin.profileImage = profileImageUrl;
    }

    await admin.save();

    res.status(200).json({
      message: 'Admin profile updated successfully',
      user: {
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        address: admin.address,
        contactNumber: admin.contactNumber,
        city: admin.city,
        state: admin.state,
        gender: admin.gender,
        profileImage: admin.profileImage,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error });
  }
};

AdminController.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'Old password, new password, and confirm password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const admin = await User.findByPk(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    const isPasswordValid = await bcryptjs.compare(oldPassword, admin.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.status(200).json({ message: 'Password successfully updated.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Server error while changing password.' });
  }
};

AdminController.getProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const admin = await User.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const adminProfile = {
      id: admin.id,
      name: admin.name,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      address: admin.address,
      contactNumber: admin.contactNumber,
      city: admin.city,
      state: admin.state,
      gender: admin.gender,
      profileImage: admin.profileImage,
    };

    res.status(200).json({ admin: adminProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

AdminController.getAdminStats = async (req, res) => {
  try {
    const [totalFarms, totalRevenueData, totalFarmManagers, totalInvestors] = await Promise.all([
      Farm.count(),
      Transaction.sum('price', { where: { status: 'success' } }),
      User.count({ where: { role: 'farm_manager' } }),
      User.count({ where: { role: 'investor' } }),
    ]);

    res.status(200).json({
      totalFarms,
      totalRevenue: totalRevenueData || 0,
      totalFarmManagers,
      totalInvestors,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Failed to fetch admin statistics', error });
  }
};

AdminController.getReferralStats = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['referralSource'],
      where: {
        referralSource: { [Op.not]: null },
      },
    });

    const total = users.length;
    const counts = {};

    for (const user of users) {
      const source = user.referralSource;
      counts[source] = (counts[source] || 0) + 1;
    }

    const percentages = {};
    for (const [key, value] of Object.entries(counts)) {
      percentages[key] = ((value / total) * 100).toFixed(2);
    }

    res.status(200).json({ totalResponses: total, percentages });
  } catch (error) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ message: 'Failed to get referral stats', error });
  }
};

AdminController.setSalesGoals = async (req, res) => {
  try {
    const { month, year, goal_farm_units = 0, goal_hectares_acres = 0, goal_investors = 0 } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required." });
    }

    const [goal, created] = await FarmSalesGoal.findOrCreate({
      where: { month, year },
      defaults: { goal_farm_units, goal_hectares_acres, goal_investors }
    });

    if (!created) {
      goal.goal_farm_units = goal_farm_units;
      goal.goal_hectares_acres = goal_hectares_acres;
      goal.goal_investors = goal_investors;
      await goal.save();
    }

    return res.status(200).json({ message: "Sales goals set successfully", goal });
  } catch (error) {
    console.error("Error setting sales goals:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

AdminController.getSalesGoalsProgress = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required in query" });
    }

    const goal = await FarmSalesGoal.findOne({ where: { month, year } });
    if (!goal) {
      return res.status(404).json({ message: "Sales goal not set for this period." });
    }

    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const transactions = await Transaction.findAll({
      where: {
        status: 'success',
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      include: {
        model: Farm,
        as: 'farm',
        attributes: ['id', 'crop_type']
      }
    });

    let farmUnitsTotal = 0, hectaresTotal = 0, investorsTotal = 0;

    for (const tx of transactions) {
      const amount = Number(tx.price);
      
      if (tx.payment_type === 'farm_unit' || tx.payment_type === 'fractional') {
        farmUnitsTotal += amount;
      } else if (tx.payment_type === 'farm_installment' || tx.payment_type === 'installment') {
        hectaresTotal += amount;
      } else {
        investorsTotal += amount;
      }
    }

    const result = {
      farmUnits: {
        goal: goal.goal_farm_units,
        achieved: farmUnitsTotal,
        percentage: goal.goal_farm_units ? Math.min(100, Math.round((farmUnitsTotal / goal.goal_farm_units) * 100)) : 0
      },
      hectaresAcres: {
        goal: goal.goal_hectares_acres,
        achieved: hectaresTotal,
        percentage: goal.goal_hectares_acres ? Math.min(100, Math.round((hectaresTotal / goal.goal_hectares_acres) * 100)) : 0
      },
      investors: {
        goal: goal.goal_investors,
        achieved: investorsTotal,
        percentage: goal.goal_investors ? Math.min(100, Math.round((investorsTotal / goal.goal_investors) * 100)) : 0
      }
    };

    return res.status(200).json({ message: "Sales progress fetched", result });
  } catch (error) {
    console.error("Error fetching sales progress:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};

module.exports = AdminController;