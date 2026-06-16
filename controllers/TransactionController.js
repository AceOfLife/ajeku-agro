const { Transaction, Farm, User, sequelize } = require('../models');
const { Op } = require("sequelize");

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Transaction.update(req.body, { where: { id } });

    if (updated) {
      const updatedTransaction = await Transaction.findOne({ where: { id } });
      res.status(200).json(updatedTransaction);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating transaction', error });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.destroy({ where: { id } });

    if (deleted) {
      res.status(204).json({ message: 'Transaction deleted' });
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting transaction', error });
  }
};

exports.createTransaction = async (req, res) => {
    try {
        const { user_id, farm_id, amount, payment_type, status, reference } = req.body;

        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const farm = await Farm.findByPk(farm_id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        const transaction = await Transaction.create({
            user_id,
            farm_id,
            price: amount,
            payment_type,
            status,
            reference,
            transaction_date: new Date()
        });

        res.status(201).json({ message: "Transaction recorded successfully", transaction });
    } catch (error) {
        console.error("Transaction Creation Error:", error);
        res.status(500).json({ message: "Error creating transaction", error });
    }
};

exports.getAllTransactions = async (req, res) => {
  try {
      const transactions = await Transaction.findAll({
          include: [
              {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'name', 'email'],
              },
              {
                  model: Farm,
                  as: 'farm',
                  attributes: ['id', 'name', 'location', 'price_per_unit'],
              }
          ],
          order: [['createdAt', 'DESC']],
      });

      return res.status(200).json({ transactions });
  } catch (error) {
      console.error("Error fetching transactions:", error);
      return res.status(500).json({ message: "Error fetching transactions", error });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
      const { id } = req.params;

      if (!id) {
          return res.status(400).json({ message: "Transaction ID is required" });
      }

      const transaction = await Transaction.findOne({
          where: { id },
          include: [
              {
                  model: User,
                  as: "user",
                  attributes: ["id", "name", "email"],
              },
              {
                  model: Farm,
                  as: "farm",
                  attributes: ["id", "name", "location", "price_per_unit"],
              },
          ],
      });

      if (!transaction) {
          return res.status(404).json({ message: "Transaction not found" });
      }

      return res.status(200).json({ transaction });
  } catch (error) {
      console.error("Error fetching transaction by ID:", error);
      return res.status(500).json({ message: "Error fetching transaction", error });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const { period } = req.query;
    const now = new Date();

    if (!["daily", "weekly", "monthly"].includes(period)) {
      return res.status(400).json({ message: "Invalid period. Use daily, weekly, or monthly." });
    }

    let data = [];

    if (period === "daily") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const transactions = await Transaction.findAll({
        where: {
          status: "success",
          transaction_date: { [Op.gte]: startOfMonth },
        },
        attributes: [
          [sequelize.fn("DATE", sequelize.col("transaction_date")), "date"],
          [sequelize.fn("SUM", sequelize.col("price")), "total"]
        ],
        group: [sequelize.fn("DATE", sequelize.col("transaction_date"))],
        raw: true,
      });

      const dateMap = {};
      transactions.forEach(t => {
        dateMap[new Date(t.date).getDate()] = parseFloat(t.total);
      });

      for (let day = 1; day <= daysInMonth; day++) {
        data.push(dateMap[day] || 0);
      }
    }

    else if (period === "weekly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const transactions = await Transaction.findAll({
        where: {
          status: "success",
          transaction_date: { [Op.gte]: startOfMonth },
        },
        attributes: [
          [sequelize.fn("DATE_TRUNC", "week", sequelize.col("transaction_date")), "week"],
          [sequelize.fn("SUM", sequelize.col("price")), "total"]
        ],
        group: [sequelize.fn("DATE_TRUNC", "week", sequelize.col("transaction_date"))],
        order: [[sequelize.fn("DATE_TRUNC", "week", sequelize.col("transaction_date")), "ASC"]],
        raw: true,
      });

      data = transactions.map(t => parseFloat(t.total));
    }

    else if (period === "monthly") {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const transactions = await Transaction.findAll({
        where: {
          status: "success",
          transaction_date: { [Op.gte]: startOfYear },
        },
        attributes: [
          [sequelize.fn("DATE_TRUNC", "month", sequelize.col("transaction_date")), "month"],
          [sequelize.fn("SUM", sequelize.col("price")), "total"]
        ],
        group: [sequelize.fn("DATE_TRUNC", "month", sequelize.col("transaction_date"))],
        order: [[sequelize.fn("DATE_TRUNC", "month", sequelize.col("transaction_date")), "ASC"]],
        raw: true,
      });

      const monthMap = {};
      transactions.forEach(t => {
        const monthIndex = new Date(t.month).getMonth();
        monthMap[monthIndex] = parseFloat(t.total);
      });

      for (let m = 0; m <= now.getMonth(); m++) {
        data.push(monthMap[m] || 0);
      }
    }

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching revenue stats:", error);
    res.status(500).json({ message: "Error fetching transaction", error });
  }
};

