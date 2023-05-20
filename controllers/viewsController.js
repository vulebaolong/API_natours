const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) get tour data từ collection
  const tours = await Tour.find();

  // 2) xây dựng template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  if (!tour) {
    return next(new AppError('Không tìm thấy tour nào', 404));
  }
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account'
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account'
  });
};

exports.updateUserData = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );
  res.status(200).render('account', {
    title: 'Your account',
    user
  });
});

exports.getMyTours = catchAsync(async function(req, res, next) {
  // 1) tìm tất cả các bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) tìm tours và trả lại ID
  const tourIds = bookings.map(el => el.tour.id);

  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
