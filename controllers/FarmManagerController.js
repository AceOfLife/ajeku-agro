const { FarmManager, User } = require('../models');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');

exports.getAllFarmManagers = async (req, res) => {
  try {
    const farmManagers = await FarmManager.findAll();
    res.status(200).json(farmManagers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving farm managers', error });
  }
};

exports.createFarmManager = async (req, res) => {
  try {
    const newFarmManager = await FarmManager.create(req.body);
    res.status(201).json(newFarmManager);
  } catch (error) {
    res.status(400).json({ message: 'Error creating farm manager', error });
  }
};

exports.updateFarmManager = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await FarmManager.update(req.body, { where: { id } });

    if (updated) {
      const updatedFarmManager = await FarmManager.findOne({ where: { id } });
      res.status(200).json(updatedFarmManager);
    } else {
      res.status(404).json({ message: 'Farm manager not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating farm manager', error });
  }
};

exports.deleteFarmManager = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FarmManager.destroy({ where: { id } });

    if (deleted) {
      res.status(204).json({ message: 'Farm manager deleted' });
    } else {
      res.status(404).json({ message: 'Farm manager not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting farm manager', error });
  }
};

// controllers/FarmManagerController.js - Add this new function

exports.createFarmManagerWithUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      email, 
      password, 
      license_number, 
      years_of_experience, 
      specialization, 
      contact_phone,
      firstName,
      lastName
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { email },
      transaction: t
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ 
        message: 'Email is already registered' 
      });
    }

    // Build name from firstName and lastName
    const fullName = `${firstName} ${lastName}`.trim();

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with farm_manager role
    const newUser = await User.create({
      name: fullName,
      firstName: firstName || '',
      lastName: lastName || '',
      email,
      password: hashedPassword,
      role: 'farm_manager'
    }, { transaction: t });

    // Create farm manager record
    const newFarmManager = await FarmManager.create({
      user_id: newUser.id,
      license_number,
      years_of_experience: years_of_experience || 0,
      specialization: specialization || null,
      contact_phone: contact_phone || null
    }, { transaction: t });

    // Send welcome notification
    const Notification = require('../models').Notification;
    const io = req.app.get('socketio');
    
    const notification = await Notification.create({
      user_id: newUser.id,
      title: 'Welcome to Ajeku Agro!',
      message: `Hi ${fullName}, your farm manager account has been created. You can now manage farms on the platform.`,
      type: 'system',
      is_read: false
    }, { transaction: t });

    // Notify admin
    const admins = await User.findAll({ 
      where: { role: 'admin' },
      transaction: t
    });

    await Promise.all(
      admins.map(admin => 
        Notification.create({
          user_id: admin.id,
          title: 'New Farm Manager Created',
          message: `Admin created a new farm manager: ${fullName} (${email})`,
          type: 'admin_alert',
          is_read: false,
          metadata: {
            farm_manager_id: newFarmManager.id,
            user_id: newUser.id
          }
        }, { transaction: t })
      )
    );

    await t.commit();

    // Real-time notifications
    if (io) {
      io.to(`user_${newUser.id}`).emit('new_notification', {
        event: 'system',
        data: notification
      });

      admins.forEach(admin => {
        io.to(`user_${admin.id}`).emit('new_notification', {
          event: 'admin_alert',
          data: { message: `New farm manager created: ${fullName}` }
        });
      });
    }

    res.status(201).json({
      success: true,
      message: 'Farm manager created successfully',
      farmManager: newFarmManager,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Error creating farm manager with user:', error);
    res.status(500).json({ 
      message: 'Error creating farm manager', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// controllers/FarmManagerController.js - Add these functions

// Get all specializations
exports.getSpecializations = async (req, res) => {
  try {
    // Query the ENUM type from PostgreSQL
    const [result] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_FarmManagers_specialization'
      )
      ORDER BY enumsortorder;
    `);

    const specializations = result.map(row => row.enumlabel);

    res.status(200).json({
      success: true,
      specializations
    });
  } catch (error) {
    console.error('Error fetching specializations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching specializations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add new specialization (Admin only)
exports.addSpecialization = async (req, res) => {
  try {
    const { specialization } = req.body;

    if (!specialization || typeof specialization !== 'string' || specialization.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Specialization name is required'
      });
    }

    // Check if specialization already exists
    const [existing] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_FarmManagers_specialization'
      )
      AND enumlabel = '${specialization}';
    `);

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Specialization '${specialization}' already exists`
      });
    }

    // Add new value to ENUM
    await sequelize.query(`
      ALTER TYPE "enum_FarmManagers_specialization" ADD VALUE '${specialization}';
    `);

    // Get updated list
    const [result] = await sequelize.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'enum_FarmManagers_specialization'
      )
      ORDER BY enumsortorder;
    `);

    const specializations = result.map(row => row.enumlabel);

    // Log the action
    console.log(`Admin ${req.user.id} added new specialization: ${specialization}`);

    res.status(201).json({
      success: true,
      message: `Specialization '${specialization}' added successfully`,
      specializations
    });

  } catch (error) {
    console.error('Error adding specialization:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding specialization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};