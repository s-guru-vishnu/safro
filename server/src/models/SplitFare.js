const mongoose = require('mongoose');
const crypto = require('crypto');

const passengerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    phone: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: ''
    },
    amount: {
        type: Number,
        default: 0
    },
    inviteStatus: {
        type: String,
        enum: ['invited', 'accepted', 'rejected', 'expired'],
        default: 'invited'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['wallet', 'razorpay', null],
        default: null
    },
    invitedAt: {
        type: Date,
        default: Date.now
    },
    respondedAt: {
        type: Date,
        default: null
    },
    paidAt: {
        type: Date,
        default: null
    }
}, { _id: true });

const splitFareSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true,
        index: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    totalFare: {
        type: Number,
        default: 0
    },
    splitType: {
        type: String,
        enum: ['equal', 'custom'],
        default: 'equal'
    },
    maxPassengers: {
        type: Number,
        default: 4,
        min: 2,
        max: 6
    },
    inviteExpiry: {
        type: Date,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'settled', 'cancelled'],
        default: 'pending'
    },
    passengers: [passengerSchema],
    inviteCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(6).toString('hex')
    }
}, {
    timestamps: true
});

splitFareSchema.index({ createdBy: 1 });
splitFareSchema.index({ 'passengers.userId': 1 });

// Virtual: count of accepted passengers
splitFareSchema.virtual('acceptedCount').get(function () {
    return this.passengers.filter(p => p.inviteStatus === 'accepted').length;
});

// Virtual: count of paid passengers
splitFareSchema.virtual('paidCount').get(function () {
    return this.passengers.filter(p => p.paymentStatus === 'paid').length;
});

// Method: recalculate equal shares
splitFareSchema.methods.recalculateShares = function () {
    if (this.splitType !== 'equal' || !this.totalFare) return;
    const accepted = this.passengers.filter(p => p.inviteStatus === 'accepted');
    if (accepted.length === 0) return;
    const share = Math.ceil(this.totalFare / accepted.length);
    accepted.forEach(p => { p.amount = share; });
    // Adjust last person to account for rounding
    const total = share * accepted.length;
    if (total > this.totalFare) {
        accepted[accepted.length - 1].amount -= (total - this.totalFare);
    }
};

// Method: check if all accepted passengers have paid
splitFareSchema.methods.isFullyPaid = function () {
    const accepted = this.passengers.filter(p => p.inviteStatus === 'accepted');
    return accepted.length > 0 && accepted.every(p => p.paymentStatus === 'paid');
};

module.exports = mongoose.model('SplitFare', splitFareSchema);
