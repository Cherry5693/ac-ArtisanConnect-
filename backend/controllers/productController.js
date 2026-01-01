const { Product, ArtisanUser, BuyerUser } = require('../models/model');
const mongoose = require('mongoose');
const { getExchangeRate } = require('../utils/currencyConverter');

exports.createProduct = async (req, res) => {
  try {
    console.log('Received product creation request body:', req.body);
    console.log('Received product image file:', req.file);
    // Accept both multipart file upload (req.file) and JSON body with base64 image (req.body.image)
    const { name, description, pricePerKg, category, unit, minOrderQty, isPrepped, availableQty, shippingZones, shippingCost } = req.body;
    // If multiple files uploaded, prefer req.files (array) otherwise accept req.file or req.body.image
    let imageUrl = null;
    let images = [];
    // If uploaded files exist, collect their URLs
    if (req.files && Array.isArray(req.files) && req.files.length) {
      images = req.files.map(f => f.path); // Cloudinary file.path contains url
      // If the client provided existing image URLs as JSON in req.body.images, merge them
      if (req.body.images) {
        try {
          const parsed = JSON.parse(req.body.images);
          if (Array.isArray(parsed) && parsed.length) {
            images = [...parsed, ...images];
          }
        } catch (e) { /* ignore parse errors */ }
      }
    } else if (req.file) {
      // backward compatibility for single upload
      imageUrl = req.file.path;
      images = imageUrl ? [imageUrl] : [];
    } else if (req.body.images) {
      // If frontend sends an array of image URLs in body (e.g., during edit), accept it
      try {
        const parsed = JSON.parse(req.body.images);
        if (Array.isArray(parsed)) images = parsed;
      } catch (e) {
        // not JSON - ignore
      }
    } else if (req.body.image) {
      imageUrl = req.body.image;
      images = imageUrl ? [imageUrl] : [];
    }

    // Validate required fields (description optional)
    if (!name || !pricePerKg || !category || !minOrderQty) { // Removed unit from this check
      return res.status(400).json({ msg: 'Please enter all required fields.' });
    }
    // Ensure unit has a default if not provided by frontend
    const productUnit = unit || 'kg'; // Set default to 'kg' if unit is falsy

    // Enforce at most 10 images server-side
    if (images.length > 10) {
      return res.status(400).json({ msg: 'You can upload up to 10 images only.' });
    }

    const product = new Product({
      name,
      description: description || '',
      pricePerKg: Number(pricePerKg),
      imageUrl: imageUrl || (images[0] || null),
      images: images,
      category,
      unit: productUnit,
      minOrderQty: Number(minOrderQty),
      availableQty: availableQty ? Number(availableQty) : 0,
      isPrepped: isPrepped === 'true' || isPrepped === true,
      artisan: req.user.id,
      shipping: {
        zones: shippingZones ? shippingZones.split(',').map(zone => zone.trim()) : [],
        cost: shippingCost ? Number(shippingCost) : 0
      }
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};


exports.getProducts = async (req, res) => {
  try {
    const { prepared, search, minPrice, maxPrice, minRating, sortBy, sortOrder, targetCurrency } = req.query;
    let filter = {};
    let sort = {};

    if (prepared === 'true') {
      filter.isPrepped = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice) {
      filter.pricePerKg = { ...filter.pricePerKg, $gte: Number(minPrice) };
    }
    if (maxPrice) {
      filter.pricePerKg = { ...filter.pricePerKg, $lte: Number(maxPrice) };
    }

    // For minRating, we need to populate artisans and then filter
    let productsQuery = Product.find(filter);

    if (minRating) {
      // Populate artisan to access averageRating
      productsQuery = productsQuery.populate({
        path: 'artisan',
        select: 'name address averageRating', // Ensure averageRating is selected
      });
    } else {
      productsQuery = productsQuery.populate('artisan', 'name address');
    }

    // Apply sorting
    if (sortBy) {
      const order = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'price') {
        sort.pricePerKg = order;
      } else if (sortBy === 'rating') {
        sort.averageRating = order; // Sort by artisan's average rating
      }
    }

    let products = await productsQuery.sort(sort);

    // Post-query filtering for minRating (since it's on populated field)
    if (minRating) {
      products = products.filter(product => {
        // Ensure artisan and averageRating exist before comparing
        return product.artisan && product.artisan.averageRating >= Number(minRating);
      });
    }

    // Currency Conversion
    if (targetCurrency && targetCurrency.toUpperCase() !== 'INR') { // Assuming base currency is INR
      const exchangeRate = await getExchangeRate('INR', targetCurrency.toUpperCase());
      if (exchangeRate) {
        products = products.map(product => ({
          ...product.toObject(), // Convert Mongoose document to plain object
          pricePerKg: product.pricePerKg * exchangeRate,
          convertedCurrency: targetCurrency.toUpperCase(),
        }));
      } else {
        console.warn(`Could not fetch exchange rate for ${targetCurrency}. Prices will remain in INR.`);
      }
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ artisan: req.user.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { targetCurrency } = req.query;
    const product = await Product.findById(req.params.id).populate('artisan', 'name address');
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Currency Conversion
    if (targetCurrency && targetCurrency.toUpperCase() !== 'INR') { // Assuming base currency is INR
      const exchangeRate = await getExchangeRate('INR', targetCurrency.toUpperCase());
      if (exchangeRate) {
        const convertedProduct = {
          ...product.toObject(), // Convert Mongoose document to plain object
          pricePerKg: product.pricePerKg * exchangeRate,
          convertedCurrency: targetCurrency.toUpperCase(),
        };
        return res.json(convertedProduct);
      } else {
        console.warn(`Could not fetch exchange rate for ${targetCurrency}. Price will remain in INR.`);
      }
    }

    res.json(product);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// NEW: Controller function for creating a product review
exports.createProductReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { id: productId } = req.params;
  const { id: userId, name: userName } = req.user;

  if (!rating || !comment) {
    return res.status(400).json({ msg: 'Please provide a rating and a comment.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const product = await Product.findById(productId).session(session);
    if (!product) throw new Error('Product not found');

    const alreadyReviewed = product.reviews.find(r => r.user.toString() === userId);
    if (alreadyReviewed) {
      return res.status(400).json({ msg: 'Product already reviewed' });
    }

    const review = { user: userId, userName, rating: Number(rating), comment };
    product.reviews.push(review);
    product.averageRating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save({ session });
    await session.commitTransaction();
    res.status(201).json({ msg: 'Review added' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ msg: err.message });
  } finally {
    session.endSession();
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params; // Product ID
    const { name, description, pricePerKg, category, unit, minOrderQty, isPrepped, availableQty, shippingZones, shippingCost } = req.body;
    // Support images array via body (for edits) or uploaded files
    let imageUrl = null;
    let images = [];
    if (req.files && Array.isArray(req.files) && req.files.length) {
      images = req.files.map(f => f.path);
    } else if (req.file) {
      imageUrl = req.file.path;
      images = imageUrl ? [imageUrl] : [];
    } else if (req.body.images) {
      try {
        const parsed = JSON.parse(req.body.images);
        if (Array.isArray(parsed)) images = parsed;
      } catch (e) {
        // ignore
      }
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
      images = imageUrl ? [imageUrl] : [];
    } // End image handling

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Ensure only the owner can update the product
    if (product.artisan.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You do not own this product.' });
    }

    // Update fields if provided
    if (name) product.name = name;
    if (description) product.description = description;
    if (pricePerKg) product.pricePerKg = Number(pricePerKg);
    if (category) product.category = category;
    if (unit) product.unit = unit;
    if (minOrderQty) product.minOrderQty = Number(minOrderQty);
    if (typeof isPrepped !== 'undefined') product.isPrepped = isPrepped;
    if (availableQty) product.availableQty = Number(availableQty);
    if (images && images.length) {
      // Enforce server-side max
      if (images.length > 10) return res.status(400).json({ msg: 'You can upload up to 10 images only.' });
      product.images = images;
      product.imageUrl = images[0];
    } else if (imageUrl) {
      product.imageUrl = imageUrl;
    }
    if (shippingZones) product.shipping.zones = shippingZones.split(',').map(zone => zone.trim());
    if (shippingCost) product.shipping.cost = Number(shippingCost);

    await product.save();

    res.status(200).json({ msg: 'Product updated successfully', product });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Ensure only the owner can delete the product
    if (product.artisan.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden: You do not own this product.' });
    }

    await product.deleteOne(); // Use deleteOne() for Mongoose 5.x and above

    res.status(200).json({ msg: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ msg: err.message });
  }
};
