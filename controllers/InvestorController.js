const { Investor, User, UserDocument, Notification, FarmUnit, Farm, FarmUnitOwnership, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { upload, uploadImagesToCloudinary, uploadDocumentsToCloudinary } = require('../config/multerConfig');

exports.getAllInvestors = async (req, res) => {
  try {
    const investors = await Investor.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: [
          'firstName', 
          'lastName', 
          'email', 
          'address', 
          'contactNumber', 
          'city', 
          'state', 
          'gender', 
          'profileImage'
        ]
      }],
      order: [['createdAt', 'DESC']]
    });

    const investorUserIds = investors.map(investor => investor.user_id);

    let userDocuments = [];
    if (investorUserIds.length > 0) {
      try {
        const documentWhere = {
          userId: investorUserIds,
          ...(!req.user.isAdmin)
        };

        userDocuments = await UserDocument.findAll({
          where: documentWhere,
          attributes: [
            'id',
            'userId',
            'documentType',
            'frontUrl',
            'backUrl',
            'status',
            ...(req.user.isAdmin ? [
              'verifiedAt',
              'verifiedBy',
              'adminNotes'
            ] : [])
          ],
          include: req.user.isAdmin ? [{
            model: User,
            as: 'verifier',
            attributes: ['firstName', 'lastName']
          }] : []
        });
      } catch (docError) {
        console.error('Document fetch error:', docError);
      }
    }

    const documentsByUserId = userDocuments.reduce((acc, doc) => {
      const docData = {
        id: doc.id,
        type: doc.documentType,
        frontUrl: doc.frontUrl,
        backUrl: doc.backUrl,
        status: doc.status,
        ...(req.user.isAdmin && {
          verifiedAt: doc.verifiedAt,
          verifiedBy: doc.verifier ? 
            `${doc.verifier.firstName} ${doc.verifier.lastName}` : 
            null,
          adminNotes: doc.adminNotes
        })
      };

      acc[doc.userId] = acc[doc.userId] || [];
      acc[doc.userId].push(docData);
      return acc;
    }, {});

    const response = investors.map(investor => {
      const user = investor.user || {};
      return {
        id: investor.id,
        user_id: investor.user_id,
        status: investor.status,
        createdAt: investor.createdAt,
        updatedAt: investor.updatedAt,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        contactNumber: user.contactNumber,
        city: user.city,
        state: user.state,
        gender: user.gender,
        profileImage: user.profileImage,
        documents: documentsByUserId[investor.user_id] || []
      };
    });

    res.status(200).json({
      success: true,
      count: response.length,
      data: response
    });

  } catch (error) {
    console.error('Investor retrieval failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve investors',
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        ...(error.errors && { details: error.errors.map(e => e.message) })
      } : undefined
    });
  }
};

exports.getInvestor = async (req, res) => {
  try {
    const investorId = req.params.id;

    const investor = await Investor.findByPk(investorId, {
      include: [{
        model: User,
        as: 'user',
        attributes: [
          'firstName', 'lastName', 'email',
          'address', 'contactNumber', 'city',
          'state', 'gender', 'profileImage'
        ]
      }]
    });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    let userDocuments = [];
    try {
      userDocuments = await UserDocument.findAll({
        where: { userId: investor.user_id },
        attributes: [
          'id',
          'documentType',
          'frontUrl',
          'backUrl',
          'status',
          ...(req.user.isAdmin ? [
            'verifiedAt',
            'verifiedBy',
            'adminNotes'
          ] : [])
        ],
        include: req.user.isAdmin ? [{
          model: User,
          as: 'verifier',
          attributes: ['firstName', 'lastName']
        }] : []
      });
    } catch (docError) {
      console.error('Document fetch error:', docError);
    }

    const documents = userDocuments.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      frontUrl: doc.frontUrl,
      backUrl: doc.backUrl,
      status: doc.status,
      ...(req.user.isAdmin && {
        verifiedAt: doc.verifiedAt,
        verifiedBy: doc.verifier ? 
          `${doc.verifier.firstName} ${doc.verifier.lastName}` : null,
        adminNotes: doc.adminNotes
      })
    }));

    res.status(200).json({
      id: investor.id,
      user_id: investor.user_id,
      firstName: investor.user.firstName,
      lastName: investor.user.lastName,
      email: investor.user.email,
      address: investor.user.address,
      contactNumber: investor.user.contactNumber,
      city: investor.user.city,
      state: investor.user.state,
      gender: investor.user.gender,
      profileImage: investor.user.profileImage,
      status: investor.status,
      createdAt: investor.createdAt,
      updatedAt: investor.updatedAt,
      documents: documents
    });

  } catch (error) {
    res.status(500).json({ 
      message: 'Error retrieving investor', 
      error: error.message 
    });
  }
};

