const mongoose = require('mongoose');

/**
 * CrowdZone Model
 * Stores high-density pickup zones (e.g., airport terminals, stations, malls)
 */
const crowdZoneSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    radius: {
        type: Number, // Radius in meters
        default: 200
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

crowdZoneSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('CrowdZone', crowdZoneSchema);
