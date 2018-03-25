const mongoose = require('mongoose');
const Store = mongoose.model('Store');

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

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully <b>Created</b> ${store.name}! 🎉`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    const stores = await Store.find();
    res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
    const { params } = req;
    const store = await Store.findOne({ _id: params.id });
    res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
    const { params, body } = req;
    const store = await Store.findOneAndUpdate({ _id: params.id }, body, {
        new: true, // return new store, not old
        runValidators: true
    }).exec();
    req.flash('success', `Successfully <b>Updated</b> ${store.name}! 🎉 <a href="/store/${store.slug}">View profile ➠</a>`);
    res.redirect(`/stores/${store._id}/edit`);
};