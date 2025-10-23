// controllers/StaffAddPropertyControllers/admin/StaffPropertyController.js
const AgentProperty = require("../../../models/agentpropertyschema/AgentPropertySchema.js");
const { generateListingId } = require("../../../services/AddPropertyService/admin/ListingIdService.js");
const { uploadBufferToSpaces } = require("../../../services/DOSpaceServices/SpacesUpload.js");
const { validatePropertyPayload } = require("../../../middlewares/DashboardMiddlewares/validation/StaffAddProperty/admin/staffProperty.validator.js");


// POST call create property listings for agents off market
exports.createProperty = async (req, res) => {
  try {
    const { error } = validatePropertyPayload(req.body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    }

    const { propertyDetails, agentDetail, userId, agentListId } = req.body;
    console.log("Received Property Details:", { propertyDetails, agentDetail, userId, agentListId });

    // Ensure listingId (server-side)
    const listingId =
      propertyDetails.listingId ||
      generateListingId(propertyDetails.propertyFor);

    const base = `OffMarketPropertyListings/${listingId}`;

    const uploadedMedia = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const category = file.mimetype.startsWith("image/")
          ? "Images"
          : file.mimetype.startsWith("video/")
          ? "Videos"
          : "VirtualTour";  // this has to change later

        const folder = `${base}/${category}`;
        const up = await uploadBufferToSpaces(folder, file);

        uploadedMedia.push({
          mediaKey: up.key,
          mediaCategory: category,         // "Images" | "Videos" | "VirtualTour"
          mediaURL: up.url,
          mediaObjectID: up.name,
          mimeType: up.mime,
          order: uploadedMedia.length,
          mediaSize: up.size,
          resourceName: propertyDetails.subtype || "",
          shortDescription: "",
        });
      }
    }
    console.log("values from server check here", {
      userId,
      agentListId,
      agentDetail,
      propertyDetails: {
        ...propertyDetails,
        listingId,
        media: uploadedMedia,
      },
    });
    const doc = await AgentProperty.create({
      userId,
      agentListId,
      agentDetail,
      propertyDetails: {
        ...propertyDetails,
        listingId,
        media: uploadedMedia,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Property listing created successfully",
      data: doc,
    });
  } catch (err) {
    console.error("[createProperty] error:", err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
};
