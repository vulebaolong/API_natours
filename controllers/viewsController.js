const Tour = require('../models/tourModel');
const { catchAsync } = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) get tour data từ collection
  const tours = await Tour.find();

  // 2) xây dựng template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });
  console.log(tour);
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});
