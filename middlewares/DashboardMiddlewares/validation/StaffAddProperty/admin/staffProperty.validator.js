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
      // Accept listingDate from client; if absent the controller can default to today
      listingDate: Joi.alternatives().try(
        Joi.date().iso(),
        Joi.string().isoDate()
      ).optional(),
      // Optional extras that your UI may send
      yearBuilt: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow("", null),
      currency: Joi.string().default("CAD"),

      media: Joi.array().items(Joi.object()).optional(),
    }).unknown(true).required(),
  });

  return schema.validate(payload, { abortEarly: false });
};