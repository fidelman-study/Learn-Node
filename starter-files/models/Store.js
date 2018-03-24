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
    tags: [String]
});

storeShema.pre('save', function(next) {
    if (!this.isModified('name')) {
        next(); // skip
        return;
    }

    this.slug = slug(this.name);
    next();
    // to make more resiliant so slug are unique
});

module.exports = mongoose.model('Store', storeShema);