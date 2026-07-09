// controllers/FarmController.js - UPDATED createFarm, getFarmById, getAllFarms, getFilteredFarms, getUserFarms, getRecentFarms, getMostViewedFarms, getAssemblage, getRelistedFarms

const { Farm, User, FarmImage, FarmUnitOwnership, FarmInstallmentOwnership, Transaction, FarmUnit, sequelize } = require('../models');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinaryConfig');
const { upload, uploadImagesToCloudinary } = require('../config/multerConfig');
const { Op } = require('sequelize');

const uploadDocumentToCloudinary = async (fileBuffer, fileName) => {
    try {
        const result = await cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                folder: 'farm_documents',
                public_id: fileName.replace(/\.[^/.]+$/, "")
            },
            (error, result) => {
                if (error) {
                    throw new Error('Error uploading document to Cloudinary');
                }
                return result.secure_url;
            }
        );

        const stream = cloudinary.uploader.upload_stream(
            { folder: 'farm_documents' },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        stream.end(fileBuffer);
    } catch (error) {
        console.error('Error uploading document:', error);
        throw new Error('Document upload failed');
    }
};

const parseJsonArray = (field) => {
    try {
        if (typeof field === 'string' && field.trim().startsWith("[") && field.trim().endsWith("]")) {
            return JSON.parse(field);
        } else if (Array.isArray(field)) {
            return field;
        }
        return [];
    } catch (error) {
        console.error('Error parsing JSON array', error);
        return [];
    }
};

const splitToArray = (field) => {
    try {
        if (Array.isArray(field)) {
            return field.map(item => item.toString().trim());
        }

        if (typeof field === 'string') {
            try {
                const parsed = JSON.parse(field);
                if (Array.isArray(parsed)) {
                    return parsed.map(item => item.toString().trim());
                }
            } catch (e) {
            }

            return field
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);
        }

        if (typeof field === 'object' && field !== null) {
            return Object.values(field).map(item => item.toString().trim());
        }
    } catch (error) {
        console.error('Error parsing array field:', field, error);
    }
    return [];
};

const axios = require("axios");

// controllers/FarmController.js - createFarm (Updated)

// controllers/FarmController.js - createFarm (UPDATED)

exports.createFarm = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error("Multer error:", err);
            
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    message: 'File too large. Maximum file size is 10MB per image.' 
                });
            }
            
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ 
                    message: 'Too many files. Maximum is 15 images.' 
                });
            }
            
            return res.status(400).json({ 
                message: "Error uploading images", 
                error: err.message 
            });
        }

        try {
            const {
                name, location, address, description, total_farm_size, measurement_unit,
                farm_manager, soil_type, irrigation_method, delivery_regions, farm_valuation, 
                image_url, latitude, longitude, manager_id
            } = req.body;

            const newFarmData = {
                name,
                location: location || "",
                address: address || "",
                description: description || "",
                latitude: latitude || null,   
                longitude: longitude || null,
                total_farm_size: parseFloat(total_farm_size) || 0,
                measurement_unit: measurement_unit || "hectares",
                farm_manager: farm_manager || "",
                manager_id: manager_id || null,
                image_url: image_url || null,
                soil_type: soil_type || "",
                irrigation_method: irrigation_method || "",
                delivery_regions: splitToArray(delivery_regions),
                farm_valuation: farm_valuation ? parseFloat(farm_valuation) : null,
                is_sold_out: false,
            };

            const newFarm = await Farm.create(newFarmData);

            const farm = await Farm.findByPk(newFarm.id, {
                include: [
                    {
                        model: FarmUnit,
                        as: 'units',
                        attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'image_url', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                    }
                ]
            });

            let imageUrls = [];
            if (req.files && req.files.length > 0) {
                imageUrls = await uploadImagesToCloudinary(req.files);

                if (!Array.isArray(imageUrls)) {
                    imageUrls = [imageUrls];
                }

                await FarmImage.create({
                    farm_id: newFarm.id,
                    image_url: imageUrls
                });
            }

            const savedImageRecord = await FarmImage.findOne({
                where: { farm_id: newFarm.id },
                attributes: ["image_url"]
            });

            res.status(201).json({
                farm: farm,
                images: savedImageRecord?.image_url || [],
                documentUrl: null
            });
        } catch (error) {
            console.error("Error creating farm:", error);
            res.status(500).json({ message: "Error creating farm", error });
        }
    });
};

exports.updateFarm = async (req, res) => {
    try {
        const { id } = req.params;
        const farmData = req.body;

        farmData.listing_updated = new Date();

        const [updated] = await Farm.update(farmData, {
            where: { id }
        });

        if (updated) {
            const updatedFarm = await Farm.findOne({
                where: { id },
                include: [
                    {
                        model: FarmUnit,
                        as: 'units',
                        attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                    }
                ]
            });
            return res.status(200).json(updatedFarm);
        }

        throw new Error('Farm not found');
    } catch (error) {
        res.status(400).json({ message: 'Error updating farm', error });
    }
};

exports.deleteFarm = async (req, res) => {
    try {
        let id = req.params.id;

        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Invalid farm ID' });
        }

        id = parseInt(id, 10);

        const images = await FarmImage.findAll({ where: { farm_id: id } });
        images.forEach(image => {
            if (image.image_url) {
                const image_urls = Array.isArray(image.image_url) ? image.image_url : [image.image_url];

                image_urls.forEach(image_url => {
                    if (typeof image_url === 'string') {
                        const imagePath = path.resolve(__dirname, '..', image_url);
                        if (fs.existsSync(imagePath)) {
                            fs.unlinkSync(imagePath);
                        }
                    } else {
                        console.warn(`Unexpected image_url type for FarmImage ID ${image.id}:`, typeof image_url);
                    }
                });
            }
        });

        const deleted = await Farm.destroy({
            where: { id }
        });

        if (deleted) {
            return res.status(200).json({
                message: `Farm with ID ${id} has been successfully deleted.`
            });
        }

        throw new Error('Farm not found');
    } catch (error) {
        console.error('Detailed Error:', error);
        res.status(400).json({ message: 'Error deleting farm', error: error.message });
    }
};

