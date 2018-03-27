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

module.exports = mongoose.model('Store', storeShema);