exports.getCustomerMap = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const daily = await Promise.all(
      Array.from({ length: daysInMonth }, async (_, i) => {
        const day = i + 1;
        const start = new Date(year, month, day);
        const end = new Date(year, month, day + 1);

        const count = await Transaction.count({
          where: {
            status: "success",
            transaction_date: {
              [Op.gte]: start,
              [Op.lt]: end
            }
          }
        });
        return count;
      })
    );

    const firstDayOfMonth = new Date(year, month, 1);
    const weeksInMonth = Math.ceil((firstDayOfMonth.getDay() + daysInMonth) / 7);

    const weekly = await Promise.all(
      Array.from({ length: weeksInMonth }, async (_, i) => {
        const start = new Date(year, month, 1 + i * 7);
        const end = new Date(year, month, 1 + (i + 1) * 7);

        const count = await Transaction.count({
          where: {
            status: "success",
            transaction_date: {
              [Op.gte]: start,
              [Op.lt]: end
            }
          }
        });
        return count;
      })
    );

    const monthly = await Promise.all(
      Array.from({ length: 12 }, async (_, i) => {
        const start = new Date(year, i, 1);
        const end = new Date(year, i + 1, 1);

        const count = await Transaction.count({
          where: {
            status: "success",
            transaction_date: {
              [Op.gte]: start,
              [Op.lt]: end
            }
          }
        });
        return count;
      })
    );

    return res.json({ success: true, data: { daily, weekly, monthly: monthly.slice(0, month + 1) } });
  } catch (error) {
    console.error("Error fetching customer map:", error);
    res.status(500).json({ message: "Error fetching customer map", error });
  }
};

exports.getRecentCustomers = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const transactions = await Transaction.findAll({
      where: {
        status: "success",
        createdAt: {
          [Op.gte]: twoWeeksAgo,
        },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name", "role", "profileImage"],
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    const users = transactions
      .map(t => t.user)
      .filter((u, index, self) => u && self.findIndex(x => x.name === u.name && x.role === u.role) === index);

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching recent customers:", error);
    return res.status(500).json({ message: "Error fetching recent customers", error });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name', 'crop_type', 'location'],
          include: [
            {
              model: User,
              as: 'manager',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      attributes: ['id', 'price', 'status', 'transaction_date'],
      order: [['transaction_date', 'DESC']]
    });

    const formattedTransactions = transactions.map(transaction => ({
      transactionId: transaction.id,
      userFrom: transaction.farm?.manager?.name || 'Ajeku',
      userTo: transaction.user?.name || 'Unknown',
      farmType: transaction.farm?.crop_type || 'N/A',
      location: transaction.farm?.location || 'N/A',
      date: transaction.transaction_date.toISOString().split('T')[0],
      status: transaction.status
    }));

    return res.status(200).json({ success: true, transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return res.status(500).json({ message: "Error fetching transaction history", error });
  }
};

exports.getUserTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Farm,
          as: "farm",
          attributes: ["id", "name", "crop_type", "location"],
          include: [
            {
              model: User,
              as: "manager",
              attributes: ["id", "name"]
            }
          ]
        }
      ],
      attributes: ["id", "price", "status", "transaction_date", "payment_type", "units_purchased"],
      order: [["transaction_date", "DESC"]]
    });

    const formattedTransactions = transactions.map((transaction) => {
      const isAdmin = transaction.farm?.listed_by?.toLowerCase() === "admin";
      const userFrom = isAdmin
        ? "Ajeku"
        : transaction.farm?.manager?.name || "Unknown";

      return {
        transactionId: transaction.id,
        userFrom,
        farmName: transaction.farm?.name || "Unknown",
        cropType: transaction.farm?.crop_type || "N/A",
        location: transaction.farm?.location || "N/A",
        amountPaid: transaction.price,
        status: transaction.status,
        paymentType: transaction.payment_type,
        unitsPurchased: transaction.units_purchased,
        date: transaction.transaction_date.toISOString().split("T")[0],
      };
    });

    return res.status(200).json({ success: true, transactions: formattedTransactions });
  } catch (error) {
    console.error("Error fetching user transaction history:", error);
    return res.status(500).json({ message: "Error fetching transaction history", error });
  }
};