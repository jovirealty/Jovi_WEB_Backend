// controllers/ResourceControllers/admin/AdminResourceController.js

const Resource = require('../../../models/resourcesSchema/ResourceSchema');  // Adjust path if needed
const crypto = require('crypto');
const { createResourceValidator } = require('../../../middlewares/DashboardMiddlewares/validation/ResourceValidator/admin/AdminResourceValidator');
const { uploadBufferToSpaces } = require('../../../services/DOSpaceServices/SpacesUpload');  // Adjust path to match your structure (e.g., if utils folder is shared)

// Create a new resource (POST)
const createResource = async (req, res) => {
  try {
    // Parse multipart payload (JSON string in 'payload' field)
    const fullBody = JSON.parse(req.body.payload || '{}');

    // Validate parsed body
    const { error } = createResourceValidator.validate(fullBody);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Destructure validated data
    const {
      category,
      title,
      subTitle,
      content,
      properties = {},
      resourceMedia = [],  // Array of URLs from body
      publish = false,
      views = 0,
    } = fullBody;

    // Save draft resource first to get _id
    const resource = new Resource({
      category,
      title,
      subTitle,
      content,  // HTML as-is; assumes client inserted media URLs
      properties,
      resourceMedia,  // Store URLs directly
      publish,
      views,
    });
    await resource.save();

    const resourceId = resource._id.toString();  // For folder paths

    // Handle coverPhoto upload (single file)
    let coverPhotoUrl = '';
    if (req.file) {
      const uploadResult = await uploadBufferToSpaces(`ResourceMedia/${resourceId}/coverImage`, req.file);
      coverPhotoUrl = uploadResult.url;
      resource.coverPhoto = coverPhotoUrl;
    }

    // Update resource with cover URL (resourceMedia already set from body)
    await resource.save();

    res.status(201).json(resource);  // Return full resource

  } catch (err) {
    console.error('Create resource error:', err);
    res.status(500).json({ error: 'Failed to create resource' });
  }
};

module.exports = {
  createResource,
};