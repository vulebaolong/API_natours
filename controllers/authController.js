const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const { catchAsync } = require('./../utils/catchAsync');
const AppError = require('../utils/apiError');
const sendEmail = require('../utils/email');

const loginToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = loginToken(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    // secure cookie sẽ chỉ được gửi trên một kết nối mã hóa https
    // secure: true,
    // ngăn chặn việc thay đổi cookie bởi trình duyệt, tránh tấn công trang web chéo
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOption.secure = true;
  }
  res.cookie('jwt', token, cookieOption);

  // xóa pass word khi trả dữ liệu về cho người dùng
  // nhưng trong database vẫn lưu
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create({
  //   name: req.body.name,
  //   email: req.body.email,
  //   password: req.body.password,
  //   passwordConfirm: req.body.passwordConfirm
  // });
  const newUser = await User.create(req.body);
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // nếu không có email và password thì gửi lỗi và return
  if (!email || !password) {
    next(new AppError('Vui lòng cung cấp email và password', 400));
    return;
  }

  //kiểm tra email
  // có thêm select('+password') để lấy password kiểm tra, nếu không có sẽ không hiện
  // vì bên Schema đã tắt select: false
  const user = await User.findOne({ email }).select('+password');
  // correctPassword hàm này được thiết lập bên userModel

  if (!user || !(await user.correctPassword(password, user.password))) {
    next(
      new AppError('Mật khẩu không chính xác hoặc email không tồn tại', 401)
    );
    return;
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) nhận được mã token từ clien gửi lên, nếu không tồn tại trả về lỗi chưa đăng nhập
  console.log(req.headers.authorization);
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    console.log(token);
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    next(
      new AppError(
        'Bạn chưa đăng nhập, xin vui lòng đăng nhập để có quyền truy cập!',
        401
      )
    );
    return;
  }

  // 2) xác minh mã token được gửi từ clien
  const decoed = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoed);

  // 3) kiểm tra người dùng có tồn tại hay không
  const currentUser = await User.findById(decoed.id);
  if (!currentUser) {
    next(new AppError('Người dùng đã bị xóa', 401));
    return;
  }

  // 4) nếu người dùng đã thay đổi mật khẩu sau JWT (jsonwebtoken) được tạo
  if (currentUser.changedPasswordAfter(decoed.iat)) {
    next(new AppError('Người dùng đã thay đổi mật khẩu gần đây', 401));
    return;
  }

  // Cấp quyền truy cập vào route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin', 'lead-guide']
    // nếu role không nằm trong roles sẽ bắn lỗi
    if (!roles.includes(req.user.role)) {
      next(new AppError('Bạn không đủ quyền để thực hiện thao tác này', 403));
      return;
    }
    next();
  };
};

/**
 * forgotPassword và resetPassword là CHƯA ĐĂNG NHẬP nhưng muốn reset password
 * 1) khi người dùng sử dụng API forgotPassword
 *    hàm createPasswordResetToken sẽ tạo ra 2 mã
 *    - resetToken: mã này sẽ gửi cho người dùng qua mail với format đường dẫn URL/resetToken
 *      sẽ có route bắt đường dẫn với url/:token
 *    - passwordResetToken: được tạo ra từ resetToken bằng crypto, nên từ gốc 2 mã giống nhau
 *      mã này dùng đễ lưu trong database để so sánh với mã resetToken
 *      khi được dịch ra từ crypto
 *
 * 2) khi người dùng sử dụng API resetPassword (/resetPassword/:token)
 *    lấy mã token từ đường dẫn biên dịch lại bằng crypto
 *    khi đó mã token này sẽ giống với passwordResetToken
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user dựa trên email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    next(new AppError('Email chưa được đăng ký', 404));
    return;
  }

  // 2) tạo token reset
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) gửi lại dưới dạng email
  const resetURL = `${req.protocal}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Nhấn vào đường dẫn sau để lấy lại password: ${resetURL}\n Nếu bạn không quên mật khẩu, vui lòng bỏ qua email này`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Thông báo đặt lại mật khẩu tồn tại trong 10 phút',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'mã token được gửi đến email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Gửi email có lỗi xảy ra', 500));
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) lấy người dùng dựa trên mã token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  console.log(hashedToken);
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // 2) nếu token chưa hết hạn, và có người dùng thì thiết lập password
  if (!user) {
    return next(
      new AppError('Email chưa được đăng ký hoặc đã hết thời gian', 404)
    );
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) cập nhật passwordChangedAt
  // 4) đăng nhập người dùng  và gửi mã JWT
  createSendToken(user, 200, res);
});

// ĐÃ ĐĂNG NHẬP và chỉ cập nhật password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) lấy User
  const { passwordCurrent, password, passwordConfirm } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  // 2) if mật khẩu là chính xác
  console.log(await user.correctPassword(passwordCurrent, user.password));
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Mật khẩu không chính xác', 401));
  }

  // 3) update password
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate => sẽ không làm việc

  // 4) đăng nhập lại người dùng và cung cấp JWT
  createSendToken(user, 200, res);
});
