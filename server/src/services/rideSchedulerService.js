const cron = require('node-cron');
const Ride = require('../models/Ride');
const User = require('../models/User');
const Negotiation = require('../models/Negotiation');
const SplitFare = require('../models/SplitFare');
const { identifyTaluk } = require('../utils/geoUtils');

/**
 * Ride Scheduler Service
 * Runs background cron jobs to manage scheduled rides:
 *   1. Activate rides 10 min before scheduled time (→ pending, broadcast to drivers)
 *   2. Send reminders 30 min before scheduled time
 *   3. Auto-expire missed scheduled rides
 */

let ioInstance = null;

const startScheduler = (io) => {
    ioInstance = io;

    // Run every 60 seconds
    cron.schedule('* * * * *', async () => {
        try {
            await activateUpcomingRides();
            await sendRideReminders();
            await expireStaleRides();
            await expireSplitFareInvites();
        } catch (err) {
            console.error('[Scheduler] Error in cron cycle:', err.message);
        }
    });

    console.log('⏰ Ride scheduler started (runs every 60s)');
};

/**
 * Job 1: Activate rides where scheduledTime is within the next 10 minutes
 * Transitions: scheduled → pending, broadcasts to drivers
 */
const activateUpcomingRides = async () => {
    const now = new Date();
    const activationWindow = new Date(now.getTime() + 10 * 60 * 1000); // 10min ahead

    const rides = await Ride.find({
        status: 'scheduled',
        scheduledTime: { $lte: activationWindow }
    });

    for (const ride of rides) {
        try {
            ride.status = 'pending';
            await ride.save();

            // Set active ride on user
            await User.findByIdAndUpdate(ride.riderId, { activeRideId: ride._id });

            // Create initial negotiation entry
            await Negotiation.create({
                rideId: ride._id,
                sender: ride.riderId,
                role: 'rider',
                amount: ride.fare.proposed,
                type: 'offer',
                status: 'active'
            });

            // Broadcast to drivers via Socket.io
            if (ioInstance) {
                if (ride.taluk) {
                    ioInstance.to(`driver_taluk_${ride.taluk}`).emit('newRideRequest', ride);
                } else {
                    ioInstance.to('driver').emit('newRideRequest', ride);
                }

                // Notify rider that their scheduled ride is now live
                ioInstance.to(ride.riderId.toString()).emit('scheduledRideActivated', {
                    rideId: ride._id,
                    message: 'Your scheduled ride is now live! Looking for drivers...'
                });
            }

            console.log(`⏰ [Scheduler] Activated scheduled ride ${ride._id} → pending`);
        } catch (err) {
            console.error(`[Scheduler] Failed to activate ride ${ride._id}:`, err.message);
        }
    }
};

/**
 * Job 2: Send reminders for rides scheduled within 30 minutes
 */
const sendRideReminders = async () => {
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 30 * 60 * 1000);

    const rides = await Ride.find({
        status: 'scheduled',
        scheduledTime: { $lte: reminderWindow },
        reminderSent: false
    });

    for (const ride of rides) {
        try {
            ride.reminderSent = true;
            await ride.save();

            // Notify rider via socket
            if (ioInstance) {
                ioInstance.to(ride.riderId.toString()).emit('rideReminder', {
                    rideId: ride._id,
                    scheduledTime: ride.scheduledTime,
                    message: 'Your scheduled ride is coming up in less than 30 minutes!'
                });
            }

            // Send reminder email (non-blocking)
            try {
                const user = await User.findById(ride.riderId);
                if (user) {
                    const { sendScheduledRideReminderEmail } = require('./notificationService');
                    sendScheduledRideReminderEmail(
                        { name: user.name, email: user.email },
                        {
                            pickupAddress: ride.pickupLocation?.address,
                            dropAddress: ride.dropLocation?.address,
                            scheduledTime: ride.scheduledTime
                        }
                    );
                }
            } catch (e) { /* non-blocking */ }

            console.log(`⏰ [Scheduler] Reminder sent for ride ${ride._id}`);
        } catch (err) {
            console.error(`[Scheduler] Failed to send reminder for ride ${ride._id}:`, err.message);
        }
    }
};

/**
 * Job 3: Auto-expire rides that were scheduled but missed (5 min past scheduled time)
 */
const expireStaleRides = async () => {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago

    const rides = await Ride.find({
        status: 'scheduled',
        scheduledTime: { $lt: expiryThreshold }
    });

    for (const ride of rides) {
        try {
            ride.status = 'cancelled';
            ride.cancelledBy = 'system';
            await ride.save();

            if (ioInstance) {
                ioInstance.to(ride.riderId.toString()).emit('scheduledRideExpired', {
                    rideId: ride._id,
                    message: 'Your scheduled ride was automatically cancelled because it was not activated in time.'
                });
            }

            console.log(`⏰ [Scheduler] Expired stale ride ${ride._id}`);
        } catch (err) {
            console.error(`[Scheduler] Failed to expire ride ${ride._id}:`, err.message);
        }
    }
};

/**
 * Job 4: Expire split fare invites past their expiry time
 */
const expireSplitFareInvites = async () => {
    const now = new Date();

    const splits = await SplitFare.find({
        status: { $in: ['pending', 'active'] },
        inviteExpiry: { $lt: now },
        'passengers.inviteStatus': 'invited'
    });

    for (const split of splits) {
        try {
            let changed = false;
            split.passengers.forEach(p => {
                if (p.inviteStatus === 'invited') {
                    p.inviteStatus = 'expired';
                    changed = true;
                }
            });

            if (changed) {
                split.recalculateShares();
                await split.save();

                // Notify participants
                if (ioInstance) {
                    split.passengers.forEach(p => {
                        if (p.userId) {
                            ioInstance.to(p.userId.toString()).emit('splitFareUpdated', { splitFare: split });
                        }
                    });
                }
            }
        } catch (err) {
            console.error(`[Scheduler] Failed to expire split invites for ${split._id}:`, err.message);
        }
    }
};

module.exports = { startScheduler };
