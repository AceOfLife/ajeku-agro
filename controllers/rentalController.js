const { RentalBooking, Property, User } = require('../models');

exports.bookRental = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { user_id, property_id, rooms = 1 } = req.body;

    // Verify user exists
    const user = await User.findByPk(user_id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Verify property exists and is rental
    const property = await Property.findOne({
      where: { 
        id: property_id, 
        isRental: true 
      },
      transaction: t
    });
    
    if (!property) {
      await t.rollback();
      return res.status(404).json({ message: "Rental property not found" });
    }

    // Calculate availability
    const result = await RentalBooking.findOne({
      attributes: [
        [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('rooms_booked')), 0), 'total_booked']
      ],
      where: { property_id },
      transaction: t,
      raw: true
    });

    const availableRooms = property.number_of_rooms - (result?.total_booked || 0);
    if (availableRooms < rooms) {
      await t.rollback();
      return res.status(400).json({ 
        message: `Only ${availableRooms} room(s) available`,
        availableRooms
      });
    }

    // Create booking
    const booking = await RentalBooking.create({
      user_id,
      property_id,
      rooms_booked: rooms,
      amount_paid: property.annual_rent * rooms,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    }, { transaction: t });

    await t.commit();
    return res.status(201).json({
      message: "Rental booked successfully",
      booking: {
        id: booking.id,
        rooms_booked: booking.rooms_booked,
        amount_paid: booking.amount_paid,
        start_date: booking.start_date,
        end_date: booking.end_date,
        property: {
          id: property.id,
          title: property.title
        }
      }
    });

  } catch (error) {
    await t.rollback();
    console.error("Booking Error:", error);
    return res.status(500).json({
      message: "Failed to book rental",
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

exports.getAllRentalBookings = async (req, res) => {
  try {
    const bookings = await RentalBooking.findAll({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Property,
          as: 'Property',
          attributes: ['id', 'name', 'location']
        }
      ],
      order: [['created_at', 'DESC']],
      attributes: {
        exclude: ['updated_at'] // Exclude if not needed in response
      }
    });
    
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch Error:", error);
    return res.status(500).json({ 
      message: "Failed to fetch bookings",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};