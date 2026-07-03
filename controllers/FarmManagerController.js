const { FarmManager, User } = require('../models');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../models');

// ===== GET ALL FARM MANAGERS (with first and last name) =====
exports.getAllFarmManagers = async (req, res) => {
  try {
    const farmManagers = await FarmManager.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'name']
        }
      ]
    });
    res.status(200).json(farmManagers);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving farm managers', error });
  }
};

// ===== GET FARM MANAGER BY ID (with first and last name) =====
exports.getFarmManagerById = async (req, res) => {
  try {
    const { id } = req.params;

    const farmManager = await FarmManager.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'name']
        }
      ]
    });

    if (!farmManager) {
      return res.status(404).json({ message: 'Farm manager not found' });
    }

    res.status(200).json(farmManager);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving farm manager', error });
  }
};

// ===== CREATE FARM MANAGER (from existing user) =====
exports.createFarmManager = async (req, res) => {
  try {
    const newFarmManager = await FarmManager.create(req.body);

    // Fetch the created farm manager with user details
    const farmManagerWithUser = await FarmManager.findByPk(newFarmManager.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'name']
        }
      ]
    });

    res.status(201).json(farmManagerWithUser);
  } catch (error) {
    res.status(400).json({ message: 'Error creating farm manager', error });
  }
};

// ===== UPDATE FARM MANAGER =====
exports.updateFarmManager = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await FarmManager.update(req.body, { where: { id } });

    if (updated) {
      const updatedFarmManager = await FarmManager.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'name']
          }
        ]
      });
      res.status(200).json(updatedFarmManager);
    } else {
      res.status(404).json({ message: 'Farm manager not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating farm manager', error });
  }
};

// ===== DELETE FARM MANAGER =====
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

// ===== CREATE FARM MANAGER WITH USER (Admin creates both) =====
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

    // Fetch the created farm manager with user details for response
    const farmManagerWithUser = await FarmManager.findByPk(newFarmManager.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Farm manager created successfully',
      farmManager: farmManagerWithUser
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error('Error creating farm manager with user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating farm manager',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== GET ALL SPECIALIZATIONS =====
exports.getSpecializations = async (req, res) => {
  try {
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

// ===== ADD NEW SPECIALIZATION (Admin only) =====
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