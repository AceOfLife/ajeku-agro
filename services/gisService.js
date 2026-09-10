// services/gisService.js
const { Farm, FarmUnit, sequelize } = require('../models');
const { Op } = require('sequelize');

class GISService {
  // ✅ Get complete farm data with units
  async getCompleteFarmData(farmId) {
    const query = `
      SELECT 
        f.id as farm_id,
        f.name as farm_name,
        f.location,
        f.address,
        ST_AsGeoJSON(f.geometry) as farm_geometry,
        ST_AsGeoJSON(f.boundary) as farm_boundary,
        f.total_farm_size,
        f.image_url as farm_image,
        jsonb_agg(
          jsonb_build_object(
            'id', fu.id,
            'unit_number', fu.unit_number,
            'size_of_unit', fu.size_of_unit,
            'price', fu.price,
            'crop_type', fu.crop_type,
            'crop_description', fu.crop_description,
            'planting_date', fu.planting_date,
            'expected_harvest_date', fu.expected_harvest_date,
            'harvest_cycle_months', fu.harvest_cycle_months,
            'expected_yield_per_unit_kg', fu.expected_yield_per_unit_kg,
            'expected_value_per_kg', fu.expected_value_per_kg,
            'soil_type', fu.soil_type,
            'image_url', fu.image_url,
            'gps_coordinates', fu.gps_coordinates,
            'irrigation_method', fu.irrigation_method,
            'status', fu.status,
            'current_owner_id', fu.current_owner_id,
            'latitude', fu.latitude,
            'longitude', fu.longitude,
            'ndvi_value', fu.ndvi_value,
            'ndvi_last_updated', fu.ndvi_last_updated,
            'crop_health_status', fu.crop_health_status,
            'last_satellite_image', fu.last_satellite_image,
            ST_AsGeoJSON(fu.geometry) as geometry,
            ST_AsGeoJSON(fu.boundary) as boundary
          )
        ) as units
      FROM "Farms" f
      LEFT JOIN "FarmUnits" fu ON f.id = fu.farm_id
      WHERE f.id = $1
      GROUP BY f.id
    `;

    const [result] = await sequelize.query(query, {
      replacements: [farmId]
    });

    if (result.length === 0) return null;

    const farm = result[0];
    return {
      farm: {
        id: farm.farm_id,
        name: farm.farm_name,
        location: farm.location,
        address: farm.address,
        geometry: JSON.parse(farm.farm_geometry || 'null'),
        boundary: JSON.parse(farm.farm_boundary || 'null'),
        total_farm_size: farm.total_farm_size,
        image: farm.farm_image
      },
      units: farm.units || []
    };
  }

  // ✅ Get all farms with their units as GeoJSON
  async getAllFarmsWithUnitsGeoJSON() {
    const query = `
      SELECT 
        jsonb_build_object(
          'type', 'FeatureCollection',
          'features', jsonb_agg(
            jsonb_build_object(
              'type', 'Feature',
              'geometry', COALESCE(
                ST_AsGeoJSON(f.geometry)::jsonb,
                jsonb_build_object(
                  'type', 'Point',
                  'coordinates', ARRAY[f.longitude, f.latitude]
                )
              ),
              'properties', jsonb_build_object(
                'id', f.id,
                'name', f.name,
                'location', f.location,
                'address', f.address,
                'total_farm_size', f.total_farm_size,
                'measurement_unit', f.measurement_unit,
                'farm_valuation', f.farm_valuation,
                'farm_manager', f.farm_manager,
                'image_url', f.image_url,
                'is_sold_out', f.is_sold_out,
                'units', (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'id', fu.id,
                      'unit_number', fu.unit_number,
                      'size_of_unit', fu.size_of_unit,
                      'price', fu.price,
                      'crop_type', fu.crop_type,
                      'crop_description', fu.crop_description,
                      'planting_date', fu.planting_date,
                      'expected_harvest_date', fu.expected_harvest_date,
                      'harvest_cycle_months', fu.harvest_cycle_months,
                      'expected_yield_per_unit_kg', fu.expected_yield_per_unit_kg,
                      'expected_value_per_kg', fu.expected_value_per_kg,
                      'soil_type', fu.soil_type,
                      'image_url', fu.image_url,
                      'status', fu.status,
                      'ndvi_value', fu.ndvi_value,
                      'crop_health_status', fu.crop_health_status,
                      'latitude', fu.latitude,
                      'longitude', fu.longitude,
                      'geometry', ST_AsGeoJSON(fu.geometry)::jsonb,
                      'boundary', ST_AsGeoJSON(fu.boundary)::jsonb
                    )
                  )
                  FROM "FarmUnits" fu
                  WHERE fu.farm_id = f.id
                )
              )
            )
          )
        ) AS geojson
      FROM "Farms" f
      WHERE f.geometry IS NOT NULL OR (f.latitude IS NOT NULL AND f.longitude IS NOT NULL)
    `;

    const [result] = await sequelize.query(query);
    return result[0]?.geojson || { type: 'FeatureCollection', features: [] };
  }

