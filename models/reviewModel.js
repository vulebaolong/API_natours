// review, rating, createAt, ref tour, ref user
const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      require: [true, 'Bắt buộc phải có nội dung đánh giá'],
      trim: true
    },
    rating: {
      type: Number,
      require: [true, 'Bắt buộc phải có điểm đánh giá'],
      min: 1,
      max: 5
    },
    createAt: {
      type: Date,
      default: Date.now()
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Đánh giá phải đến từ 1 tour']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Đánh giá phải có tác giả']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// truy vấn đề key guides để lấy ra các thông tin của id đã có trong guides
reviewSchema.pre(/^find/, function(next) {
  // sử dụng populate mongoose sẽ phải truy vấn nên sẽ tốn thời gian
  // this.populate({
  //   path: 'tour ',
  //   //trường select chọn những key muốn hiển thị cho user trong key tour, nếu để dấu - trước sẽ là loại bỏ
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log('👙  stats: ', stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); không hoạt động ở đây vì query đã được thực thi
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// TẠO BỘ KHUNG TỪ LƯỢC ĐỒ
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
