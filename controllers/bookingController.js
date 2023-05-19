const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('./../utils/apiError');
const factory = require('./handleFactory');

exports.getCheckoutSession = catchAsync(async function(req, res, next) {
  // 1) lấy tour hiện tại
  const tour = await Tour.findById(req.params.tourId);

  // 2) Tạo checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`${tour.imageCover}`],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  // 3) tạo session res
  res.status(200).json({
    status: 'success',
    session
  });
});