exports.getAllFarms = async (req, res) => {
    try {
        const farms = await Farm.findAll({
            include: [
                {
                    model: FarmImage,
                    as: 'images',
                    attributes: ['image_url']
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        const [allInstallmentOwnerships, allFractionalOwnerships] = await Promise.all([
            FarmInstallmentOwnership.findAll(),
            FarmUnitOwnership.findAll()
        ]);

        const installmentOwnershipMap = {};
        const fractionalOwnershipMap = {};

        allInstallmentOwnerships.forEach(ownership => {
            if (!installmentOwnershipMap[ownership.farm_id]) {
                installmentOwnershipMap[ownership.farm_id] = [];
            }
            installmentOwnershipMap[ownership.farm_id].push(ownership);
        });

        allFractionalOwnerships.forEach(ownership => {
            if (!fractionalOwnershipMap[ownership.farm_id]) {
                fractionalOwnershipMap[ownership.farm_id] = [];
            }
            fractionalOwnershipMap[ownership.farm_id].push(ownership);
        });

        for (const farm of farms) {
            const totalUnits = farm.units ? farm.units.length : 0;
            const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
            farm.dataValues.total_units = totalUnits;
            farm.dataValues.available_units = totalUnits - soldUnits;
            farm.dataValues.sold_units = soldUnits;

            if (farm.isInstallment && !farm.is_fractional) {
                const ownerships = installmentOwnershipMap[farm.id] || [];
                const totalMonths = ownerships.reduce((sum, o) => sum + o.total_months, 0);
                const paidMonths = ownerships.reduce((sum, o) => sum + o.months_paid, 0);

                farm.dataValues.installmentProgress = {
                    totalOwnerships: ownerships.length,
                    totalMonths,
                    paidMonths,
                    remainingMonths: totalMonths - paidMonths
                };
            } else {
                farm.dataValues.installmentProgress = null;
            }

            if (farm.is_fractional) {
                const fractionalOwnerships = fractionalOwnershipMap[farm.id] || [];
                const totalPurchased = fractionalOwnerships.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);
                farm.dataValues.available_units = farm.total_units_available - totalPurchased;
            }
        }

        res.status(200).json(farms);
    } catch (error) {
        console.error("Error in getAllFarms:", error);
        res.status(500).json({ message: 'Error retrieving farms', error });
    }
};

exports.getFarmById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query;

        const farm = await Farm.findOne({
            where: { id },
            include: [
                { model: FarmImage, as: 'images' },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        await farm.increment('views');
        await farm.update({ last_checked: new Date() });

        const totalUnits = farm.units ? farm.units.length : 0;
        const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
        const availableUnits = totalUnits - soldUnits;

        const parsedUserId = parseInt(userId);
        const parsedFarmId = parseInt(id);
        let installmentProgress = null;
        let userUnitsOwned = 0;

        if (parsedUserId) {
            const installmentOwnership = await FarmInstallmentOwnership.findOne({
                where: { user_id: parsedUserId, farm_id: parsedFarmId }
            });

            if (installmentOwnership) {
                installmentProgress = {
                    totalMonths: installmentOwnership.total_months,
                    paidMonths: installmentOwnership.months_paid,
                    remainingMonths: installmentOwnership.total_months - installmentOwnership.months_paid,
                    status: installmentOwnership.status
                };
            }

            if (farm.is_fractional) {
                const fractionalOwnership = await FarmUnitOwnership.findOne({
                    where: { user_id: parsedUserId, farm_id: parsedFarmId }
                });
                if (fractionalOwnership) {
                    userUnitsOwned = fractionalOwnership.units_purchased;
                }
            }
        }

        if (!parsedUserId && farm.isInstallment && !farm.is_fractional) {
            const ownerships = await FarmInstallmentOwnership.findAll({
                where: { farm_id: parsedFarmId }
            });

            const totalOwnerships = ownerships.length;
            const totalMonths = ownerships.reduce((sum, o) => sum + o.total_months, 0);
            const paidMonths = ownerships.reduce((sum, o) => sum + o.months_paid, 0);

            installmentProgress = {
                totalOwnerships,
                totalMonths,
                paidMonths,
                remainingMonths: totalMonths - paidMonths
            };
        }

        let fractionalProgress = null;
        if (farm.is_fractional) {
            const fractionalOwnerships = await FarmUnitOwnership.findAll({
                where: { farm_id: farm.id }
            });

            const totalPurchased = fractionalOwnerships.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);

            fractionalProgress = {
                totalUnits: totalUnits,
                purchasedUnits: totalPurchased,
                availableUnits: availableUnits,
                totalInvestors: fractionalOwnerships.length
            };
        }

        const farmData = {
            ...farm.toJSON(),
            total_units: totalUnits,
            available_units: availableUnits,
            sold_units: soldUnits,
            user_units_owned: farm.is_fractional && parsedUserId ? userUnitsOwned : undefined
        };

        return res.status(200).json({
            farm: farmData,
            installmentProgress,
            fractionalProgress
        });

    } catch (error) {
        console.error("Error in getFarmById:", error);
        res.status(500).json({ message: 'Error retrieving farm', error });
    }
};

exports.getFilteredFarms = async (req, res) => {
    const { name, crop_type, location } = req.query;

    console.log("Query received:", req.query);

    if (!name && !crop_type && !location) {
        console.log("At least one filter parameter is required.");
        return res.status(400).json({ message: "At least one filter parameter is required" });
    }

    try {
        const filter = {};

        if (name && name.trim() !== "") {
            filter.name = {
                [Op.iLike]: `%${name.trim()}%`,
            };
        }

        if (crop_type) {
            const cropTypesArray = crop_type.split(',').map(str => str.trim());
            filter['$units.crop_type$'] = {
                [Op.in]: cropTypesArray
            };
        }

        if (location) {
            filter.location = {
                [Op.iLike]: `%${location.trim()}%`,
            };
        }

        const farms = await Farm.findAll({
            where: filter,
            include: [
                { model: FarmImage, as: 'images' },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ],
        });

        if (farms.length === 0) {
            return res.status(404).json({ message: 'No farms found' });
        }

        const farmsWithUnits = farms.map(farm => {
            const totalUnits = farm.units ? farm.units.length : 0;
            const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
            const availableUnits = totalUnits - soldUnits;
            const farmData = farm.toJSON();
            farmData.total_units = totalUnits;
            farmData.available_units = availableUnits;
            farmData.sold_units = soldUnits;
            return farmData;
        });

        res.status(200).json(farmsWithUnits);
    } catch (error) {
        console.error("Error retrieving farms:", error);
        res.status(500).json({
            message: 'Error retrieving farms',
            error: error.message,
        });
    }
};

exports.getFarmUnits = async (req, res) => {
    try {
        const { farm_id } = req.params;
        const { user_id } = req.query;

        const farm = await Farm.findByPk(farm_id);
        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        const allUnits = await FarmUnit.findAll({
            where: { farm_id },
            include: [
                {
                    model: User,
                    as: 'currentOwner',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        const totalUnits = allUnits.length;
        const availableUnits = allUnits.filter(u => u.status === 'available').length;
        const soldUnits = allUnits.filter(u => u.status === 'sold').length;

        if (user_id) {
            const userUnits = allUnits.filter(u => u.current_owner_id === parseInt(user_id));
            return res.status(200).json({
                farm_id: farm.id,
                name: farm.name,
                total_units: totalUnits,
                available_units: availableUnits,
                sold_units: soldUnits,
                user_units_owned: userUnits.length,
                user_units: userUnits
            });
        }

        return res.status(200).json({
            farm_id: farm.id,
            name: farm.name,
            total_units: totalUnits,
            available_units: availableUnits,
            sold_units: soldUnits,
            units: allUnits
        });

    } catch (error) {
        console.error("Error fetching farm units:", error.message);
        res.status(500).json({
            message: 'Error fetching farm unit information',
            error: error.message
        });
    }
};

exports.getRecentFarms = async (req, res) => {
    try {
        const farms = await Farm.findAll({
            order: [['createdAt', 'DESC']],
            limit: 6,
            include: [
                { model: FarmImage, as: 'images' },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        const farmsWithUnits = farms.map(farm => {
            const totalUnits = farm.units ? farm.units.length : 0;
            const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
            const availableUnits = totalUnits - soldUnits;
            const farmData = farm.toJSON();
            farmData.total_units = totalUnits;
            farmData.available_units = availableUnits;
            farmData.sold_units = soldUnits;
            return farmData;
        });

        res.status(200).json({ farms: farmsWithUnits });
    } catch (error) {
        console.error("Error fetching recent farms:", error);
        res.status(500).json({ message: "Failed to fetch recent farms", error });
    }
};

exports.getMostViewedFarms = async (req, res) => {
    try {
        const farms = await Farm.findAll({
            order: [['views', 'DESC']],
            limit: 6,
            include: [
                { model: FarmImage, as: 'images' },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        const farmsWithUnits = farms.map(farm => {
            const totalUnits = farm.units ? farm.units.length : 0;
            const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
            const availableUnits = totalUnits - soldUnits;
            const farmData = farm.toJSON();
            farmData.total_units = totalUnits;
            farmData.available_units = availableUnits;
            farmData.sold_units = soldUnits;
            return farmData;
        });

        res.status(200).json({ farms: farmsWithUnits });
    } catch (error) {
        console.error('Error fetching most viewed farms:', error);
        res.status(500).json({ message: 'Failed to fetch most viewed farms', error });
    }
};

exports.getUserFarms = async (req, res) => {
    try {
        const userId = req.user.id;

        const [allInstallmentOwnerships, allFractionalOwnerships, allUnits] = await Promise.all([
            FarmInstallmentOwnership.findAll(),
            FarmUnitOwnership.findAll(),
            FarmUnit.findAll({ where: { current_owner_id: userId } })
        ]);

        const installmentOwnershipMap = {};
        const fractionalOwnershipMap = {};

        allInstallmentOwnerships.forEach(ownership => {
            if (!installmentOwnershipMap[ownership.farm_id]) {
                installmentOwnershipMap[ownership.farm_id] = [];
            }
            installmentOwnershipMap[ownership.farm_id].push(ownership);
        });

        allFractionalOwnerships.forEach(ownership => {
            if (!fractionalOwnershipMap[ownership.farm_id]) {
                fractionalOwnershipMap[ownership.farm_id] = [];
            }
            fractionalOwnershipMap[ownership.farm_id].push(ownership);
        });

        const userUnitIds = allUnits.map(u => u.farm_id);

        const outright = await Farm.findAll({
            include: [
                {
                    model: Transaction,
                    where: { user_id: userId, status: 'success' },
                    required: true
                },
                {
                    model: FarmImage,
                    as: 'images',
                    attributes: ['image_url']
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        const fractional = await Farm.findAll({
            where: {
                id: userUnitIds
            },
            include: [
                {
                    model: FarmImage,
                    as: 'images',
                    attributes: ['image_url']
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        const installmentIds = await FarmInstallmentOwnership.findAll({
            where: { user_id: userId },
            attributes: ['farm_id'],
            raw: true
        });

        const installments = await Farm.findAll({
            where: {
                id: installmentIds.map(i => i.farm_id)
            },
            include: [
                {
                    model: FarmImage,
                    as: 'images',
                    attributes: ['image_url']
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ]
        });

        const allFarmsMap = new Map();

        [...outright, ...fractional, ...installments].forEach((farm) => {
            allFarmsMap.set(farm.id, farm);
        });

        const uniqueFarms = Array.from(allFarmsMap.values());

        for (const farm of uniqueFarms) {
            const totalUnits = farm.units ? farm.units.length : 0;
            const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
            const availableUnits = totalUnits - soldUnits;
            const userUnitsOnFarm = farm.units ? farm.units.filter(u => u.current_owner_id === userId).length : 0;
            farm.dataValues.total_units = totalUnits;
            farm.dataValues.available_units = availableUnits;
            farm.dataValues.sold_units = soldUnits;
            farm.dataValues.user_units_owned = userUnitsOnFarm;

            if (farm.isInstallment && !farm.is_fractional) {
                const ownerships = installmentOwnershipMap[farm.id] || [];
                const userOwnerships = ownerships.filter(o => o.user_id === userId);

                const totalMonths = userOwnerships.reduce((sum, o) => sum + o.total_months, 0);
                const paidMonths = userOwnerships.reduce((sum, o) => sum + o.months_paid, 0);

                farm.dataValues.installmentProgress = {
                    totalOwnerships: userOwnerships.length,
                    totalMonths,
                    paidMonths,
                    remainingMonths: totalMonths - paidMonths,
                    completionPercentage: totalMonths > 0 ? Math.round((paidMonths / totalMonths) * 100) : 0
                };
            } else {
                farm.dataValues.installmentProgress = null;
            }

            if (farm.is_fractional) {
                const allFractionalOwnershipsForFarm = fractionalOwnershipMap[farm.id] || [];
                const userFractionalOwnerships = allFractionalOwnershipsForFarm.filter(o => o.user_id === userId);

                const totalUnitsPurchased = userFractionalOwnerships.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);
                const totalPurchasedByAll = allFractionalOwnershipsForFarm.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);

                farm.dataValues.fractionalProgress = {
                    totalUnits: farm.total_units_available,
                    purchasedUnits: totalPurchasedByAll,
                    availableUnits: farm.total_units_available - totalPurchasedByAll,
                    totalInvestors: allFractionalOwnershipsForFarm.length,
                    userUnitsOwned: totalUnitsPurchased,
                    ownershipPercentage: (totalUnitsPurchased / farm.total_units_available) * 100
                };
            } else {
                farm.dataValues.fractionalProgress = null;
            }
        }

        return res.status(200).json({
            message: 'User farms fetched successfully',
            farms: uniqueFarms
        });

    } catch (error) {
        console.error('Error fetching user farms:', error);
        return res.status(500).json({
            message: 'Failed to fetch user farms',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.updateMonthlyExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { monthly_expense } = req.body;

        const farm = await Farm.findByPk(id);

        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        if (typeof monthly_expense !== 'number' || monthly_expense < 0) {
            return res.status(400).json({ message: 'monthly_expense must be a valid number' });
        }

        farm.monthly_expense = monthly_expense;
        await farm.save();

        return res.status(200).json({
            message: 'Monthly expense updated successfully',
            farm
        });
    } catch (error) {
        console.error('Error updating monthly expense:', error);
        return res.status(500).json({ message: 'Error updating monthly expense', error });
    }
};

exports.updateFarmValuation = async (req, res) => {
    try {
        const { id } = req.params;
        const { farm_valuation } = req.body;

        const farm = await Farm.findByPk(id);

        if (!farm) {
            return res.status(404).json({ message: 'Farm not found' });
        }

        if (typeof farm_valuation !== 'number' || farm_valuation <= 0) {
            return res.status(400).json({ message: 'Farm valuation must be a valid number' });
        }

        farm.farm_valuation = farm_valuation;
        await farm.save();

        return res.status(200).json({
            message: 'Farm valuation updated successfully',
            farm
        });
    } catch (error) {
        console.error('Error updating farm valuation:', error);
        return res.status(500).json({ message: 'Error updating farm valuation', error });
    }
};

async function calculateFarmAnalytics(farmId, userId = null) {
    const farm = await Farm.findByPk(farmId);
    if (!farm) return null;

    const estimated_value = parseFloat(farm.farm_valuation || 0);
    const monthly_expense = parseFloat(farm.monthly_expense || 0);
    const annual_expense = monthly_expense * 12;

    const annual_income = await Transaction.sum('price', {
        where: {
            farm_id: farm.id,
            status: 'success'
        }
    }) || 0;

    let outstanding_balance = 0;
    if (userId && farm.isInstallment) {
        const ownership = await FarmInstallmentOwnership.findOne({
            where: { user_id: userId, farm_id: farm.id }
        });
        if (ownership) {
            const totalPrice = await FarmUnit.sum('price', {
                where: { farm_id: farm.id }
            }) || 0;
            const monthly_installment = totalPrice / ownership.total_months;
            outstanding_balance = monthly_installment * (ownership.total_months - ownership.months_paid);
        }
    }

    const gross_yield = estimated_value ? (annual_income / estimated_value) * 100 : 0;
    const net_yield = estimated_value ? ((annual_income - annual_expense) / estimated_value) * 100 : 0;

    return {
        annual_expense,
        annual_income,
        outstanding_balance,
        estimated_value,
        potential_equity: estimated_value - outstanding_balance,
        gross_yield: parseFloat(gross_yield.toFixed(2)),
        net_yield: parseFloat(net_yield.toFixed(2))
    };
}

exports.getFarmAnalytics = async (req, res) => {
    try {
        const { farmId } = req.params;
        const userId = req.user.id;

        const analytics = await calculateFarmAnalytics(farmId, userId);

        res.status(200).json({
            message: 'Farm analytics retrieved',
            analytics
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Error retrieving analytics" });
    }
};

exports.getTopPerformingFarm = async (req, res) => {
    try {
        const userId = req.user.id;

        const farms = await Farm.findAll({
            attributes: [
                'id', 'name', 'location', 'total_farm_size',
                'measurement_unit', 'farm_valuation',
                'monthly_expense', 'createdAt'
            ],
            include: [
                {
                    model: Transaction,
                    where: { user_id: userId },
                    required: false,
                    attributes: ['id', 'transaction_date', 'price']
                },
                {
                    model: FarmInstallmentOwnership,
                    as: 'installmentOwnerships',
                    attributes: ['id', 'createdAt'],
                    required: false
                },
                {
                    model: FarmUnitOwnership,
                    as: 'unitOwnerships',
                    attributes: ['id', 'createdAt'],
                    required: false
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ],
            limit: 100
        });

        const farmsWithAnalytics = await Promise.all(
            farms.map(async (farm) => {
                try {
                    const analytics = await Promise.race([
                        calculateFarmAnalytics(farm.id, userId),
                        new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Calculation timeout')), 5000);
                        })
                    ]);

                    const purchaseDate = farm.Transactions?.[0]?.transaction_date ||
                        farm.installmentOwnerships?.[0]?.createdAt ||
                        farm.unitOwnerships?.[0]?.createdAt ||
                        farm.createdAt;

                    const totalUnits = farm.units ? farm.units.length : 0;
                    const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
                    const availableUnits = totalUnits - soldUnits;

                    return {
                        ...farm.get({ plain: true }),
                        total_units: totalUnits,
                        available_units: availableUnits,
                        sold_units: soldUnits,
                        purchase_date: purchaseDate,
                        analytics: {
                            ...analytics,
                            potential_equity: farm.farm_valuation > 0
                                ? Math.round((analytics.estimated_value / farm.farm_valuation) * 100 * 100) / 100
                                : 0,
                            project_cashflow: Math.round((analytics.annual_income - analytics.annual_expense) * 100) / 100
                        }
                    };
                } catch (error) {
                    console.error(`Error calculating analytics for farm ${farm.id}:`, error);
                    return null;
                }
            })
        ).then(results => results.filter(Boolean));

        if (farmsWithAnalytics.length === 0) {
            return res.status(200).json({
                message: 'No farms found',
                farm: null,
                history: null
            });
        }

        const sorted = farmsWithAnalytics.sort((a, b) =>
            (b.analytics?.net_yield || 0) - (a.analytics?.net_yield || 0)
        );

        const topFarm = sorted[0];

        let history = null;
        if (topFarm) {
            const getDailyData = async () => {
                const now = new Date();
                const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                const daysInMonth = new Date(year, lastMonth + 1, 0).getDate();

                const monthlyTransactions = await Transaction.findAll({
                    where: {
                        farm_id: topFarm.id,
                        user_id: userId,
                        transaction_date: {
                            [Op.gte]: new Date(year, lastMonth, 1),
                            [Op.lt]: new Date(year, lastMonth + 1, 1)
                        }
                    },
                    attributes: [
                        'id',
                        'transaction_date',
                        'price',
                        [sequelize.fn('DATE', sequelize.col('transaction_date')), 'date']
                    ]
                });

                const transactionsByDay = monthlyTransactions.reduce((acc, transaction) => {
                    const dateStr = transaction.get('date');
                    if (!acc[dateStr]) {
                        acc[dateStr] = [];
                    }
                    acc[dateStr].push(transaction);
                    return acc;
                }, {});

                const startValue = await Farm.findOne({
                    where: { id: topFarm.id },
                    include: [{
                        model: Transaction,
                        where: {
                            user_id: userId,
                            transaction_date: { [Op.lt]: new Date(year, lastMonth, 1) }
                        },
                        order: [['transaction_date', 'DESC']],
                        limit: 1,
                        required: false
                    }]
                });

                let runningValue = startValue?.farm_valuation || topFarm.farm_valuation || 0;
                const dailyData = [];

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, lastMonth, day);
                    const dateStr = date.toISOString().split('T')[0];
                    const dayTransactions = transactionsByDay[dateStr] || [];

                    const income = dayTransactions.reduce((sum, t) => sum + (t.price > 0 ? t.price : 0), 0);
                    const expenses = dayTransactions.reduce((sum, t) => sum + (t.price < 0 ? Math.abs(t.price) : 0), 0);
                    const cashflow = income - expenses;

                    dailyData.push({
                        date: dateStr,
                        gross_yield: runningValue > 0 ? Math.round((income / runningValue) * 100 * 100) / 100 : 0,
                        net_yield: runningValue > 0 ? Math.round(((income - expenses) / runningValue) * 100 * 100) / 100 : 0,
                        potential_equity: runningValue > 0 ?
                            Math.round((topFarm.analytics.estimated_value / runningValue) * 100 * 100) / 100 :
                            0,
                        cashflow: Math.round(cashflow * 100) / 100,
                        farm_value: runningValue
                    });
                }

                return dailyData;
            };

            const getMonthlyData = async () => {
                const now = new Date();
                const year = now.getFullYear() - 1;
                const monthlyData = [];

                const yearlyTransactions = await Transaction.findAll({
                    where: {
                        farm_id: topFarm.id,
                        user_id: userId,
                        transaction_date: {
                            [Op.gte]: new Date(year, 0, 1),
                            [Op.lt]: new Date(year + 1, 0, 1)
                        }
                    },
                    attributes: [
                        'id',
                        'transaction_date',
                        'price',
                        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('transaction_date')), 'month']
                    ]
                });

                const transactionsByMonth = yearlyTransactions.reduce((acc, transaction) => {
                    const monthStr = transaction.get('month').toISOString().slice(0, 7);
                    if (!acc[monthStr]) {
                        acc[monthStr] = [];
                    }
                    acc[monthStr].push(transaction);
                    return acc;
                }, {});

                const startValue = await Farm.findOne({
                    where: { id: topFarm.id },
                    include: [{
                        model: Transaction,
                        where: {
                            user_id: userId,
                            transaction_date: { [Op.lt]: new Date(year, 0, 1) }
                        },
                        order: [['transaction_date', 'DESC']],
                        limit: 1,
                        required: false
                    }]
                });

                let runningValue = startValue?.farm_valuation || topFarm.farm_valuation || 0;

                for (let month = 0; month < 12; month++) {
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);
                    const monthStr = monthStart.toISOString().slice(0, 7);
                    const monthTransactions = transactionsByMonth[monthStr] || [];

                    const income = monthTransactions.reduce((sum, t) => sum + (t.price > 0 ? t.price : 0), 0);
                    const expenses = monthTransactions.reduce((sum, t) => sum + (t.price < 0 ? Math.abs(t.price) : 0), 0);
                    const cashflow = income - expenses;

                    monthlyData.push({
                        month: monthStart.toLocaleString('default', { month: 'long' }),
                        year,
                        gross_yield: runningValue > 0 ? Math.round((income / runningValue) * 100 * 100) / 100 : 0,
                        net_yield: runningValue > 0 ? Math.round(((income - expenses) / runningValue) * 100 * 100) / 100 : 0,
                        potential_equity: runningValue > 0 ?
                            Math.round((topFarm.analytics.estimated_value / runningValue) * 100 * 100) / 100 :
                            0,
                        cashflow: Math.round(cashflow * 100) / 100,
                        farm_value: runningValue
                    });
                }

                return monthlyData;
            };

            try {
                const [dailyData, monthlyData] = await Promise.all([
                    Promise.race([
                        getDailyData(),
                        new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Daily data timeout')), 10000);
                        })
                    ]).catch(() => []),
                    Promise.race([
                        getMonthlyData(),
                        new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Monthly data timeout')), 10000);
                        })
                    ]).catch(() => [])
                ]);

                history = {
                    last_month: dailyData,
                    last_year: monthlyData
                };
            } catch (error) {
                console.error('Error calculating history:', error);
                history = { last_month: [], last_year: [] };
            }
        }

        res.status(200).json({
            message: 'Top performing farm retrieved',
            farm: topFarm,
            history
        });

    } catch (error) {
        console.error("Error retrieving top farm:", error);
        res.status(500).json({
            message: "Error retrieving top farm",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getUserFarmsAnalytics = async (req, res) => {
    try {
        const requestedUserId = parseInt(req.params.userId);
        const authenticatedUserId = req.user.id;

        if (requestedUserId !== authenticatedUserId) {
            return res.status(403).json({
                message: "Unauthorized - You can only view your own analytics"
            });
        }

        const userExists = await User.findByPk(requestedUserId);
        if (!userExists) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userFarms = await Farm.findAll({
            where: {
                [Op.or]: [
                    { original_owner_id: requestedUserId },
                    { '$Transactions.user_id$': requestedUserId },
                    { '$installmentOwnerships.user_id$': requestedUserId },
                    { '$unitOwnerships.user_id$': requestedUserId }
                ]
            },
            attributes: ['id', 'name', 'createdAt', 'farm_valuation', 'original_owner_id', 'location', 'total_farm_size', 'measurement_unit'],
            include: [
                {
                    model: Transaction,
                    as: 'Transactions',
                    where: { user_id: requestedUserId },
                    required: false,
                    attributes: ['id', 'transaction_date', 'price', 'status', 'payment_type']
                },
                {
                    model: FarmInstallmentOwnership,
                    as: 'installmentOwnerships',
                    where: { user_id: requestedUserId },
                    required: false,
                    attributes: ['id', 'createdAt']
                },
                {
                    model: FarmUnitOwnership,
                    as: 'unitOwnerships',
                    where: { user_id: requestedUserId },
                    required: false,
                    attributes: ['id', 'createdAt']
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ],
            distinct: true
        });

        const analytics = await Promise.all(
            userFarms.map(farm => {
                return calculateFarmAnalytics(farm.id, requestedUserId)
                    .then(analytics => ({
                        ...analytics,
                        farm_id: farm.id,
                        farm_name: farm.name
                    }));
            })
        );

        const totalPortfolioValue = analytics.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
        const totals = {
            avg_potential_equity: totalPortfolioValue > 0 ?
                Math.round((analytics.reduce((sum, a) => sum + (a.estimated_value || 0), 0) / totalPortfolioValue * 100) * 100) / 100 :
                0,
            project_cashflow: Math.round(analytics.reduce(
                (sum, a) => sum + (a.annual_income || 0) - (a.annual_expense || 0),
                0
            ) * 100) / 100,
            avg_gross_yield: analytics.length > 0 ?
                Math.round(analytics.reduce((sum, a) => sum + (a.gross_yield || 0), 0) / analytics.length * 100) / 100 :
                0,
            avg_net_yield: analytics.length > 0 ?
                Math.round(analytics.reduce((sum, a) => sum + (a.net_yield || 0), 0) / analytics.length * 100) / 100 :
                0,
            total_farms: userFarms.length
        };

        const overview = {
            states: new Set(userFarms
                .map(farm => farm.location?.split(',')?.[1]?.trim() || farm.location?.trim())
                .filter(location => location && location !== '')
            ).size,
            avg_farm_size: Math.round(userFarms.reduce((sum, farm) => {
                const size = parseFloat(farm.total_farm_size) || 0;
                return sum + size;
            }, 0) / (userFarms.length || 1) * 100) / 100,
            avg_income: (() => {
                const farmTransactions = userFarms.flatMap(farm =>
                    farm.Transactions?.filter(t => t.price > 0) || []
                );
                const totalIncome = farmTransactions.reduce((sum, t) => sum + t.price, 0);
                return farmTransactions.length > 0 ?
                    Math.round((totalIncome / farmTransactions.length) * 100) / 100 :
                    0;
            })(),
            avg_purchase_price: (() => {
                const allTransactions = userFarms.flatMap(farm =>
                    farm.Transactions?.filter(t => t.price > 0) || []
                );
                const totalAmount = allTransactions.reduce((sum, t) => sum + t.price, 0);
                return allTransactions.length > 0 ?
                    Math.round((totalAmount / allTransactions.length) * 100) / 100 :
                    0;
            })(),
            number_of_farms: userFarms.length
        };

        const calculateHistory = async (period) => {
            try {
                const now = new Date();
                console.log(`Calculating ${period} history for user ${requestedUserId}`);

                if (period === 'last_month') {
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    const year = lastMonth.getFullYear();
                    const month = lastMonth.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    const transactions = await Transaction.findAll({
                        where: {
                            user_id: requestedUserId,
                            transaction_date: {
                                [Op.gte]: new Date(year, month, 1),
                                [Op.lt]: new Date(year, month + 1, 1)
                            }
                        },
                        include: [{
                            model: Farm,
                            as: 'farm',
                            attributes: ['id', 'name', 'farm_valuation']
                        }],
                        order: [['transaction_date', 'ASC']]
                    });

                    console.log(`Found ${transactions.length} transactions for last month (${year}-${month + 1})`);

                    const monthEndDate = new Date(year, month + 1, 0);
                    const farmsAtMonthEnd = await getFarmsOwnedByUserAtDate(requestedUserId, monthEndDate);

                    const dailyData = [];
                    for (let day = 1; day <= daysInMonth; day++) {
                        const currentDate = new Date(year, month, day);
                        const dateStr = currentDate.toISOString().split('T')[0];

                        const dayTransactions = transactions.filter(t => {
                            const tDate = t.transaction_date;
                            return tDate.getDate() === day &&
                                tDate.getMonth() === month &&
                                tDate.getFullYear() === year;
                        });

                        const farmsOnDay = await getFarmsOwnedByUserAtDate(requestedUserId, currentDate);

                        const dayIncome = dayTransactions.reduce((sum, t) => sum + (t.price > 0 ? t.price : 0), 0);
                        const dayExpenses = dayTransactions.reduce((sum, t) => sum + (t.price < 0 ? Math.abs(t.price) : 0), 0);

                        const farmAnalytics = await Promise.all(
                            farmsOnDay.map(farm =>
                                calculateFarmAnalytics(farm.id, requestedUserId)
                            )
                        );

                        const totalMarketValue = farmAnalytics.reduce((sum, a) => sum + (a.market_value || 0), 0);
                        const totalEstimatedValue = farmAnalytics.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
                        const avgGrossYield = farmAnalytics.length > 0 ?
                            Math.round(farmAnalytics.reduce((sum, a) => sum + (a.gross_yield || 0), 0) / farmAnalytics.length * 100) / 100 :
                            0;
                        const avgNetYield = farmAnalytics.length > 0 ?
                            Math.round(farmAnalytics.reduce((sum, a) => sum + (a.net_yield || 0), 0) / farmAnalytics.length * 100) / 100 :
                            0;

                        dailyData.push({
                            date: dateStr,
                            farms: farmsOnDay.map(f => ({
                                id: f.id,
                                name: f.name,
                                farm_valuation: f.farm_valuation
                            })),
                            avg_potential_equity: totalMarketValue > 0 ?
                                Math.round((totalEstimatedValue / totalMarketValue) * 100 * 100) / 100 :
                                0,
                            project_cashflow: Math.round((dayIncome - dayExpenses) * 100) / 100,
                            avg_gross_yield: avgGrossYield,
                            avg_net_yield: avgNetYield
                        });
                    }

                    return dailyData;
                } else {
                    const year = now.getFullYear() - 1;
                    console.log(`Calculating yearly history for ${year}`);

                    const transactions = await Transaction.findAll({
                        where: {
                            user_id: requestedUserId,
                            transaction_date: {
                                [Op.gte]: new Date(year, 0, 1),
                                [Op.lt]: new Date(year + 1, 0, 1)
                            }
                        },
                        include: [{
                            model: Farm,
                            as: 'farm',
                            attributes: ['id', 'name', 'farm_valuation']
                        }],
                        order: [['transaction_date', 'ASC']]
                    });

                    console.log(`Found ${transactions.length} transactions for ${year}`);

                    const monthlyData = [];
                    for (let month = 0; month < 12; month++) {
                        const monthStart = new Date(year, month, 1);
                        const monthEnd = new Date(year, month + 1, 0);
                        const monthName = monthStart.toLocaleString('default', { month: 'long' });
                        const monthTransactions = transactions.filter(t =>
                            t.transaction_date.getMonth() === month
                        );

                        const farmsAtMonthEnd = await getFarmsOwnedByUserAtDate(requestedUserId, monthEnd);

                        const farmAnalytics = await Promise.all(
                            farmsAtMonthEnd.map(farm =>
                                calculateFarmAnalytics(farm.id, requestedUserId)
                            )
                        );

                        const totalMarketValue = farmAnalytics.reduce((sum, a) => sum + (a.market_value || 0), 0);
                        const totalEstimatedValue = farmAnalytics.reduce((sum, a) => sum + (a.estimated_value || 0), 0);
                        const avgGrossYield = farmAnalytics.length > 0 ?
                            Math.round(farmAnalytics.reduce((sum, a) => sum + (a.gross_yield || 0), 0) / farmAnalytics.length * 100) / 100 :
                            0;
                        const avgNetYield = farmAnalytics.length > 0 ?
                            Math.round(farmAnalytics.reduce((sum, a) => sum + (a.net_yield || 0), 0) / farmAnalytics.length * 100) / 100 :
                            0;

                        const monthIncome = monthTransactions.reduce((sum, t) => sum + (t.price > 0 ? t.price : 0), 0);
                        const monthExpenses = monthTransactions.reduce((sum, t) => sum + (t.price < 0 ? Math.abs(t.price) : 0), 0);

                        monthlyData.push({
                            month: monthName,
                            year,
                            farms: farmsAtMonthEnd.map(f => ({
                                id: f.id,
                                name: f.name,
                                farm_valuation: f.farm_valuation
                            })),
                            avg_potential_equity: totalMarketValue > 0 ?
                                Math.round((totalEstimatedValue / totalMarketValue) * 100 * 100) / 100 :
                                0,
                            project_cashflow: Math.round((monthIncome - monthExpenses) * 100) / 100,
                            avg_gross_yield: avgGrossYield,
                            avg_net_yield: avgNetYield
                        });
                    }
                    return monthlyData;
                }
            } catch (error) {
                console.error(`Error calculating ${period} history:`, error);
                if (period === 'last_month') {
                    const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
                    const daysInMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
                    return Array(daysInMonth).fill().map((_, i) => ({
                        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), i + 1).toISOString().split('T')[0],
                        farms: [],
                        avg_potential_equity: 0,
                        project_cashflow: 0,
                        avg_gross_yield: 0,
                        avg_net_yield: 0
                    }));
                } else {
                    return Array(12).fill().map((_, i) => ({
                        month: new Date(0, i).toLocaleString('default', { month: 'long' }),
                        year: new Date().getFullYear() - 1,
                        farms: [],
                        avg_potential_equity: 0,
                        project_cashflow: 0,
                        avg_gross_yield: 0,
                        avg_net_yield: 0
                    }));
                }
            }
        };

        const getFarmsOwnedByUserAtDate = async (userId, date) => {
            return await Farm.findAll({
                where: {
                    [Op.or]: [
                        {
                            original_owner_id: userId,
                            createdAt: { [Op.lte]: date }
                        },
                        {
                            '$Transactions.user_id$': userId,
                            '$Transactions.transaction_date$': { [Op.lte]: date }
                        },
                        {
                            '$installmentOwnerships.user_id$': userId,
                            '$installmentOwnerships.createdAt$': { [Op.lte]: date }
                        },
                        {
                            '$unitOwnerships.user_id$': userId,
                            '$unitOwnerships.createdAt$': { [Op.lte]: date }
                        }
                    ]
                },
                include: [
                    {
                        model: Transaction,
                        as: 'Transactions',
                        where: {
                            user_id: userId,
                            transaction_date: { [Op.lte]: date }
                        },
                        required: false
                    },
                    {
                        model: FarmInstallmentOwnership,
                        as: 'installmentOwnerships',
                        where: {
                            user_id: userId,
                            createdAt: { [Op.lte]: date }
                        },
                        required: false
                    },
                    {
                        model: FarmUnitOwnership,
                        as: 'unitOwnerships',
                        where: {
                            user_id: userId,
                            createdAt: { [Op.lte]: date }
                        },
                        required: false
                    }
                ],
                distinct: true
            });
        };

        const history = {
            last_month: await calculateHistory('last_month'),
            last_year: await calculateHistory('last_year')
        };

        res.status(200).json({
            message: `Farm analytics for user ${requestedUserId}`,
            user_id: requestedUserId,
            farms: analytics,
            totals,
            overview,
            history
        });

    } catch (error) {
        console.error(`Error fetching analytics for user ${req.params.userId}:`, error);
        res.status(500).json({
            message: "Error retrieving analytics",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getRelistedFarms = async (req, res) => {
    try {
        const relistedFarms = await Farm.findAll({
            where: { is_relisted: true },
            include: [
                {
                    model: FarmImage,
                    as: 'images',
                    attributes: ['image_url']
                },
                {
                    model: FarmUnitOwnership,
                    as: 'unitOwnerships',
                    where: { is_relisted: true },
                    required: false
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        const farmsWithUnits = await Promise.all(
            relistedFarms.map(async farm => {
                const totalUnits = farm.units ? farm.units.length : 0;
                const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;
                const availableUnits = totalUnits - soldUnits;
                const farmData = farm.toJSON();
                farmData.total_units = totalUnits;
                farmData.available_units = availableUnits;
                farmData.sold_units = soldUnits;
                return farmData;
            })
        );

        res.status(200).json({
            success: true,
            count: relistedFarms.length,
            farms: farmsWithUnits
        });
    } catch (error) {
        console.error('Error fetching relisted farms:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch relisted farms',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getAssemblage = async (req, res) => {
    try {
        const { payment_type } = req.query;

        const whereClause = {};
        if (payment_type) {
            if (payment_type === 'installment') {
                whereClause.isInstallment = true;
                whereClause.is_fractional = false;
            } else if (payment_type === 'fractional') {
                whereClause.is_fractional = true;
            } else if (payment_type === 'full') {
                whereClause.isInstallment = false;
                whereClause.is_fractional = false;
            }
        }

        const farms = await Farm.findAll({
            where: whereClause,
            include: [
                {
                    model: FarmImage,
                    as: 'images',
                    attributes: ['image_url'],
                    limit: 1
                },
                {
                    model: FarmUnit,
                    as: 'units',
                    attributes: ['id', 'unit_number', 'size_of_unit', 'price', 'crop_type', 'crop_description', 'planting_date', 'expected_harvest_date', 'harvest_cycle_months', 'expected_yield_per_unit_kg', 'expected_value_per_kg', 'status']
                }
            ],
            attributes: [
                'id',
                'name',
                'location',
                'total_farm_size',
                'measurement_unit',
                'isInstallment',
                'is_fractional'
            ]
        });

        const [allInstallmentOwnerships, allFractionalOwnerships] = await Promise.all([
            FarmInstallmentOwnership.findAll(),
            FarmUnitOwnership.findAll()
        ]);

        const installmentOwnershipMap = {};
        const fractionalOwnershipMap = {};

        allInstallmentOwnerships.forEach(ownership => {
            if (!installmentOwnershipMap[ownership.farm_id]) {
                installmentOwnershipMap[ownership.farm_id] = [];
            }
            installmentOwnershipMap[ownership.farm_id].push(ownership);
        });

        allFractionalOwnerships.forEach(ownership => {
            if (!fractionalOwnershipMap[ownership.farm_id]) {
                fractionalOwnershipMap[ownership.farm_id] = [];
            }
            fractionalOwnershipMap[ownership.farm_id].push(ownership);
        });

        const formattedFarms = farms.map(farm => {
            const farmData = farm.toJSON();
            const totalUnits = farm.units ? farm.units.length : 0;
            const availableUnits = farm.units ? farm.units.filter(u => u.status === 'available').length : 0;
            const soldUnits = farm.units ? farm.units.filter(u => u.status === 'sold').length : 0;

            let ownershipType;
            let installmentProgress = null;
            let fractionalProgress = null;

            if (farmData.isInstallment && !farmData.is_fractional) {
                ownershipType = 'installment';

                const ownerships = installmentOwnershipMap[farmData.id] || [];
                const totalMonths = ownerships.reduce((sum, o) => sum + o.total_months, 0);
                const paidMonths = ownerships.reduce((sum, o) => sum + o.months_paid, 0);

                installmentProgress = {
                    totalOwnerships: ownerships.length,
                    totalMonths,
                    paidMonths,
                    remainingMonths: totalMonths - paidMonths
                };
            } else if (farmData.is_fractional) {
                ownershipType = 'fractional';

                const fractionalOwnerships = fractionalOwnershipMap[farmData.id] || [];
                const totalPurchased = fractionalOwnerships.reduce((sum, o) => sum + parseFloat(o.units_purchased || 0), 0);
                const availableSlots = (farmData.total_units_available || totalUnits) - totalPurchased;

                fractionalProgress = {
                    totalUnits: farmData.total_units_available || totalUnits,
                    purchasedUnits: totalPurchased,
                    availableUnits: availableSlots,
                    totalInvestors: fractionalOwnerships.length
                };
            } else {
                ownershipType = 'full';
            }

            const priceRange = farm.units && farm.units.length > 0 
                ? `₦${Math.min(...farm.units.map(u => u.price)).toLocaleString()} - ₦${Math.max(...farm.units.map(u => u.price)).toLocaleString()}`
                : 'N/A';

            return {
                id: farmData.id,
                name: farmData.name,
                location: farmData.location,
                info: {
                    total_farm_size: farmData.total_farm_size,
                    measurement_unit: farmData.measurement_unit,
                    total_units: totalUnits,
                    available_units: availableUnits,
                    sold_units: soldUnits
                },
                price_range: priceRange,
                ownership: ownershipType,
                image: farmData.images && farmData.images.length > 0 ?
                    farmData.images[0].image_url :
                    null,
                installmentProgress: installmentProgress,
                fractionalProgress: fractionalProgress,
                units: farm.units ? farm.units.map(unit => ({
                    id: unit.id,
                    unit_number: unit.unit_number,
                    size_of_unit: unit.size_of_unit,
                    price: unit.price,
                    crop_type: unit.crop_type,
                    crop_description: unit.crop_description,
                    status: unit.status
                })) : []
            };
        });

        res.status(200).json(formattedFarms);
    } catch (error) {
        console.error("Error in getAssemblage:", error);
        res.status(500).json({
            message: 'Error retrieving farms',
            error: error.message
        });
    }
};