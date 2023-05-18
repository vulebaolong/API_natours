const multer = require('multer');
const sharp = require('sharp');
const Tour = require('./../models/tourModel');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('./../utils/apiError');
const factory = require('./handleFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = function(req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Không phải là hình ảnh, xin vui lòng đăng tải hình ảnh',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);
// upload.single('image'); req.file
// upload.array('images', 5); req.files

exports.resizeTourImages = catchAsync(async function(req, res, next) {
  console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) imageCover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 1) images
  req.body.image = [];
  const imagesPromise = req.files.images.map(async function(item, i) {
    const imageFileName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
    await sharp(item.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${imageFileName}`);
    req.body.image.push(imageFileName);
  });
  await Promise.all(imagesPromise);
  next();
});

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

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    next(new AppError('Vui lòng cung cấp kinh độ và vĩ độ lat,lng', 400));
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
