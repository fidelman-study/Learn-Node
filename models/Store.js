const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeShema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: 'Please enter a store name!'
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    photo: String,
    author: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: 'You must supply an author'
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must apply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must apply an address!'
        }
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Define our index
storeShema.index({
    name: 'text',
    description: 'text'
});

storeShema.index({
    location: '2dsphere'
});

storeShema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next(); // skip
        return;
    }

    this.slug = slug(this.name);
    const slugRexExp = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storeWithSlug = await this.constructor.find({ slug: slugRexExp });

    if (storeWithSlug.length) {
        this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
    }
    next();
    // to make more resiliant so slug are unique
});

function autopopulate(next) {
    this.populate('reviews');
    next();
}

storeShema.pre('find', autopopulate);
storeShema.pre('findOne', autopopulate);

storeShema.statics.getTagsList = function() {
    return this.aggregate([
        { $unwind: '$tags' }, // inwind by the tags 
        { $group: { _id: '$tags', count: { $sum: 1 } } }, // group by tags and calculate a sum
        { $sort: { count: -1 } } //sort by cound ask
    ]);
};

storeShema.statics.getTopStores = function() {
    return this.aggregate([
        // Lookup Stores and populate their reviews
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'store', as: 'reviews' } },
        // Filter for only items that have 2 or more reviews
        { $match: { 'reviews.1': { $exists: true } } },
        // Add the average reviews field
        { $project: { // addField in new versions
            photo: '$$ROOT.photo',
            name: '$$ROOT.name',
            slug: '$$ROOT.slug',
            reviews: '$$ROOT.reviews',
            averageRating: { $avg: '$reviews.rating' }
        } },
        // Sort it by our new field, highest reviews first
        { $sort: { averageRating: -1 } },
        // Lomit to at most 10
        { $limit: 10 }
    ]);
};

// find reviews where the stores _id property === reviews store property
storeShema.virtual('reviews', {
    ref: 'Review',          // what model to link?
    localField: '_id',      // which field on the store?
    foreignField: 'store'   // which field on the review?
});

module.exports = mongoose.model('Store', storeShema);