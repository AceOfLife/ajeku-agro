const { FarmManager } = require('../models');

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