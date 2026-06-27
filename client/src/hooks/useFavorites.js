import { useState, useEffect, useCallback } from 'react';
import { getFavorites, addFavorite, updateFavorite, deleteFavorite } from '../services/api';
import toast from 'react-hot-toast';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFavorites = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFavorites();
            setFavorites(res.data.data || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch favorites');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    const addFav = async (data) => {
        try {
            const res = await addFavorite(data);
            setFavorites(prev => [res.data.data, ...prev]);
            toast.success('Location saved successfully!');
            return res.data.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save location';
            toast.error(msg);
            throw err;
        }
    };

    const updateFav = async (id, data) => {
        try {
            const res = await updateFavorite(id, data);
            setFavorites(prev => prev.map(f => f._id === id ? res.data.data : f));
            toast.success('Location updated!');
            return res.data.data;
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update location';
            toast.error(msg);
            throw err;
        }
    };

    const removeFav = async (id) => {
        try {
            await deleteFavorite(id);
            setFavorites(prev => prev.filter(f => f._id !== id));
            toast.success('Location removed');
            return true;
        } catch (err) {
            toast.error('Failed to remove location');
            throw err;
        }
    };

    return {
        favorites,
        loading,
        error,
        fetchFavorites,
        addFavorite: addFav,
        updateFavorite: updateFav,
        removeFavorite: removeFav,
        homeLocation: favorites.find(f => f.label === 'Home'),
        workLocation: favorites.find(f => f.label === 'Work')
    };
};
