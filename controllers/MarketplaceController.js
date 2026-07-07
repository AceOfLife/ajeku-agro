// controllers/MarketplaceController.js
const { FarmUnit, Farm, User, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.getAllUnits = async (req, res) => {
  try {
    const { 
      status = 'available', 
      crop_type, 
      min_price, 
      max_price, 
      limit = 20, 
      page = 1,
      sort_by = 'price',
      sort_order = 'asc',
      search
    } = req.query;

    const where = {};
    
    if (status) {
      where.status = status;
    }

    if (crop_type) {
      where.crop_type = crop_type;
    }

    if (min_price || max_price) {
      where.price = {};
      if (min_price) where.price[Op.gte] = parseFloat(min_price);
      if (max_price) where.price[Op.lte] = parseFloat(max_price);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const order = [];
    if (sort_by === 'price') {
      order.push(['price', sort_order]);
    } else if (sort_by === 'size') {
      order.push(['size_of_unit', sort_order]);
    } else if (sort_by === 'created_at') {
      order.push(['createdAt', sort_order]);
    } else if (sort_by === 'harvest_date') {
      order.push(['expected_harvest_date', sort_order]);
    } else {
      order.push(['price', 'asc']);
    }

    const include = [
      {
        model: Farm,
        as: 'farm',
        attributes: ['id', 'name', 'location', 'total_farm_size', 'measurement_unit']
      },
      {
        model: User,
        as: 'currentOwner',
        attributes: ['id', 'name', 'email']
      }
    ];

    if (search) {
      where[Op.or] = [
        { unit_number: { [Op.iLike]: `%${search}%` } },
        { crop_type: { [Op.iLike]: `%${search}%` } },
        { '$farm.name$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await FarmUnit.findAndCountAll({
      where,
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: {
        units: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(count / parseInt(limit))
        },
        filters: {
          status: status || null,
          crop_type: crop_type || null,
          min_price: min_price || null,
          max_price: max_price || null,
          search: search || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching marketplace units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching marketplace units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getUnitStats = async (req, res) => {
  try {
    const totalUnits = await FarmUnit.count();
    const availableUnits = await FarmUnit.count({ where: { status: 'available' } });
    const reservedUnits = await FarmUnit.count({ where: { status: 'reserved' } });
    const soldUnits = await FarmUnit.count({ where: { status: 'sold' } });
    
    const totalValue = await FarmUnit.sum('price', { where: { status: 'available' } });

    const cropStats = await FarmUnit.findAll({
      attributes: [
        'crop_type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('price')), 'total_value'],
        [sequelize.fn('AVG', sequelize.col('price')), 'avg_price']
      ],
      where: { status: 'available' },
      group: ['crop_type']
    });

    const recentListings = await FarmUnit.findAll({
      where: { status: 'available' },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: {
        total_units: totalUnits,
        available_units: availableUnits,
        reserved_units: reservedUnits,
        sold_units: soldUnits,
        total_market_value: totalValue || 0,
        crops: cropStats.map(crop => ({
          crop_type: crop.crop_type,
          count: parseInt(crop.get('count')),
          total_value: parseFloat(crop.get('total_value')) || 0,
          avg_price: parseFloat(crop.get('avg_price')) || 0
        })),
        recent_listings: recentListings
      }
    });
  } catch (error) {
    console.error('Error fetching unit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unit stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getFeaturedUnits = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const units = await FarmUnit.findAll({
      where: { status: 'available' },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [
        ['price', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    console.error('Error fetching featured units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getUnitById = async (req, res) => {
  try {
    const { unitId } = req.params;

    const unit = await FarmUnit.findByPk(unitId, {
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name', 'location', 'total_farm_size', 'measurement_unit', 'farm_manager', 'description']
        },
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.status(200).json({
      success: true,
      unit
    });
  } catch (error) {
    console.error('Error fetching unit by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unit',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getUnitByFarm = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { status = 'available' } = req.query;

    const farm = await Farm.findByPk(farmId);
    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found'
      });
    }

    const units = await FarmUnit.findAll({
      where: {
        farm_id: farmId,
        status: status
      },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['unit_number', 'ASC']]
    });

    res.status(200).json({
      success: true,
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location
      },
      count: units.length,
      units
    });
  } catch (error) {
    console.error('Error fetching units by farm:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching units by farm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getUnitPriceRange = async (req, res) => {
  try {
    const { crop_type } = req.query;

    const where = { status: 'available' };
    if (crop_type) {
      where.crop_type = crop_type;
    }

    const min = await FarmUnit.findOne({
      where,
      attributes: ['price'],
      order: [['price', 'ASC']],
      limit: 1
    });

    const max = await FarmUnit.findOne({
      where,
      attributes: ['price'],
      order: [['price', 'DESC']],
      limit: 1
    });

    const avg = await FarmUnit.findOne({
      where,
      attributes: [[sequelize.fn('AVG', sequelize.col('price')), 'avg_price']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        min_price: min ? parseFloat(min.price) : 0,
        max_price: max ? parseFloat(max.price) : 0,
        avg_price: avg ? parseFloat(avg.avg_price) : 0,
        crop_type: crop_type || 'all'
      }
    });
  } catch (error) {
    console.error('Error fetching price range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching price range',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getTopPerformingUnits = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const units = await FarmUnit.findAll({
      where: { status: 'sold' },
      attributes: [
        'id', 'farm_id', 'unit_number', 'size_of_unit', 'price', 
        'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date',
        'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg',
        'soil_type', 'image_url', 'gps_coordinates', 'irrigation_method',
        'status', 'current_owner_id', 'nft_token_id', 'createdAt', 'updatedAt'
      ],
      include: [
        {
          model: Farm,
          as: 'farm',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'currentOwner',
          attributes: ['id', 'name']
        }
      ],
      order: [['price', 'DESC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      count: units.length,
      units
    });
  } catch (error) {
    console.error('Error fetching top performing units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top performing units',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};