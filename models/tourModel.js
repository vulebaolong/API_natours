const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

//TẠO LƯỢC ĐỒ
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Bắt buộc phải có tên tours'],
      unique: true,
      trim: true,
      maxlength: [40, 'Tên tour không được quá 40 ký tự'],
      minlength: [10, 'Tên tour không được thấp hơn 10 ký tự'],
      validate: {
        validator: function(val) {
          return validator.isAlpha(val, 'en-US', { ignore: ' ' });
        },
        message: 'Tên Tour chỉ được chứa ký tự'
      }
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'a tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have a maxGroupSize']
    },
    difficulty: {
      type: String,
      required: [true, 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Chỉ 3 giá trị hợp lệ: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Phải lớn hơn hoặc bằng 1.0'],
      max: [5, 'Phải bé hơn hoặc bằng 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'a tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    summary: {
      type: String,
      required: [true, 'a tour must have a summary'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have a imageCover']
    },
    image: [String],
    createAt: {
      type: Date,
      default: Date.now()
      // select: false
      //key có select = false sẽ không bao giờ được lấy khi fetch API
      //che dấu những thông tin nhạy cảm như mật khẩu.
    },
    startDates: [Date],
    secretTours: {
      type: Boolean,
      default: false
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: Array
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// thêm một thuộc tính vào database
// thực chất chỉ là virtual không thuộc database
// nên sẽ không tìm được nếu như sử dụng Tour.find
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//MIDDLEWARE: runs before .save() and .create()
//nếu dùng .insertMany sẽ không chạy middleware, bắt buộc phải có .save() and .create()
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  console.log(this);
  next();
});

tourSchema.pre('save', async function(next) {
  // hàm map không phải là promises, nhưng hàm bên trong là promises
  // nên hàm map sẽ trả về là promises nên biến guidesPromises chỉ chứa toàn promises
  const guidesPromises = this.guides.map(async id => {
    return await User.findById(id);
  });

  // dùng hàm Promise.all để đợi tất cả promises được trả về hết
  this.guides = await Promise.all(guidesPromises);

  next();
});

// tourSchema.pre('save', function(next) {
//   console.log('will save document .....');
//   next();
// });

// tourSchema.post('save', function(doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE: sẽ chạy sau khi find hoặc bất cứ ham nào bắt đâu từ find, và trước khi query
// để ẩn đi các tour bị mật
tourSchema.pre(/^find/, function(next) {
  // tourSchema.pre('find', function(next) {
  this.find({
    secretTours: {
      $ne: true
    }
  });

  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(`time: ${Date.now() - this.start} miliseconds`);
  console.log(docs);
  next();
});

// TẠO BỘ KHUNG TỪ LƯỢC ĐỒ
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
