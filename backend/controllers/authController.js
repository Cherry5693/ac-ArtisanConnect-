const { BuyerUser, ArtisanUser } = require('../models/model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const dns = require('dns'); // Import the dns module

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

    // Normalize address into the shape expected by the schema so Mongoose validation won't fail
    const safeAddress = address && typeof address === 'object' ? {
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      coords: address.coords || undefined,
    } : { street: '', city: '', state: '', zipCode: '' };

    let Model;
    let userData;

    const otp = generateOtp();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === 'buyer') {
      Model = BuyerUser;
      userData = {
        name,
        email,
        password: hashedPassword,
        address: safeAddress,
        role,
        otp,
        otpExpires,
        isVerified: false,
      };
    } else if (role === 'artisan') {
      Model = ArtisanUser;
      userData = {
        email,
        password: hashedPassword,
        artisanName: businessName, // Use businessName for artisanName
        address: safeAddress,
        role,
        otp,
        otpExpires,
        isVerified: false,
      };
    } else {
      return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    let user = await Model.findOne({ email });
    if (user) {
      if (!user.isVerified) {
        console.log('User exists but not verified. Resending OTP.');
        // If user exists but not verified, resend OTP
        const newOtp = generateOtp();
        const newOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        user = await Model.findByIdAndUpdate(
          user._id,
          { $set: { otp: newOtp, otpExpires: newOtpExpires } },
          { new: true, runValidators: false } // Do not run validators on update
        );

        const message = `Your OTP for StreetFood Connect registration is: ${newOtp}. It is valid for 10 minutes.`;
        try {
          await sendEmail({
            email: user.email,
            subject: 'StreetFood Connect OTP Verification',
            message,
          });
          console.log('OTP resent successfully to:', user.email);
        } catch (emailErr) {
          console.error('Error sending OTP email (resend):', emailErr);
          return res.status(500).json({ msg: 'Failed to resend OTP email.' });
        }
        return res.status(200).json({ msg: 'User already exists but not verified. New OTP sent to your email.' });
      }
      console.log('User already exists and is verified.');
      return res.status(400).json({ msg: 'User already exists and is verified.' });
    }

    user = new Model(userData);

    console.log('Attempting to save new user:', user.email);
    await user.save();
    console.log('User saved successfully.');

    // Send OTP email but do not block the response if it fails
    try {
      const message = `Your OTP for StreetFood Connect registration is: ${otp}. It is valid for 10 minutes.`;
      await sendEmail({
        email: user.email,
        subject: 'StreetFood Connect OTP Verification',
        message,
      });
      console.log('OTP sent successfully to:', user.email);
    } catch (emailErr) {
      console.error('CRITICAL: Failed to send OTP email to new user:', user.email, 'Error:', emailErr);
      // We don't send a 500 error to the client here because the user has been created.
      // The client can proceed to a "resend OTP" screen.
    }

    res.status(201).json({ msg: 'Registration successful! OTP sent to your email for verification.' });

  } catch (err) {
    console.error('Error during registration:', err);
    console.error('Registration error details:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    // Send more detailed error message for validation errors
    res.status(500).json({ msg: err.message, errors: err.errors });
  }
};


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

    // NEW: Check if user is verified
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

// NEW: Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('Verify OTP request body:', req.body);
    
    let user = await BuyerUser.findOne({ email });
    if (!user) {
      user = await ArtisanUser.findOne({ email });
    }

    console.log('Verify OTP - user found:', user ? ({ email: user.email, isVerified: user.isVerified, otp: user.otp }) : 'None');

    if (!user) {
      return res.status(400).json({ msg: 'User not found.' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP.' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
    }

    let Model;
    if (user.role === 'buyer') {
      Model = BuyerUser;
    } else if (user.role === 'artisan') {
      Model = ArtisanUser;
    }

    user = await Model.findByIdAndUpdate(
      user._id,
      { $set: { isVerified: true, otp: undefined, otpExpires: undefined } },
      { new: true, runValidators: false } // Do not run validators on update
    );

    // Generate token for the newly verified user
    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ msg: 'Email verified successfully!', token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, address: user.address } });

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