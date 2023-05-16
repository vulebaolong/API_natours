const AppError = require('../utils/apiError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const message = `Tên '${err.keyValue.name}' đã tồn tại`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  let objMessage = '';
  Object.values(err.errors).forEach(e => {
    objMessage += `Trường '${e.path}' giá trị: '${e.value}' ${
      e.message
    } ----- `;
  });

  return new AppError(objMessage, 400);
};

const handleJWTError = err => {
  const message = `Lỗi '${err.name}': ${err.message} => token không hợp lệ`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = err => {
  console.log(err);
  const message = `Lỗi '${err.name}': ${err.message} => token đã hết hạn`;
  return new AppError(message, 401);
};

const sendErrorDev = (res, req, err) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: `${err.message}`,
      stack: err.stack
    });
  }

  // b) RENDER WEBSITE
  console.error('(lỗi chưa được xử lý) ERROR: ', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something wrong',
    msg: err.message
  });
};
const sendErrorProd = (res, req, err) => {
  // a) API
  if (req.originalUrl.startsWith('/api')) {
    // a) những lỗi ĐÃ XỬ LÝ để trả thông tin lỗi cho khách hàng
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: `${err.message}`
      });
    }

    // b) lỗi CHƯA ĐƯỢC XỬ LÝ nên không muốn leak thông tin cho khách hàng
    // 1) log lỗi
    console.error('(lỗi chưa được xử lý) ERROR: ', err);

    // 2) gửi lỗi cho khách
    return res.status(500).json({
      status: 'error',
      message: `Something wrong (lỗi chưa được xử lý)`
      // error: err // không nên show error cho khách hàng hàng
    });
  }

  // b) RENDER WEBSITE
  // những lỗi ĐÃ XỬ LÝ để trả thông tin lỗi cho khách hàng
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something wrong',
      msg: err.message
    });
  }

  // 1) log lỗi
  // lỗi CHƯA ĐƯỢC XỬ LÝ nên không muốn leak thông tin cho khách hàng
  console.error('(lỗi chưa được xử lý) ERROR: ', err);

  // 2) gửi lỗi cho khách
  return res.status(err.statusCode).render('error', {
    title: 'Something wrong',
    msg: 'xin vui lòng thử lại'
  });
};

module.exports = (err, req, res, next) => {
  console.log(process.env.NODE_ENV);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.log(err);
    sendErrorDev(res, req, err);
  }

  if (process.env.NODE_ENV === 'production') {
    // let errCoppy = JSON.parse(JSON.stringify(err));
    if (err.name === 'CastError') {
      console.log(err.name);
      err = handleCastErrorDB(err);
    }

    if (err.code === 11000) {
      console.log(err.name);
      err = handleDuplicateFieldsDB(err);
    }

    if (err.name === 'ValidationError') {
      console.log(err.name);
      err = handleValidationErrorDB(err);
    }

    if (err.name === 'JsonWebTokenError') {
      console.log(err.name);
      err = handleJWTError(err);
    }

    if (err.name === 'TokenExpiredError') {
      console.log(err.name);
      err = handleJWTExpiredError(err);
    }

    sendErrorProd(res, req, err);
  }
};
