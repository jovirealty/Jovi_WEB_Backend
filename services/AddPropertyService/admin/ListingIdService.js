// services/AddPropertyService/ListingIdService.js
const { customAlphabet } = require("nanoid");

// Create a short, readable unique suffix
const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

exports.generateListingId = (propertyFor) => {
  const prefix = propertyFor?.toLowerCase() === "rent" ? "RENT" : "SALE";
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${nanoid()}`;
};