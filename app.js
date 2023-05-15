const path = require('path');
const express = require('express');
const morgan = require('morgan');
// giới hạn sử dụng API
const rateLimit = require('express-rate-limit');
// bảo vệ HTTTP headers
const helmet = require('helmet');
// làm sạch dữ liệu chống tấn công bằng mã query mongo
const mongoSanitize = require('express-mongo-sanitize');
// chống tấn công XSS
const xss = require('xss-clean');
// chống lặp lại các param vì nếu trùng sẽ không chạy được
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/apiError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRouters');
const viewRouter = require('./routes/viewRouters');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES

// serving static file
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// bảo vệ HTTTP headers phải nên đặt ở đầu tiên
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
// app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// giới hạn sử dụng API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Vượt quá giới hạn yêu cầu từ IP này, xin vui lòng thử lại sau 1 giờ'
});
app.use('/api', limiter);

// phân tính cú pháp body, đọc dữ liệu từ req.body
// nếu body lớn hơn 10kb sẽ bị từ chối
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// làm sạch dữ liệu, và chống lại NOSQL query injection
app.use(mongoSanitize());

// làm sạch dữ liệu, và chống lại XSS
app.use(xss());

// chống lặp lại các param vì nếu trùng sẽ không chạy được
app.use(
  hpp({
    // whitelist chấp nhận cho các params này trùng nhau
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// test
app.use((req, res, next) => {
  console.log('Hello from the middleware 👋');
  next();
});
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

//4) xử lý các URL người dùng sử dụng không đúng
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this sever!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
