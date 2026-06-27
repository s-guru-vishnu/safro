const mongoose = require('mongoose');

const favoriteLocationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    label: {
        type: String,
        enum: ['Home', 'Work', 'Custom'],
        required: [true, 'Label is required']
    },
    customName: {
        type: String,
        trim: true,
        required: function() {
            return this.label === 'Custom';
        }
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    coordinates: {
        lat: {
            type: Number,
            required: [true, 'Latitude is required']
        },
        lng: {
            type: Number,
            required: [true, 'Longitude is required']
        }
    }
}, {
    timestamps: true
});

// Prevent users from having duplicate labels (e.g. two Homes)
favoriteLocationSchema.index({ user: 1, label: 1, customName: 1 }, { unique: true });

module.exports = mongoose.model('FavoriteLocation', favoriteLocationSchema);
