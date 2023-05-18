const multer = require('multer');
const User = require('./../models/userModel');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('./../utils/apiError');
const factory = require('./handleFactory');

const multerStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/img/users');
  },
  filename: function(req, file, cb) {
    // user-345345345-234234.jpg
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

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

exports.uploadUserPhoto = upload.single('photo');

// lọc ra các key allowedFields và trả về obj mới với key được lọc và value
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  // 1) Tạo lỗi nếu người dùng cập nhật mật khẩu
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('Đường dẫn này không dành cho thay đổi mật khẩu', 400)
    );
  }

  // 2) lọc chỉ cho cập nhật name và email
  // tránh trường hợp người dùng cập nhật token
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user
  // vì chỉ cập nhật dữ liệu không nhảy cảm như password nên có thể dùng findByIdAndUpdate
  // option: new để trả về object mới, và cập nhật obj mới đó chứ không phải obj cũ
  // runValidators: để kiểm tra email có hợp lệ hay không
  const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updateUser
    }
  });
});
//hàm này người dùng xóa chỉ ẩn đi chưa xóa khỏi database
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User); // hàm này để admin xóa
