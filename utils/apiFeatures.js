class APIFeatures {
  constructor(reqQuery, query) {
    this.reqQuery = reqQuery;
    this.query = query;
  }

  fillter() {
    const queryObj = { ...this.reqQuery };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => {
      delete queryObj[el];
    });

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt|eq|in|ne|nin)\b/g,
      e => `$${e}`
    );
    this.query = this.query.find(JSON.parse(queryString));
    // let query = Tour.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    if (this.reqQuery.sort) {
      // Nếu truyền vào 2 đối số "price -ratingsQuantity"
      // sẽ bắt đầu ưu tiên sắp xếp tăng dần đối với price
      // nếu price có các giá trị bằng nhau thì sẽ sắp xếp qua -ratingsQuantity là sắp xếp giảm dần
      // nếu price không có các giá trị bằng nhau thì -ratingsQuantity vô nghĩa
      const sortString = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortString);
    } else {
      this.query = this.query.sort('-createAt');
    }
    return this;
  }

  fields() {
    if (this.reqQuery.fields) {
      const fieldsString = this.reqQuery.fields.split(',').join(' ');
      this.query = this.query.select(`${fieldsString}`);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  panigation() {
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // if (this.reqQuery.page) {
    //   const numTour = await Tour.countDocuments();
    //   if (skip >= numTour) throw new Error('This page does not exist');
    // }
    return this;
  }
}
module.exports = APIFeatures;
