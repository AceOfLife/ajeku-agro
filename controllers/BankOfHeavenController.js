const { BankOfHeaven, Transaction, Property, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate monthly income
async function calculateMonthlyIncome(transaction) {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const monthlyTransactions = await Transaction.findAll({
    where: {
      transaction_date: { 
        [Op.gte]: lastMonth 
      }
    },
    transaction
  });
  
  return monthlyTransactions.reduce((sum, tx) => 
    sum + parseFloat(tx.price || 0), 0);
}

// Controller functions
const getBankSummary = async (req, res) => {
  try {
    const bankData = await BankOfHeaven.findOne({
      where: { id: 1 },
      raw: true,
      attributes: [
        'id',
        'current_balance',
        'expenses_per_month',
        'income_per_month',
        'transactions',
        'createdAt',
        'updatedAt',
        'previous_month_data',
        'percentage_changes'
      ]
    });

    if (!bankData) {
      return res.status(404).json({
        success: false,
        message: 'Bank record not found'
      });
    }

    let total_income = 0;
    try {
      const allTransactions = await Transaction.findAll({
        attributes: ['price'],
        raw: true
      });
      total_income = allTransactions.reduce((sum, tx) => 
        sum + parseFloat(tx.price || 0), 0);
    } catch (calcError) {
      console.error('Income calculation error:', calcError);
      total_income = parseFloat(bankData.income_per_month) || 0;
    }

    const formatPercentage = (value) => {
      const num = parseFloat(value || 0);
      return num > 0 ? `+${num.toFixed(1)}%` : `${num.toFixed(1)}%`;
    };

    res.json({
      success: true,
      data: {
        ...bankData,
        current_balance: Number(bankData.current_balance),
        expenses_per_month: Number(bankData.expenses_per_month),
        income_per_month: Number(bankData.income_per_month),
        total_income: Number(total_income.toFixed(2)),
        total_expenses: Number(bankData.expenses_per_month),
        percentage_changes: bankData.percentage_changes ? {
          income: formatPercentage(bankData.percentage_changes.income),
          expenses: formatPercentage(bankData.percentage_changes.expenses),
          balance: formatPercentage(bankData.percentage_changes.balance)
        } : null,
        previous_month_comparison: bankData.previous_month_data || null
      }
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const updateBankSummary = async (req, res) => {
  let t;
  try {
    t = await sequelize.transaction();
    const { expenses } = req.body;
    
    const [bankData] = await BankOfHeaven.findOrCreate({
      where: { id: 1 },
      defaults: { current_balance: 0 },
      transaction: t
    });

    // Convert all numbers to proper float values
    const previousValues = {
      income: parseFloat(bankData.income_per_month || 0),
      expenses: parseFloat(bankData.expenses_per_month || 0),
      balance: parseFloat(bankData.current_balance || 0)
    };

    const allTransactions = await Transaction.findAll({ transaction: t });
    const total_income = allTransactions.reduce((sum, tx) => 
      sum + parseFloat(tx.price || 0), 0);

    const newExpenses = expenses.reduce((sum, e) => 
      sum + parseFloat(e.amount || 0), 0);
    
    const monthlyIncome = await calculateMonthlyIncome(t);

    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };

    const currentExpenses = parseFloat(bankData.expenses_per_month || 0) + newExpenses;
    const currentBalance = total_income - currentExpenses;

    const percentageChanges = {
      income: calculatePercentageChange(monthlyIncome, previousValues.income),
      expenses: calculatePercentageChange(newExpenses, previousValues.expenses),
      balance: calculatePercentageChange(currentBalance, previousValues.balance)
    };

    await bankData.update({
      current_balance: currentBalance,
      income_per_month: monthlyIncome,
      expenses_per_month: currentExpenses,
      transactions: [...(bankData.transactions || []), ...expenses],
      previous_month_data: previousValues,
      percentage_changes: percentageChanges
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      data: {
        current_balance: parseFloat(currentBalance.toFixed(2)),
        expenses_this_month: parseFloat(newExpenses.toFixed(2)),
        income_this_month: parseFloat(monthlyIncome.toFixed(2)),
        all_time_income: parseFloat(total_income.toFixed(2)),
        all_time_expenses: parseFloat(currentExpenses.toFixed(2)),
        percentage_changes: {
          income: parseFloat(percentageChanges.income.toFixed(1)) + '%',
          expenses: parseFloat(percentageChanges.expenses.toFixed(1)) + '%',
          balance: parseFloat(percentageChanges.balance.toFixed(1)) + '%'
        }
      }
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Update error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating bank summary'
    });
  }
};

module.exports = {
  getBankSummary,
  updateBankSummary
};