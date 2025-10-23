const Joi = require('joi');

exports.validatePropertyPayload = (payload) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    agentListId: Joi.string().required(),
    agentDetail: Joi.object({
      fullName: Joi.string().required(),
      email: Joi.string().email().required(),
    }).required(),
    propertyDetails: Joi.object({
      propertyFor: Joi.string().valid("sale", "rent").required(),
      status: Joi.string().required(),
      type: Joi.string().required(),
      subtype: Joi.string().required(),
      description: Joi.string().required(),
      stateProvince: Joi.string().required(),
      city: Joi.string().required(),
      postalCode: Joi.string().allow("", null),
      bedrooms: Joi.number().required(),
      totalBath: Joi.number().required(),
      listPrice: Joi.number().min(0),
      rentPrice: Joi.number().min(0),
      media: Joi.array().items(Joi.object()).optional(),
    }).required(),
  });
  return schema.validate(payload);
};