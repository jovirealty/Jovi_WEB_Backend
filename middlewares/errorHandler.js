const errorHandler = (err, req, res, next) => {
    console.log("error: ", err.stack);
    res.status(500).json({success: false, message: err.message, error: err});
};

module.exports = errorHandler;