exports.createInvestor = [
  check('name').notEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Enter a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    const io = req.app.get('socketio');

    const transaction = await sequelize.transaction();
    try {
      const existingUser = await User.findOne({ 
        where: { email },
        transaction 
      });
      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'investor',
      }, { transaction });

      const newInvestor = await Investor.create({
        user_id: newUser.id,
      }, { transaction });

      const investorNotification = await Notification.create({
        user_id: newUser.id,
        title: 'Welcome!',
        message: `Hi ${name}, your investor account was successfully created.`,
        type: 'system',
        is_read: false
      }, { transaction });

      const admins = await User.findAll({ 
        where: { role: 'admin' },
        transaction 
      });
      
      const adminNotifications = await Promise.all(
        admins.map(admin => 
          Notification.create({
            user_id: admin.id,
            title: 'New Investor Registration',
            message: `New investor: Name: ${name} Email: (${email})`,
            type: 'admin_alert',
            is_read: false
          }, { transaction })
        )
      );

      await transaction.commit();

      if (io) {
        io.to(`user_${newUser.id}`).emit('new_notification', {
          event: 'system',
          data: investorNotification
        });

        adminNotifications.forEach(notification => {
          io.to(`user_${notification.user_id}`).emit('new_notification', {
            event: 'admin_alert',
            data: notification
          });
        });
      }

      res.status(201).json({ 
        user: newUser, 
        investor: newInvestor 
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Investor creation error:', error);
      res.status(500).json({ 
        message: 'Error creating investor',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  },
];

exports.updateInvestorProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, address, contactNumber, city, state, gender } = req.body;
    const io = req.app.get('socketio');

    const investor = await Investor.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: User,
        as: 'user',
      }],
    });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    const user = investor.user;
    const oldEmail = user.email;

    if (req.files && req.files.length > 0) {
      const uploadedImages = await uploadImagesToCloudinary(req.files);
      const profileImageUrl = uploadedImages[0];
      user.profileImage = profileImageUrl;
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.address = address || user.address;
    user.contactNumber = contactNumber || user.contactNumber;
    user.city = city || user.city;
    user.state = state || user.state;
    user.gender = gender || user.gender;

    await user.save();

    const userNotification = await Notification.create({
      user_id: req.user.id,
      title: 'Profile Updated',
      message: 'Your profile information was successfully updated',
      type: 'system',
      metadata: {
        updated_fields: {
          firstName: firstName !== undefined,
          lastName: lastName !== undefined,
          email: email !== undefined && email !== oldEmail,
          address: address !== undefined,
          contactNumber: contactNumber !== undefined,
          profileImage: req.files?.length > 0
        }
      }
    });

    if (email && email !== oldEmail) {
      const admins = await User.findAll({ where: { role: 'admin' } });
      
      await Promise.all(
        admins.map(admin => 
          Notification.create({
            user_id: admin.id,
            title: 'User Changed Email',
            message: `User ${oldEmail} changed their email to ${email}`,
            type: 'admin_alert',
            metadata: {
              user_id: req.user.id,
              old_email: oldEmail,
              new_email: email
            }
          })
        )
      );
    }

    if (io) {
      io.to(`user_${req.user.id}`).emit('new_notification', {
        event: 'profile_updated',
        data: userNotification
      });

      if (email && email !== oldEmail) {
        const adminNotifications = await Notification.findAll({
          where: { 
            type: 'admin_alert',
            'metadata.new_email': email
          },
          order: [['created_at', 'DESC']],
          limit: 1
        });

        if (adminNotifications.length > 0) {
          io.to(`admin_dashboard`).emit('admin_notification', {
            event: 'email_changed',
            data: adminNotifications[0]
          });
        }
      }
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        contactNumber: user.contactNumber,
        city: user.city,
        state: user.state,
        gender: user.gender,
        profileImage: user.profileImage,
      },
    });

  } catch (error) {
    console.error('Error updating profile:', error); 
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: error.message 
    });
  }
};

