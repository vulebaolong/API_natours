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

const sendErrorDev = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: `errorControler.js / ${err.message}`,
    stack: err.stack
  });
};
const sendErrorProd = (res, err) => {
  console.log(err);
  console.log(err.isOperational);
  //những lỗi tin tưởng để trả thông tin lỗi cho khách hàng
  if (err.isOperational) {
    // 2) gửi lỗi cho khách hàng
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: `errorControler.js / ${err.message}`
    });
  } else {
    //lỗi không xác định nên không muốn leak thông tin cho khách hàng
    // 1) log lỗi
    console.error('(lỗi chưa được xử lý) ERROR: ', err);

    res.status(500).json({
      status: 'error',
      message: `Something wrong (lỗi chưa được xử lý)`,
      error: err // không nên show error cho khách hàng hàng
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log(process.env.NODE_ENV);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.log(err);
    sendErrorDev(res, err);
  }

  if (process.env.NODE_ENV === 'production') {
    // let errCoppy = JSON.parse(JSON.stringify(err));

    console.log(err);
    console.log(err.name);
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

    sendErrorProd(res, err);
  }
};
