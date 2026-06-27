import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiShield, FiCalendar, FiEdit3, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useFavorites } from '../../hooks/useFavorites';
import FavoriteLocationModal from '../../components/map/FavoriteLocationModal';
import { FiMapPin, FiHome, FiBriefcase, FiTrash2, FiPlus } from 'react-icons/fi';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', guardianPhone: '', guardianEmail: '' });
    
    // Favorites
    const { favorites, loading: favLoading, addFavorite, removeFavorite } = useFavorites();
    const [isFavModalOpen, setIsFavModalOpen] = useState(false);

    useEffect(() => {
        api.get('/auth/profile').then(res => {
            setProfile(res.data.user);
            setForm({
                name: res.data.user?.name || '',
                phone: res.data.user?.phone || '',
                guardianPhone: res.data.user?.guardianPhone || '',
                guardianEmail: res.data.user?.guardianEmail || '',
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/auth/profile', form);
            setProfile(res.data.user);
            setEditing(false);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({
            name: profile?.name || '',
            phone: profile?.phone || '',
            guardianPhone: profile?.guardianPhone || '',
            guardianEmail: profile?.guardianEmail || '',
        });
        setEditing(false);
    };

    if (loading) return <LoadingSpinner size="lg" text="Loading profile..." />;

    const data = profile || user;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-xl hover:bg-teal-100 dark:bg-teal-900/30 transition-colors"
                        >
                            <FiEdit3 size={14} /> Edit
                        </button>
                    )}
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    {/* Banner + Avatar */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 h-28 relative">
                        <div className="absolute -bottom-8 left-6">
                            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-900/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                                {data?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-6 pb-6">
                        {/* Name & Role */}
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{data?.name}</h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold rounded-full capitalize">
                                <FiUser size={10} /> {data?.role}
                            </span>
                        </div>

                        <AnimatePresence mode="wait">
                            {editing ? (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    <Field icon={FiUser} label="Full Name" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} />
                                    <Field icon={FiPhone} label="Phone" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
                                    <Field icon={FiShield} label="Guardian Phone" value={form.guardianPhone} onChange={v => setForm(p => ({ ...p, guardianPhone: v }))} />
                                    <Field icon={FiMail} label="Guardian Email" value={form.guardianEmail} onChange={v => setForm(p => ({ ...p, guardianEmail: v }))} type="email" />

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={handleCancel}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <FiX size={14} /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-[2] py-3 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-sm"
                                        >
                                            {saving ? (
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><FiSave size={14} /> Save Changes</>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-3"
                                >
                                    <InfoRow icon={FiMail} label="Email" value={data?.email} />
                                    <InfoRow icon={FiPhone} label="Phone" value={data?.phone || 'Not set'} />
                                    {data?.guardianPhone && <InfoRow icon={FiShield} label="Guardian Phone" value={data.guardianPhone} />}
                                    {data?.guardianEmail && <InfoRow icon={FiShield} label="Guardian Email" value={data.guardianEmail} />}
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-xl">
                                        <div className="w-9 h-9 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800">
                                            <FiShield size={15} className={data?.negotiationScore < 60 ? 'text-amber-500' : 'text-teal-500'} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block">Negotiation Score</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${data?.negotiationScore < 40 ? 'text-red-600 dark:text-red-400' : data?.negotiationScore < 60 ? 'text-amber-600' : 'text-teal-600 dark:text-teal-400'}`}>
                                                    {data?.negotiationScore !== undefined ? data.negotiationScore : 100}/100
                                                </span>
                                                {data?.negotiationScore < 60 && (
                                                    <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-semibold">
                                                        {data?.negotiationScore < 40 ? '⚠ Blocked' : '⚠ Low'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <InfoRow
                                        icon={FiCalendar}
                                        label="Member Since"
                                        value={data?.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Saved Locations Section */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FiMapPin className="text-teal-500" /> Saved Locations
                        </h2>
                        <button
                            onClick={() => setIsFavModalOpen(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 transition-colors"
                        >
                            <FiPlus /> Add New
                        </button>
                    </div>

                    {favLoading ? (
                        <div className="animate-pulse space-y-3">
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                            <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 border-dashed">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No saved locations yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {favorites.map(fav => (
                                <div key={fav._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 group transition-all hover:border-teal-200 dark:hover:border-teal-800">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 shrink-0 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                            {fav.label === 'Home' ? <FiHome size={18} /> : fav.label === 'Work' ? <FiBriefcase size={18} /> : <FiMapPin size={18} />}
                                        </div>
                                        <div className="min-w-0 pr-4">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {fav.label === 'Custom' ? fav.customName : fav.label}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                {fav.address}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFavorite(fav._id)}
                                        className="p-2 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Become a Driver CTA */}
                {data?.role === 'rider' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-5 bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 text-white"
                    >
                        <h3 className="font-bold text-sm mb-1">Want to earn on Safro?</h3>
                        <p className="text-xs text-teal-100 mb-3">Apply to become a verified driver and start earning.</p>
                        <a href="/driver/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-900 text-teal-700 dark:text-teal-400 text-xs font-semibold rounded-lg hover:bg-teal-50 dark:bg-teal-900/20 transition-colors">
                            Apply as Driver <FiCheckCircle size={12} />
                        </a>
                    </motion.div>
                )}
                
                {/* Favorite Location Modal */}
                <FavoriteLocationModal 
                    isOpen={isFavModalOpen}
                    onClose={() => setIsFavModalOpen(false)}
                    onSave={addFavorite}
                />
            </div>
        </div>
    );
};

const Field = ({ icon: Icon, label, value, onChange, type = 'text' }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={15} />
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all outline-none"
            />
        </div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-xl">
        <div className="w-9 h-9 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800">
            <Icon size={15} className="text-gray-400 dark:text-gray-500" />
        </div>
        <div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-medium block">{label}</span>
            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value}</span>
        </div>
    </div>
);

export default Profile;
