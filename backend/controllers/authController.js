const { BuyerUser, ArtisanUser } = require('../models/model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const dns = require('dns'); // Import the dns module

// In-memory cache for pending users
const pendingUsers = {};

// Helper function to generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Helper function to check MX records
const checkMxRecords = (email) => {
  return new Promise((resolve) => {
    const domain = email.split('@')[1];
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false); // No MX records found or error
      } else {
        resolve(true); // MX records found
      }
    });
  });
};

exports.register = async (req, res) => {
  try {
    console.log('Received registration request body:', req.body);
    const { name, email, password, role, address, businessName } = req.body;
    // Basic required checks for top-level fields only
    if (!name || !email || !password || !role) {
      return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    // Perform basic email domain existence check
    const emailDomainExists = await checkMxRecords(email);
    if (!emailDomainExists) {
      return res.status(400).json({ msg: 'Email domain does not exist or cannot receive emails.' });
    }

    // Check if user is already registered and verified
    let existingUser = await BuyerUser.findOne({ email });
    if (!existingUser) {
        existingUser = await ArtisanUser.findOne({ email });
    }
    if (existingUser) {
        return res.status(400).json({ msg: 'User with this email already exists.' });
    }

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data temporarily
    pendingUsers[email] = {
      name,
      email,
      password: hashedPassword,
      role,
      address,
      businessName,
      otp,
      otpExpires,
      lastOtpSent: Date.now()
    };

    // Send OTP email
    try {
      const message = `Your OTP for ArtisanConnect registration is: ${otp}. It is valid for 10 minutes.`;
      await sendEmail({
        email: email,
        subject: 'ArtisanConnect OTP Verification',
        message,
      });
      console.log('OTP sent successfully to:', email);
    } catch (emailErr) {
      console.error('CRITICAL: Failed to send OTP email to new user:', email, 'Error:', emailErr);
      return res.status(500).json({ msg: 'Failed to send OTP email.' });
    }

    res.status(201).json({ msg: 'Registration successful! OTP sent to your email for verification.' });

  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ msg: err.message, errors: err.errors });
  }
};

exports.verifyOtp = async (req, res) => {
    try {
      const { email, otp } = req.body;
      console.log('Verify OTP request body:', req.body);
      
      const pendingUser = pendingUsers[email];
  
      if (!pendingUser) {
        return res.status(400).json({ msg: 'No pending registration found for this email.' });
      }
  
      if (pendingUser.otp !== otp) {
        return res.status(400).json({ msg: 'Invalid OTP.' });
      }
  
      if (pendingUser.otpExpires < Date.now()) {
        return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
      }
  
      let Model;
      let userData;
      const { name, password, role, address, businessName } = pendingUser;

      const safeAddress = address && typeof address === 'object' ? {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zipCode || '',
        coords: address.coords || undefined,
      } : { street: '', city: '', state: '', zipCode: '' };
  
      if (role === 'buyer') {
        Model = BuyerUser;
        userData = {
          name,
          email,
          password,
          address: safeAddress,
          role,
          isVerified: true,
        };
      } else if (role === 'artisan') {
        Model = ArtisanUser;
        userData = {
          email,
          password,
          artisanName: businessName,
          address: safeAddress,
          role,
          isVerified: true,
        };
      } else {
        return res.status(400).json({ msg: 'Invalid role specified.' });
      }

      const user = new Model(userData);
      await user.save();
  
      // Clean up the pending user cache
      delete pendingUsers[email];
  
      // Generate token for the newly verified user
      const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.status(200).json({ msg: 'Email verified successfully!', token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address } });
  
    } catch (err) {
        if (err.code === 11000) { // Handle duplicate key error
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }
      res.status(500).json({ msg: err.message });
    }
  };

  exports.resendOtp = async (req, res) => {
    try {
      const { email } = req.body;
      const pendingUser = pendingUsers[email];
  
      if (!pendingUser) {
        return res.status(400).json({ msg: 'No pending registration found for this email.' });
      }
  
      const now = Date.now();
      // Rate limit to 1 minute
      if (pendingUser.lastOtpSent && (now - pendingUser.lastOtpSent < 60000)) {
        return res.status(429).json({ msg: 'Please wait a minute before requesting another OTP.' });
      }
  
      const otp = generateOtp();
      pendingUser.otp = otp;
      pendingUser.otpExpires = now + 10 * 60 * 1000; // 10 minutes
      pendingUser.lastOtpSent = now;
  
      const message = `Your new OTP for ArtisanConnect registration is: ${otp}. It is valid for 10 minutes.`;
      await sendEmail({
        email: email,
        subject: 'ArtisanConnect New OTP Verification',
        message,
      });
  
      res.status(200).json({ msg: 'New OTP sent to your email.' });
  
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  };

  // Cleanup interval for pending users (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    for (const email in pendingUsers) {
      if (pendingUsers[email].otpExpires < now) {
        delete pendingUsers[email];
        console.log(`Cleaned up expired pending registration for ${email}`);
      }
    }
  }, 5 * 60 * 1000);

exports.login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;
    
    let user = await BuyerUser.findOne({ email });
    if (!user) {
      user = await ArtisanUser.findOne({ email });
    }

    console.log('User found:', user ? user.email : 'None');
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    // isVerified check is implicitly handled by the fact that users are only created after verification.
    // However, keeping it for safety in case of any manual db entries or future changes.
    if (!user.isVerified) {
      return res.status(400).json({ msg: 'Please verify your email with the OTP sent to you.' });
    }

    console.log('Stored hashed password:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result (isMatch):', isMatch);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    let userName = user.role === 'artisan' ? user.artisanName : user.name;
    res.json({ token, user: { _id: user._id, name: userName, email: user.email, role: user.role, address: user.address } });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// NEW: Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    let user = await BuyerUser.findOne({ email });
    if (!user) {
      user = await ArtisanUser.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ msg: 'User does not exist' }); // Changed to 404 and specific message
    }

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    let Model = user.role === 'buyer' ? BuyerUser : ArtisanUser;
    await Model.findByIdAndUpdate(user._id, { otp, otpExpires });

    const message = `Your password reset OTP is: ${otp}. It is valid for 10 minutes.`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP',
      message,
    });
    
    res.status(200).json({ msg: 'OTP sent to your email' }); // Changed message
    
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// NEW: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    let user = await BuyerUser.findOne({ email });
    if (!user) {
      user = await ArtisanUser.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    } 

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let Model = user.role === 'buyer' ? BuyerUser : ArtisanUser;
    await Model.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: undefined,
      otpExpires: undefined,
    });

    res.status(200).json({ msg: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// NEW: Verify Password Reset OTP
exports.verifyPasswordResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    let user = await BuyerUser.findOne({ email });
    if (!user) {
      user = await ArtisanUser.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    res.status(200).json({ msg: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};