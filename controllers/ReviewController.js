const { FarmReview } = require('../models');

exports.getAllFarmReviews = async (req, res) => {
  try {
    const reviews = await FarmReview.findAll();
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving farm reviews', error });
  }
};

exports.createFarmReview = async (req, res) => {
  try {
    const newReview = await FarmReview.create(req.body);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(400).json({ message: 'Error creating farm review', error });
  }
};

exports.updateFarmReview = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await FarmReview.update(req.body, { where: { id } });

    if (updated) {
      const updatedReview = await FarmReview.findOne({ where: { id } });
      res.status(200).json(updatedReview);
    } else {
      res.status(404).json({ message: 'Farm review not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating farm review', error });
  }
};

exports.deleteFarmReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await FarmReview.destroy({ where: { id } });

    if (deleted) {
      res.status(204).json({ message: 'Farm review deleted' });
    } else {
      res.status(404).json({ message: 'Farm review not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting farm review', error });
  }
};