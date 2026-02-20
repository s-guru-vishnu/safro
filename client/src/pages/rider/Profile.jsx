import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiShield, FiCalendar, FiEdit3, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: '', phone: '', guardianPhone: '', guardianEmail: '' });

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
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    {!editing && (
                        <button
                            onClick={() => setEditing(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-teal-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors"
                        >
                            <FiEdit3 size={14} /> Edit
                        </button>
                    )}
                </div>

                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >
                    {/* Banner + Avatar */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 h-28 relative">
                        <div className="absolute -bottom-8 left-6">
                            <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white">
                                {data?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-6 pb-6">
                        {/* Name & Role */}
                        <div className="mb-5">
                            <h2 className="text-lg font-bold text-gray-900">{data?.name}</h2>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full capitalize">
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
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
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
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                                            <FiShield size={15} className={data?.negotiationScore < 60 ? 'text-amber-500' : 'text-teal-500'} />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium block">Negotiation Score</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${data?.negotiationScore < 40 ? 'text-red-600' : data?.negotiationScore < 60 ? 'text-amber-600' : 'text-teal-600'}`}>
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
                        <a href="/driver/register" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-50 transition-colors">
                            Apply as Driver <FiCheckCircle size={12} />
                        </a>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const Field = ({ icon: Icon, label, value, onChange, type = 'text' }) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <div className="relative">
            <Icon className="absolute left-3.5 top-3.5 text-gray-400" size={15} />
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all outline-none"
            />
        </div>
    </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
        <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-100">
            <Icon size={15} className="text-gray-400" />
        </div>
        <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium block">{label}</span>
            <span className="text-sm text-gray-800 font-medium">{value}</span>
        </div>
    </div>
);

export default Profile;
