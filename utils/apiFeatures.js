

class APIFeatures {
    constructor(query, queryStr){
        this.query = query;
        this.queryStr = queryStr;
    }

    filter() {
        const queryObj = {...this.queryStr};
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        // console.log(JSON.parse(queryStr));
        
        // const tours = await Tour.find({
            //     duration: 5,
            //     difficulty: 'easy'
            // });
            
            // const tours = await Tour.find(req.query);
            // it returns all tours of array
            
        this.query = this.query.find(JSON.parse(queryStr))
        // let query = Tour.find(JSON.parse(queryStr));

        return this;
    }

    sort() {
        if(this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(',').join(' ');// http://test.com/sort
            // console.log(sortBy)
            this.query = this.query.sort(sortBy);
            // sort('price ratingsAvaerage')
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limitFields() {
        if(this.queryStr.fields) {
            const fields = this.queryStr.fields.split(',').join(' ');
            // here we will include the fields which is specified in the url with the help of ,
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
            // we will exclude all of the fields with the help of -sign
            // for example here we excluded the __v and whenever the user calls the api and don't specify the fields then the __v is not included
        }
        return this;
    }

    paginate() {
        const page = parseInt(this.queryStr.page )|| 1;
        const limit = parseInt(this.queryStr.limit) || 100;
        const skip = (page -1 ) * limit ;
        // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
        // query = query.skip(20).limit(10);
        // skips 20 results 
        this.query = this.query.skip(skip).limit(limit);
        // console.log(await query.skip(6).limit(3));
// console.log(skip,limit,page)
        return this;
    }
}

module.exports = APIFeatures;