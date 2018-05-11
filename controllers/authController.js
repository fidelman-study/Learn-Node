const passport = require('passport');
const mongoose = require('mongoose');
const crypto = require('crypto');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

const User = mongoose.model('User');

exports.login = passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: 'Failed Login!',
  successRedirect: '/',
  successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
  req.logout();
  req.flash('success', 'You are logged out! 👋');
  res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
    return;
  }

  req.flash('error', 'Oops! You must be logged in 🙅');
  res.redirect('/login');
};

exports.forgot = async (req, res) => {
  // 1. See if your with that email exists
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash('error', `A password reset has been sent to ${req.body.email}`);
    res.redirect('/login');
    return;
  }
  
  // 2. Set reset tokens and expiry on their account
  user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
  await user.save();

  // 3. Set them an email with the token
  const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
  await mail.send({
    user,
    resetURL,
    subject: 'Reset Password',
    filename: 'password-reset'
  });
  req.flash('success', `You have been emailed a password reset link ✉️ `);
  // 4. Redirect to login page
  res.redirect('/login');
};

exports.reset = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if(!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    res.redirect('/login');
    return;
  }

  res.render('reset', { title: 'Reset password' });
};

exports.confirmPasswords = (req, res, next) => {
  if (req.body.password === req.body['password-confirm']) {
    next();
    return;
  }

  req.flash('error', 'Passwords do not match');
  res.redirect('back');
};

exports.update = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if(!user) {
    req.flash('error', 'Password reset is invalid or has expired');
    res.redirect('/login');
    return;
  }

  const setPassword = promisify(user.setPassword, user);
  await setPassword(req.body.password);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  const updatedUser = await user.save();
  await req.login(updatedUser);

  req.flash('success', 'You password has been reset');
  res.redirect('/');
};