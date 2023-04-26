const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

// tạo string đường dẫn kết nối với atlas
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

//kết nối với atlas
mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(con => {
    console.log('name: ', con.connection.name, " => 'success'");
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// IMPORT DATA TO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Import Data Success');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

// DALETE DATA TO DB
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Delete Data Success');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
}

if (process.argv[2] === '--delete') {
  deleteData();
}
console.log(process.argv);
