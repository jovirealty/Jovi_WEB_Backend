// controllers/StaffAddPropertyControllers/webapp/AgentPropertyListingsController.js
const mongoose = require('mongoose');
const AgentProperty = require('../../../models/agentpropertyschema/AgentPropertySchema');

/**
 * GET /v1/auth/staff/agents/propertylistings
 * Query params:
 *  - page:   number (default 1)
 *  - limit:  number (default 20, max 100)
 *
 * Returns: { success, data: [...], count, page, limit }
 */
exports.getAllProperty = async (req, res) => {
  try {
    // pagination
    const page  = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip  = (page - 1) * limit;

    // base match (extend later if you add filters)
    const match = {};

    // aggregation to pluck only what we need
    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $project: {
          // top level
          // _id will be present by default
          // propertyDetails.* extractions:
          status:            '$propertyDetails.status',
          media: {
            // first item of media array, or null
            $let: {
              vars: { m: { $ifNull: ['$propertyDetails.media', []] } },
              in: {
                $cond: [
                  { $gt: [ { $size: '$$m' }, 0 ] },
                  { $arrayElemAt: ['$$m', 0] },
                  null
                ]
              }
            }
          },
          listPrice:         '$propertyDetails.listPrice',
          city:              '$propertyDetails.city',
          listingId:         '$propertyDetails.listingId',
          unitNumber:        '$propertyDetails.unitNumber',
          streetNumber:      '$propertyDetails.streetNumber',
          streetName:        '$propertyDetails.streetName',
          streetSuffix:      '$propertyDetails.streetSuffix',
          bedrooms:          '$propertyDetails.bedrooms',
          totalBath:         '$propertyDetails.totalBath',
          lotDimensions:     '$propertyDetails.lotDimensions',
        }
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const [rows, total] = await Promise.all([
      AgentProperty.aggregate(pipeline),
      AgentProperty.countDocuments(match),
    ]);

    return res.json({
      success: true,
      data: rows,
      count: total,
      page,
      limit,
    });
  } catch (err) {
    console.error('[getAllProperty] error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch property listings.',
    });
  }
};

/**
 * GET /v1/auth/staff/agents/propertylistings/:listingKey
 * Path param: listingKey (string) - The unique listing ID of the property
 *
 * Returns: { success, data: { ...full property object... } } or error
 * Fetches a single property by its listingId from the agentProperties collection.
 * Returns the full document structure, including nested propertyDetails and media array.
 */
exports.getPropertyByListingKey = async (req, res) => {
  try {
    const { listingKey } = req.params;

    // Validate listingKey is provided and is a non-empty string
    if (!listingKey || typeof listingKey !== 'string' || listingKey.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Listing key is required and must be a non-empty string.',
      });
    }

    // Find the property by listingId (unique field in propertyDetails)
    const property = await AgentProperty.findOne({
      'propertyDetails.listingId': listingKey.trim(),
    }).lean(); // Use .lean() for better performance on read-only query

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found for the provided listing key.',
      });
    }

    // Optionally, transform the response structure if needed (e.g., to match frontend expectations)
    // Here, we return the full raw document for completeness; adjust projection if only specific fields are needed

    return res.json({
      success: true,
      data: property,
    });
  } catch (err) {
    console.error('[getPropertyByListingKey] error:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch property details.',
    });
  }
};