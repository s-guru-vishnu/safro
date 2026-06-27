const FavoriteLocation = require('../models/FavoriteLocation');

/**
 * @desc    Get all favorite locations for a user
 * @route   GET /api/locations
 * @access  Private
 */
exports.getFavorites = async (req, res, next) => {
    try {
        const locations = await FavoriteLocation.find({ user: req.user.id }).sort('-createdAt');
        res.json({ success: true, count: locations.length, data: locations });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a new favorite location
 * @route   POST /api/locations
 * @access  Private
 */
exports.addFavorite = async (req, res, next) => {
    try {
        const { label, customName, address, coordinates } = req.body;

        // Ensure user hasn't exceeded the limit (e.g., 5 locations)
        const count = await FavoriteLocation.countDocuments({ user: req.user.id });
        if (count >= 5) {
            return res.status(400).json({ message: 'Maximum 5 favorite locations allowed. Please remove an old one.' });
        }

        // Check if label already exists (for Home/Work)
        if (label !== 'Custom') {
            const existing = await FavoriteLocation.findOne({ user: req.user.id, label });
            if (existing) {
                return res.status(400).json({ message: `You already have a location saved as ${label}. Edit or delete it first.` });
            }
        }

        const location = await FavoriteLocation.create({
            user: req.user.id,
            label,
            customName,
            address,
            coordinates
        });

        res.status(201).json({ success: true, data: location });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A location with this name already exists.' });
        }
        next(error);
    }
};

/**
 * @desc    Update a favorite location
 * @route   PUT /api/locations/:id
 * @access  Private
 */
exports.updateFavorite = async (req, res, next) => {
    try {
        let location = await FavoriteLocation.findById(req.params.id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        if (location.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { label, customName, address, coordinates } = req.body;

        // Check if changing label to an existing Home/Work
        if (label && label !== 'Custom' && label !== location.label) {
            const existing = await FavoriteLocation.findOne({ user: req.user.id, label });
            if (existing) {
                return res.status(400).json({ message: `You already have a location saved as ${label}.` });
            }
        }

        location = await FavoriteLocation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: location });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete favorite location
 * @route   DELETE /api/locations/:id
 * @access  Private
 */
exports.deleteFavorite = async (req, res, next) => {
    try {
        const location = await FavoriteLocation.findById(req.params.id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        if (location.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await location.deleteOne();

        res.json({ success: true, message: 'Location removed' });
    } catch (error) {
        next(error);
    }
};
