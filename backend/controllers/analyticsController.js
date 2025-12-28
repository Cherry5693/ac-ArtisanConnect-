const { GroupOrder, Product, DirectOrder } = require('../models/model');
const mongoose = require('mongoose');

exports.getArtisanAnalytics = async (req, res) => {
  try {
    const artisanId = new mongoose.Types.ObjectId(req.user.id);

    // 1. Monthly Revenue (for the last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await DirectOrder.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.artisan': artisanId,
          status: { $in: ['completed', 'delivered'] },
          updatedAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' }
          },
          totalRevenue: {
            $sum: {
              $multiply: [
                '$quantity',
                { $ifNull: ['$product.pricePerKg', 0] }
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          year: '$_id.year',
          revenue: '$totalRevenue'
        }
      }
    ]);

    // 2. Top Selling Products
    const topProducts = await DirectOrder.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $match: {
          'product.artisan': artisanId,
          status: { $in: ['completed', 'delivered'] }
        }
      },
      {
        $group: {
          _id: '$product._id',
          name: { $first: '$product.name' },
          totalQuantitySold: { $sum: '$quantity' }
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 5 }
    ]);

    res.json({ monthlyRevenue, topProducts });

  } catch (err) {
    console.error('Error fetching artisan analytics:', err);
    res.status(500).json({ msg: err.message || 'Server Error' });
  }
};