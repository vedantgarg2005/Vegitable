const express = require('express');
const Reservation = require('../models/Reservation');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create reservation
router.post('/', auth, async (req, res) => {
  try {
    const reservation = new Reservation({
      ...req.body,
      user: req.userId
    });
    await reservation.save();
    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user reservations
router.get('/my-reservations', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.userId });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;