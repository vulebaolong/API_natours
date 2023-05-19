const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourModel');
const { catchAsync } = require('./../utils/catchAsync');
// const AppError = require('./../utils/apiError');
// const factory = require('./handleFactory');

exports.getCheckoutSession = catchAsync(async function(req, res, next) {
  // 1) lấy tour hiện tại
  const tour = await Tour.findById(req.params.tourId);

  const transformedItems = [
    {
      quantity: 1,
      price_data: {
        currency: 'usd',
        unit_amount: tour.price * 100,
        product_data: {
          name: `${tour.name} Tour`,
          description: tour.summary,
          images: [`http://127.0.0.1:3000/img/tours/${tour.imageCover}`]
        }
      }
    }
  ];

  // 2) Tạo checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: transformedItems
  });
  // 3) tạo session res
  res.status(200).json({
    status: 'success',
    session
  });
});
