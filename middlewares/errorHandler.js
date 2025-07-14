const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    console.log(err.stack);
    res.status(500).json({success: false, message: err.message, error: err});
};

module.exports = errorHandler;