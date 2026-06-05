const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res, next) => {
  try {

    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;
    const phone = req.body.phone;

  
    const newUser = await User.create({
      name: name,
      email: email,
      password: password,
      role: role,
      phone: phone
    });


    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });


    res.status(201).json({
      success: true,
      token: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {

    console.log("Error in register:", error);
    next(error);
  }
};


exports.login = async (req, res, next) => {
  try {

    const email = req.body.email;
    const password = req.body.password;


    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

  
    const user = await User.findOne({ email: email }).select('+password');
    

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }


    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }


    if (user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Account disabled. Contact Admin.' });
    }


    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });


    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: true,
      sameSite: "none"
    };


    res.status(200).cookie('token', token, cookieOptions).json({
      success: true,
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log("Error in login:", error);
    next(error);
  }
};


exports.getMe = async (req, res, next) => {
  try {

    const user = await User.findById(req.user.id);
    

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log("Error in getMe:", error);
    next(error);
  }
};


exports.logout = async (req, res, next) => {
  try {

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), 
      httpOnly: true
    });


    res.status(200).json({ success: true, message: "Logged out successfully", data: {} });
  } catch (error) {
    console.log("Error in logout:", error);
    next(error);
  }
};
