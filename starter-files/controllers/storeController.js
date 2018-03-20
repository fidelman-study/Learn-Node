exports.myMiddleware = (req, res, next) => {
    req.name = 'Andrei';
    next();
};

exports.homePage = (req, res) => {
    res.render('index');
};
