const User = require('./../models/userModel');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('./../utils/apiError');

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

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND REPONSE
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: {
      users
    }
  });
});
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
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

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
