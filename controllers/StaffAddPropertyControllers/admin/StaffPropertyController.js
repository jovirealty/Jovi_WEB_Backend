// controllers/StaffAddPropertyControllers/admin/StaffPropertyController.js
const mongoose = require("mongoose");
const AgentProperty = require("../../../models/agentpropertyschema/AgentPropertySchema.js");
const AgentList = require("../../../models/AgentListingSchema.js");
const { generateListingId } = require("../../../services/AddPropertyService/admin/ListingIdService.js");
const { uploadBufferToSpaces } = require("../../../services/DOSpaceServices/SpacesUpload.js");
const { validatePropertyPayload } = require("../../../middlewares/DashboardMiddlewares/validation/StaffAddProperty/admin/staffProperty.validator.js");


// POST call create property listings for agents off market
exports.createProperty = async (req, res) => {
    // console.log("Received createProperty request", req.body);
  try {
    // 🔹 Parse the JSON payload if it came via FormData
    let body = req.body;
    if (typeof body.payload === "string") {
      try {
        body = JSON.parse(body.payload);
        console.log("Parsed JSON payload:", body);
      } catch (err) {
        console.error("Invalid JSON in payload:", err);
        return res.status(400).json({ success: false, message: "Malformed JSON payload" });
      }
    }
    if (!body.propertyDetails.listingDate) {
        body.propertyDetails.listingDate = new Date().toISOString().slice(0, 10);
    }

    // 🔹 Now validate the parsed body
    const { error } = validatePropertyPayload(body);
    if (error) {
      return res
        .status(400)
        .json({ success: false, message: `This is check in backend ${error.details[0].message}` });
    }

    const { propertyDetails, agentDetail, userId, agentListId } = body;
    console.log("Received Property Details:", { propertyDetails, agentDetail, userId, agentListId });

    // Ensure listingId (server-side)
    const listingId =
      propertyDetails.listingId ||
      generateListingId(propertyDetails.propertyFor);

    const base = `OffMarketPropertyListings/${listingId}`;

    const uploadedMedia = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const folderCategory = file.mimetype.startsWith("image/") ? "Images"
         : file.mimetype.startsWith("video/") ? "Videos" : "VirtualTour";
       // DB enum: Photo | Video | VirtualTour
       const mediaCategory = file.mimetype.startsWith("image/") ? "Photo"
         : file.mimetype.startsWith("video/") ? "Video" : "VirtualTour";

        const folder = `${base}/${folderCategory}`;
        const up = await uploadBufferToSpaces(folder, file);

        uploadedMedia.push({
          mediaKey: up.key,
          mediaCategory,         // "Images" | "Videos" | "VirtualTour"
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


// GET: list property cards for admin property index
exports.listProperties = async (req, res) => {
  try {
    // read minimal fields from agentProperties
    const docs = await AgentProperty.find(
      {},
      { agentListId: 1, agentDetail: 1, "propertyDetails": 1 }
    ).lean();

    // join basic agent info from agentlists
    const ids = [...new Set(docs.map(d => String(d.agentListId)).filter(Boolean))];
    const agents = await AgentList.find(
      { _id: { $in: ids } },
      { fullName: 1, licenseNumber: 1, photoUrl: 1, avatar: 1, imageUrl: 1 }
    ).lean();
    const byId = new Map(agents.map(a => [String(a._id), a]));

    const data = docs.map(d => {
      const p = d.propertyDetails || {};
      const a = byId.get(String(d.agentListId)) || {};

      // address parts -> skip empties, add commas politely
      const addrParts = [
        p.unitNumber, p.streetNumber, p.streetName, p.streetSuffix, p.city, p.postalCode
      ].filter(Boolean);
      const propertyAddress = addrParts.join(", ");

      // pick the first Photo
      const firstPhoto =
        (p.media || []).find(m => String(m.mediaCategory || "").toLowerCase() === "photo") || null;

      return {
        _id: d._id,
        propertyAddress,
        propertyMedia: firstPhoto,
        agentName: d.agentDetail?.fullName || a.fullName || "",
        agentImage: a.photoUrl || a.avatar || a.imageUrl || null,
        stateProvince: p.stateProvince || "",
        city: p.city || "",
        currency: p.currency || "CAD",
        listPrice: Number(p.listPrice ?? p.rentPrice ?? 0),
        propertyType: p.type || "",
        bedrooms: Number(p.bedrooms ?? 0),
        squareFoot: Number(p.lotSqft ?? 0),
        licenseNumber: a.licenseNumber || "",
      };
    });

    return res.json({ data, count: data.length });
  } catch (err) {
    console.error("[listProperties] error:", err);
    return res.status(500).json({ success: false, message: "Internal error" });
  }
};

/**
 * GET /staff/property-listings/:id
 * Auth: required (wired in route)
 * Returns a single property from jovi_staff.agentProperties and enriches with agentlists fields.
 */
exports.getProperty = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid property id" });
    }

    // a) property from jovi_staff.agentProperties
    const property = await AgentProperty.findById(id).lean();
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // b) agentlists subset from joviDB using agentListId
    const agent = await AgentList.findById(
      property.agentListId,
      {
        photoUrl: 1,
        mlsId: 1,
        licenseNumber: 1,
        licensedAs: 1,
        personalRealEstateCorporationName: 1,
        licensedFor: 1,
      }
    ).lean();

    // club: agentDetail (stored) + agentlists subset => agentDetails
    const mergedAgentDetails = {
      // from stored property.agentDetail
      fullName: property.agentDetail?.fullName || "",
      email: property.agentDetail?.email || "",
      // from agentlists doc (if found)
      photoUrl: agent?.photoUrl ?? null,
      mlsId: agent?.mlsId || "",
      licenseNumber: agent?.licenseNumber || "",
      licensedAs: agent?.licensedAs || "",
      personalRealEstateCorporationName: agent?.personalRealEstateCorporationName || "",
      licensedFor: agent?.licensedFor || "",
    };

    // exclude original agentDetail key from the response payload
    const { agentDetail, ...rest } = property;

    return res.status(200).json({
      success: true,
      data: {
        ...rest,                 // complete agentProperties doc minus agentDetail
        agentDetails: mergedAgentDetails, // merged object
      },
    });
  } catch (err) {
    console.error("[getProperty] error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  }
};