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

storeShema.statics.getTagsList = function() {
    return this.aggregate([
        { $unwind: '$tags' }, // inwind by the tags 
        { $group: { _id: '$tags', count: { $sum: 1 } } }, // group by tags and calculate a sum
        { $sort: { count: -1 } } //sort by cound ask
    ]);
};

module.exports = mongoose.model('Store', storeShema);