exports.updateInvestorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied, only admins can change the status' });
    }

    if (status !== 'Unverified' && status !== 'Verified') {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const investor = await Investor.findOne({
      where: { id },
    });

    if (!investor) {
      return res.status(404).json({ message: 'Investor not found' });
    }

    investor.status = status;
    await investor.save();

    res.status(200).json({
      message: 'Investor status updated successfully',
      investor: {
        id: investor.id,
        status: investor.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating investor status', error });
  }
};

exports.deleteInvestor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Investor.destroy({ where: { id } });
    
    if (deleted) {
      res.status(204).json({ message: 'Investor deleted' });
    } else {
      res.status(404).json({ message: 'Investor not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting investor', error });
  }
};

exports.changeInvestorPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'Current password, new password, and confirm new password are required' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New password and confirm new password must match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error });
  }
};

// Get all units owned by the authenticated investor
exports.getMyUnits = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the investor record
    const investor = await Investor.findOne({
      where: { user_id: userId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'contactNumber']
      }]
    });

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'Investor profile not found'
      });
    }

    // Find all units owned by this user
    const ownedUnits = await FarmUnit.findAll({
      where: {
        current_owner_id: userId,
        status: 'sold'
      },
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: [
            'id', 
            'name', 
            'location', 
            'address',
            'image_url',
            'total_farm_size',
            'farm_manager'
          ]
        },
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email', 'contactNumber']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get the most recent ownership record for each unit
    const unitsWithOwnership = await Promise.all(ownedUnits.map(async (unit) => {
      const ownership = await FarmUnitOwnership.findOne({
        where: {
          farm_unit_id: unit.id,
          user_id: userId
        },
        attributes: [
          'id',
          'units_purchased',
          'size_purchased',
          'purchase_amount',
          'purchase_date',
          'is_relisted',
          'relist_price',
          'createdAt'
        ],
        order: [['purchase_date', 'DESC']]
      });

      return {
        ...unit.toJSON(),
        ownership: ownership ? ownership.toJSON() : null
      };
    }));

    // Format the response
    const units = unitsWithOwnership.map(unit => ({
      id: unit.id,
      unit_number: unit.unit_number,
      size_of_unit: unit.size_of_unit,
      price: unit.price,
      crop_type: unit.crop_type,
      crop_description: unit.crop_description,
      soil_type: unit.soil_type,
      image_url: unit.image_url,
      gps_coordinates: unit.gps_coordinates,
      irrigation_method: unit.irrigation_method,
      delivery_region: unit.delivery_region,
      status: unit.status,
      expected_yield_per_unit_kg: unit.expected_yield_per_unit_kg,
      expected_value_per_kg: unit.expected_value_per_kg,
      planting_date: unit.planting_date,
      expected_harvest_date: unit.expected_harvest_date,
      harvest_cycle_months: unit.harvest_cycle_months,
      farm: unit.farm ? {
        id: unit.farm.id,
        name: unit.farm.name,
        location: unit.farm.location,
        address: unit.farm.address,
        image_url: unit.farm.image_url,
        total_farm_size: unit.farm.total_farm_size,
        farm_manager: unit.farm.farm_manager
      } : null,
      ownership: unit.ownership ? {
        units_purchased: unit.ownership.units_purchased,
        size_purchased: unit.ownership.size_purchased,
        purchase_amount: unit.ownership.purchase_amount,
        purchase_date: unit.ownership.purchase_date,
        is_relisted: unit.ownership.is_relisted,
        relist_price: unit.ownership.relist_price
      } : null,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    }));

    // Calculate summary statistics
    const totalUnits = units.length;
    const totalValue = units.reduce((sum, unit) => sum + parseFloat(unit.price || 0), 0);
    const totalSize = units.reduce((sum, unit) => sum + parseFloat(unit.size_of_unit || 0), 0);
    const uniqueFarms = new Set(units.map(u => u.farm?.id)).size;

    res.status(200).json({
      success: true,
      investor: {
        id: investor.id,
        name: investor.user?.name || 'Unknown',
        email: investor.user?.email || 'N/A',
        contactNumber: investor.user?.contactNumber || 'N/A'
      },
      summary: {
        totalUnits,
        totalValue,
        totalSize,
        totalFarms: uniqueFarms
      },
      units
    });

  } catch (error) {
    console.error('Error fetching investor units:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get units owned by a specific investor (for admin)
exports.getInvestorUnitsById = async (req, res) => {
  try {
    const { investorId } = req.params;

    const investor = await Investor.findByPk(investorId, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'contactNumber']
      }]
    });

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    const userId = investor.user_id;

    // Find all units owned by this user
    const ownedUnits = await FarmUnit.findAll({
      where: {
        current_owner_id: userId,
        status: 'sold'
      },
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: [
            'id', 
            'name', 
            'location', 
            'address',
            'image_url',
            'total_farm_size',
            'farm_manager'
          ]
        },
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email', 'contactNumber']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Get ownership records
    const unitsWithOwnership = await Promise.all(ownedUnits.map(async (unit) => {
      const ownership = await FarmUnitOwnership.findOne({
        where: {
          farm_unit_id: unit.id,
          user_id: userId
        },
        attributes: [
          'id',
          'units_purchased',
          'size_purchased',
          'purchase_amount',
          'purchase_date',
          'is_relisted',
          'relist_price',
          'createdAt'
        ],
        order: [['purchase_date', 'DESC']]
      });

      return {
        ...unit.toJSON(),
        ownership: ownership ? ownership.toJSON() : null
      };
    }));

    // Format the response
    const units = unitsWithOwnership.map(unit => ({
      id: unit.id,
      unit_number: unit.unit_number,
      size_of_unit: unit.size_of_unit,
      price: unit.price,
      crop_type: unit.crop_type,
      crop_description: unit.crop_description,
      soil_type: unit.soil_type,
      image_url: unit.image_url,
      gps_coordinates: unit.gps_coordinates,
      irrigation_method: unit.irrigation_method,
      delivery_region: unit.delivery_region,
      status: unit.status,
      expected_yield_per_unit_kg: unit.expected_yield_per_unit_kg,
      expected_value_per_kg: unit.expected_value_per_kg,
      planting_date: unit.planting_date,
      expected_harvest_date: unit.expected_harvest_date,
      harvest_cycle_months: unit.harvest_cycle_months,
      farm: unit.farm ? {
        id: unit.farm.id,
        name: unit.farm.name,
        location: unit.farm.location,
        address: unit.farm.address,
        image_url: unit.farm.image_url,
        total_farm_size: unit.farm.total_farm_size,
        farm_manager: unit.farm.farm_manager
      } : null,
      ownership: unit.ownership ? {
        units_purchased: unit.ownership.units_purchased,
        size_purchased: unit.ownership.size_purchased,
        purchase_amount: unit.ownership.purchase_amount,
        purchase_date: unit.ownership.purchase_date,
        is_relisted: unit.ownership.is_relisted,
        relist_price: unit.ownership.relist_price
      } : null,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt
    }));

    // Calculate summary statistics
    const totalUnits = units.length;
    const totalValue = units.reduce((sum, unit) => sum + parseFloat(unit.price || 0), 0);
    const uniqueFarms = new Set(units.map(u => u.farm?.id)).size;

    res.status(200).json({
      success: true,
      investor: {
        id: investor.id,
        name: investor.user?.name || 'Unknown',
        email: investor.user?.email || 'N/A',
        contactNumber: investor.user?.contactNumber || 'N/A'
      },
      summary: {
        totalUnits,
        totalValue,
        totalFarms: uniqueFarms
      },
      units
    });

  } catch (error) {
    console.error('Error fetching investor units by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investor units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};