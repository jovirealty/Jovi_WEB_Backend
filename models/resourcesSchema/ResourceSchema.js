// models/resourcesSchema/ResourceSchema.js

const mongoose = require('mongoose');
const { getStaffConn } = require('../../config/db');

const resourceSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['blog', 'news', 'podcast', 'e-book'],
    required: true,
    index: true,  // For category-based queries
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  subTitle: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    trim: true,
    // Optional; auto-generate later via pre-save hook if needed
  },
  excerpt: {
    type: String,
    trim: true,
    // Optional; auto-derive from content later
  },
  coverPhoto: {
    type: String,  // URL from DO Spaces
  },
  content: {
    type: String,  // Full HTML string from Tiptap (e.g., <p><strong>Bold</strong></p><img src="...">)
    // Media in content: URLs inserted client-side via presign; stored as-is in HTML
  },
  properties: {
    tags: [{
      type: String,
      trim: true,
    }],
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    metaKeywords: {
      type: String,
      trim: true,
    },
  },
  publish: {
    type: Boolean,
    default: false,
  },
  views: {
    type: Number,
    default: 0,
  },
  // Timestamps (auto-managed)
}, {
  timestamps: true,  // Adds createdAt/updatedAt
});

// Map timestamps to custom fields (for frontend consistency)
// Alias createdAt as creationDate
resourceSchema.virtual('creationDate').get(function() {
  return this.createdAt;
});
// No need for updatedAt virtual – it's already available as updatedAt

// Indexes for performance
resourceSchema.index({ category: 1, publish: 1, createdAt: -1 });  // List queries
resourceSchema.index({ title: 'text', content: 'text', 'properties.tags': 'text' });  // Search

const jovi = getStaffConn();
module.exports = jovi.models.Resource || jovi.model("Resource", resourceSchema, "resources");