const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('./../utils/apiError');

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

exports.getAllTours = catchAsync(async (req, res, next) => {
  console.log('req.query: ', req.query);
  // BUILD QUERY
  // const queryObj = JSON.parse(JSON.stringify(req.query));

  const features = new APIFeatures(req.query, Tour.find())
    .fillter()
    .sort()
    .fields()
    .panigation();

  const tours = await features.query;

  // SEND REPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    next(new AppError(`Không có tour nào với id: ${req.params.id}`, 404));
    return;
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  // GỬI LÊN BODY VÀ CHO BODY VÀO CREATE
  const newTour = await Tour.create(req.body);
  console.log(newTour);
  // if (!newTour) {
  //   next(new AppError(`Tạo new Tour thất bại`, 404));
  //   return;
  // }

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    next(new AppError(`Không có tour nào với id: ${req.params.id}`, 404));
    return;
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    next(new AppError(`Không có tour nào với id: ${req.params.id}`, 404));
    return;
  }

  res.status(200).json({
    status: 'success',
    data: null
  });
});

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