  // ✅ Get NDVI data for a specific farm unit
  async getUnitNDVI(unitId) {
    const unit = await FarmUnit.findByPk(unitId, {
      attributes: ['id', 'unit_number', 'ndvi_value', 'ndvi_last_updated', 'crop_health_status', 'last_satellite_image']
    });
    
    if (!unit) return null;
    
    // Fetch NDVI history
    const historyQuery = `
      SELECT 
        date,
        ndvi_value,
        crop_health_status
      FROM "NDVIHistory"
      WHERE farm_unit_id = $1
      ORDER BY date DESC
      LIMIT 30
    `;

    const [history] = await sequelize.query(historyQuery, {
      replacements: [unitId]
    });

    return {
      current: {
        ndvi: unit.ndvi_value,
        status: unit.crop_health_status,
        last_updated: unit.ndvi_last_updated,
        satellite_image: unit.last_satellite_image
      },
      history: history || []
    };
  }

  // ✅ Update NDVI for a unit (to be called by cron job or satellite API)
  async updateUnitNDVI(unitId, ndviValue, satelliteImageUrl = null) {
    const status = this.getHealthStatus(ndviValue);
    
    await FarmUnit.update({
      ndvi_value: ndviValue,
      ndvi_last_updated: new Date(),
      crop_health_status: status,
      last_satellite_image: satelliteImageUrl || undefined
    }, {
      where: { id: unitId }
    });

    // Save to history
    await sequelize.query(`
      INSERT INTO "NDVIHistory" (farm_unit_id, date, ndvi_value, crop_health_status, "createdAt", "updatedAt")
      VALUES ($1, NOW(), $2, $3, NOW(), NOW())
    `, {
      replacements: [unitId, ndviValue, status]
    });

    return { ndvi: ndviValue, status };
  }

  // ✅ Get health status from NDVI value
  getHealthStatus(ndvi) {
    if (ndvi >= 0.6) return 'excellent';
    if (ndvi >= 0.4) return 'good';
    if (ndvi >= 0.2) return 'moderate';
    if (ndvi >= 0.1) return 'poor';
    return 'critical';
  }

  // ✅ Get farms with NDVI summary
  async getFarmsWithNDVISummary() {
    const query = `
      SELECT 
        f.id,
        f.name,
        f.location,
        COUNT(fu.id) as total_units,
        AVG(fu.ndvi_value) as avg_ndvi,
        jsonb_agg(
          DISTINCT jsonb_build_object(
            'unit_id', fu.id,
            'unit_number', fu.unit_number,
            'crop_type', fu.crop_type,
            'ndvi', fu.ndvi_value,
            'status', fu.crop_health_status,
            'harvest_date', fu.expected_harvest_date
          )
        ) as units
      FROM "Farms" f
      LEFT JOIN "FarmUnits" fu ON f.id = fu.farm_id
      GROUP BY f.id
    `;

    const [results] = await sequelize.query(query);
    return results;
  }
}

module.exports = new GISService();