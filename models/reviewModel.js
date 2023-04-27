// review, rating, createAt, ref tour, ref user
const mongoose = require('mongoose');

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

// TẠO BỘ KHUNG TỪ LƯỢC ĐỒ
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
