// middlewares/DashboardMiddlewares/validation/ResourceValidator/admin/AdminResourceValidator.js

const Joi = require('joi');

const createResourceValidator = Joi.object({
  category: Joi.string().valid('blog', 'news', 'podcast', 'e-book').required(),
  title: Joi.string().min(3).max(200).required(),
  subTitle: Joi.string().max(150).optional(),
  slug: Joi.string().optional(),  // Optional for now
  excerpt: Joi.string().optional(),
  content: Joi.string().allow('').optional(),  // HTML string; validate length if needed
  properties: Joi.object({
    tags: Joi.array().items(Joi.string().trim()).optional(),
    metaTitle: Joi.string().max(60).optional(),
    metaDescription: Joi.string().max(160).optional(),
    metaKeywords: Joi.string().optional(),
  }).optional(),
  resourceMedia: Joi.array().items(Joi.string().uri()).optional(),  // Array of valid URLs
  publish: Joi.boolean().optional(),
  views: Joi.number().min(0).optional(),
}).options({ abortEarly: false });  // Collect all errors

// For file uploads: Handled by multer; validate count/type in controller if needed

module.exports = {
  createResourceValidator,
};