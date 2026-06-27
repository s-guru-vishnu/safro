const express = require('express');
const router = express.Router();
const {
    getFavorites,
    addFavorite,
    updateFavorite,
    deleteFavorite
} = require('../controllers/locationController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router
    .route('/')
    .get(getFavorites)
    .post(addFavorite);

router
    .route('/:id')
    .put(updateFavorite)
    .delete(deleteFavorite);

module.exports = router;
