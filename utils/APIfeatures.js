export default class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ["sort", "limit", "page", "fields"];
    excluded.forEach((el) => delete queryObj[el]);
    this.query = this.query.find(queryObj);
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      // ha tömb, akkor fűzd össze vesszővel, ha string, marad úgy
      const sortBy = Array.isArray(this.queryString.sort)
        ? this.queryString.sort.join(",")
        : this.queryString.sort;

      const sortedData = sortBy.split(",").join(" ");
      this.query = this.query.sort(sortedData);
    } else {
      this.query = this.query.sort("-dateAdded");
    }
    return this;
  }

  limiting() {
    if (this.queryString.fields) {
      const limitedData = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(limitedData);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  paginate() {
    const limit = this.queryString.limit * 1 || 100;
    const page = this.queryString.page * 1 || 1;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
