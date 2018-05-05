const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            next(null, true);
        } else {
            next({ message: 'This filetype isn\'t allowed!' }, false);
        }
    }
};

exports.myMiddleware = (req, res, next) => {
    req.name = 'Andrei';
    next();
};

exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    if(!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.photo = `${uuid.v4()}.${extension}`;
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    next();
};

exports.createStore = async (req, res) => {
    req.body.author = req.user._id;
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully <b>Created</b> ${store.name}! 🎉`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', { title: 'Stores', stores });
};

const confirmOwner = (store, user) => {
    if (!store.author.equals(user._id)) {
        throw Error('You must own a store in order to edit it');
    } 
};

exports.editStore = async (req, res) => {
    const { params } = req;
    const store = await Store.findOne({ _id: params.id });
    confirmOwner(store, req.user);
    res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
    const { params, body } = req;
    body.location.type = 'Point';
    const store = await Store.findOneAndUpdate({ _id: params.id }, body, {
        new: true, // return new store, not old
        runValidators: true
    }).exec();
    req.flash('success', `Successfully <b>Updated</b> ${store.name}! 🎉 <a href="/store/${store.slug}">View profile ➠</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};

exports.getStoreBySlug = async (req, res, next) => {
    const { params } = req;
    const store = await Store.findOne({ slug: params.slug }).populate('author');
    if (!store) return next(); // pass to the next middleware/not found
    res.render('store', { title: store.name, store });
};

exports.getStoresByTag = async (req, res) => {
    const tag = req.params.tag;
    const tagQuery = tag || { $exists: true };

    const tagsPromise = Store.getTagsList();
    const storesPromise = Store.find({ tags: tagQuery });

    const [ tags, stores ] = await Promise.all([
        tagsPromise,
        storesPromise
    ]);

    res.render('tags', { tags, stores, title: 'Tags', activeTag: tag });
};

/**
 * API
 */

 exports.searchStores = async (req, res) => {
    const stores = await Store
    // find stores that match
    .find({
        $text: {
            $search: req.query.q
        }
    }, {
        // for sorting by numer of matches
        score: {
            $meta: 'textScore'
        }
    })
    // sort them
    .sort({
        score: {
            $meta: 'textScore'
        }
    })
    // limit
    .limit(5);
    res.json(stores);
 };

 exports.mapStores = async (req, res) => {
    const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

    const q = {
        location: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates
                },
                $maxDistance: 10000
            }
        }
    };

    const fields = ['slug', 'name', 'location', 'photo', 'description'].join(' '); // minus ignores

    const stores = await Store.find(q).select(fields).limit(10);
    res.json(stores);
 };