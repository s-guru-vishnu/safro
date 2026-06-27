import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiShield, FiCalendar, FiEdit3, FiSave, FiX, FiMapPin } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', taluk: '' });

    useEffect(() => {
        api.get('/auth/profile').then(res => {
            setProfile(res.data.user);
            setForm({
                name: res.data.user?.name || '',
                phone: res.data.user?.phone || '',
                taluk: res.data.user?.taluk || '',
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
            taluk: profile?.taluk || '',
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Profile</h1>
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
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                                {data?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-6 pb-6">
                        {/* Name & Role */}
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{data?.name}</h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-xs font-semibold rounded-full capitalize">
                                <FiShield size={10} /> Administrator
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
                                    <Field icon={FiMapPin} label="Taluk (Admin Region)" value={form.taluk} onChange={v => setForm(p => ({ ...p, taluk: v }))} />

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
                                    <InfoRow icon={FiMapPin} label="Taluk" value={data?.taluk || 'All Regions'} />
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

export default AdminProfile;
