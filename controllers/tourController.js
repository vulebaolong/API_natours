const Tour = require('./../models/tourModel');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('./../utils/apiError');
const factory = require('./handleFactory');

// tạo ra 1 middle ở giữa để thiết lập các option cho đường dẫn
// tourController.aliasTopTour
// hàm next để chạy tiếp tục sang hàm tiếp theo (là đối số tiếp theo là tourController.getAllTours)
// router
//   .route('/topTours')
//   .get(tourController.aliasTopTour, tourController.getAllTours);
exports.aliasTopTour = (req, res, next) => {
  // sort=-ratingsAverage,price   &   limit=5    &    fields=name,ratingsAverage,price
  req.query.sort = '-ratingsAverage price';
  req.query.limit = '5';
  req.query.fields = 'name ratingsAverage price';
  next();
};

exports.getToursStart = catchAsync(async (req, res, next) => {
  const start = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: -1 }
    }
  ]);

  if (!start) {
    next(new AppError(`Không có tour nào`, 404));
    return;
  }
  res.status(200).json({
    status: 'success',
    data: {
      start
    }
  });
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// /tour-within/:distance/center/:latlng/unit/:unit
// tours-within/233/center/-40,50/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  if (!lat || !lng) {
    next(new AppError('Vui lòng cung cấp kinh độ và vĩ độ lat,lng', 400));
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});
