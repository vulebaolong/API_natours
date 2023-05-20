const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bscrypt = require('bcryptjs');

//TẠO LƯỢC ĐỒ
// name, email, photo, password, passwordComfrim
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bắt buộc phải có tên'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Bắt buộc phải có email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(val) {
        return validator.isEmail(val);
      },
      message: 'Email không hợp lệ'
    }
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Bắt buộc phải có mật khẩu'],
    minlength: [8, 'Mật khẩu tối thiểu 8 ký tự'],
    // select: false sẽ không bao giờ hiển thị ở đầu ra
    select: false
  },
  // mật khẩu nhập lần 2
  passwordConfirm: {
    type: String,
    required: [true, 'Bắt buộc phải có mật khẩu nhập lại'],
    minlength: [8, 'Mật khẩu tối thiểu 8 ký tự'],
    validate: {
      validator: function(val) {
        return val === this.password;
      },
      message: 'Mật khẩu nhập lại không giống với mật khẩu'
    }
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String
  },
  passwordResetExpires: {
    type: Date
  },
  active: {
    type: Boolean,
    default: true,
    //select trường này để ẩn khi trả dữ liệu về cho user
    select: false
  }
});

// middle tạo mã hóa mật khẩu
userSchema.pre('save', async function(next) {
  // nếu password thay đổi thì return
  if (!this.isModified('password')) return next();

  // mã hóa với chỉ số 12, số càng cao càng tốn CPU
  this.password = await bscrypt.hash(this.password, 12);

  // xóa passwordConfirm
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//lọc ra những user active là true nghĩa là chưa xóa
// active: false nghĩa là đã bị xóa
userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

//hàm này được chạy bên authController
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bscrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeTamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeTamp;
    // JWTTimestamp thời gian mã được cấp lúc 100
    // changedTimeTamp thay đổi mật khẩu lúc 200
    // 100 < 200 => return true
  }

  // không có thay đổi mật khẩu
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// TẠO BỘ KHUNG TỪ LƯỢC ĐỒ
const User = mongoose.model('User', userSchema);

module.exports = User;
