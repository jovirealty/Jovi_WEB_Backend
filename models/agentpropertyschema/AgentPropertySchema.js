const mongoose = require("mongoose");
const { getStaffConn } = require("../../config/db");
const { generateListingId } = require("../../services/AddPropertyService/admin/ListingIdService");

// ── Constants ──────────────────────────────────────────────────────────────
const PROPERTY_FOR = ["sale", "rent"];
const PROPERTY_STATUS = ["Active", "Inactive", "Hold", "Deactivated", "Coming soon"];
const PROPERTY_TYPES = ["Residential", "Land", "Residential Income", "Residential Lease"];
const PROPERTY_SUBTYPES = [
  "Single Family Residence",
  "Apartment/Condo",
  "Townhouse",
  "Duplex",
  "Half Duplex",
  "Manufactured Home",
  "Manufactured On Land",
  "Other",
  "Recreational",
  "Quadruplex",
];

// ── Property Media Schema ──────────────────────────────────────────────────
const PropertyMediaSchema = new mongoose.Schema(
  {
    mediaKey: { type: String, required: true }, // internal unique key per file
    mediaCategory: { type: String, enum: ["Photo", "Video", "VirtualTour"], required: true },
    mediaURL: { type: String, required: true }, // full DO/CDN URL
    mediaObjectID: { type: String, required: true }, // DO object id
    mimeType: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          const allowedImages = ["image/jpeg", "image/jpg", "image/png"];
          const allowedVideos = ["video/mp4", "video/quicktime"]; // .mov
          return [...allowedImages, ...allowedVideos].includes(v.toLowerCase());
        },
        message:
          "Invalid file type. Allowed: JPEG, JPG, PNG for images; MP4, MOV for videos.",
      },
    },
    order: { type: Number, default: 0 },
    mediaSize: {
      type: Number,
      required: true,
      validate: {
        validator: function (v) {
          // Limit image size to <= 1MB; videos validated at upload service level
          return this.mimeType.startsWith("image/")
            ? v <= 1024 * 1024
            : v <= 1024 * 1024 * 100; // allow larger limit for videos if needed
        },
        message: "Image file size must not exceed 1MB.",
      },
    },
    resourceName: {
      type: String,
      enum: PROPERTY_SUBTYPES,
      required: true,
    },
    shortDescription: { type: String, maxlength: 300 },
  },
  { _id: false }
);

// ── Property Details (flat) ────────────────────────────────────────────────
const PropertyDetailsSchema = new mongoose.Schema(
  {
    propertyFor: { type: String, enum: PROPERTY_FOR, required: true },
    status: { type: String, enum: PROPERTY_STATUS, required: true },
    listingId: { type: String, required: true, unique: true },
    type: { type: String, enum: PROPERTY_TYPES, required: true },
    subtype: { type: String, enum: PROPERTY_SUBTYPES, required: true },
    description: { type: String, required: true },
    listingDate: { type: Date, default: () => new Date() },
    yearBuilt: { type: Number },

    // pricing
    currency: { type: String, default: "CAD", required: true },
    listPrice: { type: Number, min: 0, required: function () { return this.propertyFor === "sale"; }, },
    rentPrice: { type: Number, min: 0, required: function () { return this.propertyFor === "rent"; }, },

    // address
    unitNumber: String,
    streetNumber: String,
    streetName: String,
    streetSuffix: String,
    stateProvince: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String },
    latitude: Number,
    longitude: Number,
    subdivision: String,

    // interior
    bedrooms: { type: Number, required: true },
    totalBath: { type: Number, required: true },
    halfBath: Number,
    livingArea: Number,
    floorArea: Number,
    interiorFeatures: String,
    heatingSystem: String,
    totalFireplace: Number,
    fireplaceFeature: String,
    laundryFeature: String,
    appliances: String,

    // exterior
    parking: String,
    lotAcre: Number,
    lotSqft: Number,
    lotDimensions: String,
    lotFeatures: String,
    openParking: Number,
    totalParking: Number,
    parkingFeatures: String,
    hasView: Boolean,
    viewDescription: String,
    exteriorFeatures: String,

    // community
    strata: Number,
    amenities: String,
    petPolicy: String,

    // financial
    taxYear: Number,
    annualTaxAmount: Number,
    pricePerSqft: Number,

    // media
    media: [PropertyMediaSchema],
  },
  { _id: false }
);

// ── AgentProperty main schema ──────────────────────────────────────────────
const AgentPropertySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "StaffAccount",
    },
    agentListId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "AgentList",
    },
    agentDetail: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
    },
    propertyDetails: { type: PropertyDetailsSchema, required: true },
  },
  { timestamps: true, collection: "agentProperties" }
);

// ── Pre-validate hook to auto-generate listingId ───────────────────────────
AgentPropertySchema.pre("validate", function (next) {
  if (!this.propertyDetails.listingId) {
    this.propertyDetails.listingId = generateListingId(
      this.propertyDetails.propertyFor
    );
  }
  next();
});

const jovi = getStaffConn();
module.exports =
  jovi.models.AgentProperty ||
  jovi.model("AgentProperty", AgentPropertySchema, "agentProperties");
