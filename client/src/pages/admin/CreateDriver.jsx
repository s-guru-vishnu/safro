import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiTruck, FiFileText, FiShield, FiArrowLeft, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';
import CustomDropdown from '../../components/CustomDropdown';
import { tamilNaduData } from '../../utils/tamilnaduData';

const CreateDriver = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        vehicleType: 'sedan', vehicleNumber: '', licenseNumber: '',
        aadhaar: '', rc: '', insurance: '', district: '', taluk: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/admin/create-driver', form);
            toast.success('Driver created and verified successfully!');
            navigate('/admin/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create driver');
        } finally {
            setLoading(false);
        }
    };

    const InputField = ({ icon: Icon, label, ...props }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                <input
                    {...props}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all outline-none"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-colors mb-6">
                    <FiArrowLeft size={14} /> Back
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg flex items-center justify-center">
                            <FiTruck size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create New Driver</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Driver will be auto-verified and approved</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Personal Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <InputField icon={FiUser} label="Full Name" type="text" name="name" placeholder="Driver name" value={form.name} required />
                                <InputField icon={FiMail} label="Email" type="email" name="email" placeholder="driver@email.com" value={form.email} required />
                                <InputField icon={FiLock} label="Password" type="password" name="password" placeholder="Min 6 characters" value={form.password} required />
                                <InputField icon={FiPhone} label="Phone" type="tel" name="phone" placeholder="Phone number" value={form.phone} required />
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Vehicle Details</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <CustomDropdown
                                    label="Vehicle Type"
                                    icon={FiTruck}
                                    options={['bike', 'auto', 'sedan', 'suv']}
                                    value={form.vehicleType}
                                    onChange={(val) => setForm({ ...form, vehicleType: val })}
                                    searchable={false}
                                />
                                <InputField icon={FiTruck} label="Vehicle Number" type="text" name="vehicleNumber" placeholder="e.g. KA-01-AB-1234" value={form.vehicleNumber} required />
                                <InputField icon={FiFileText} label="License Number" type="text" name="licenseNumber" placeholder="License number" value={form.licenseNumber} required />
                                
                                <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                                    <CustomDropdown
                                        label="District"
                                        icon={FiMapPin}
                                        options={Object.keys(tamilNaduData).sort()}
                                        value={form.district}
                                        onChange={(val) => setForm({ ...form, district: val, taluk: '' })}
                                        placeholder="Select District"
                                    />
                                    <CustomDropdown
                                        label="Taluk"
                                        icon={FiMapPin}
                                        options={form.district ? tamilNaduData[form.district]?.sort() : []}
                                        value={form.taluk}
                                        onChange={(val) => setForm({ ...form, taluk: val })}
                                        placeholder={form.district ? "Select Taluk" : "Select District first"}
                                        disabled={!form.district}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Documents</h4>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <InputField icon={FiShield} label="Aadhaar" type="text" name="aadhaar" placeholder="Aadhaar number" value={form.aadhaar} />
                                <InputField icon={FiFileText} label="RC Number" type="text" name="rc" placeholder="RC number" value={form.rc} />
                                <InputField icon={FiFileText} label="Insurance" type="text" name="insurance" placeholder="Insurance number" value={form.insurance} />
                            </div>
                        </div>

                        {/* Notice */}
                        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100">
                            <FiCheckCircle className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" size={16} />
                            <p className="text-xs text-green-700 dark:text-green-400 leading-relaxed">
                                This driver will be automatically marked as <strong>verified</strong> and <strong>approved by admin</strong>. They can start accepting rides immediately.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>Create & Verify Driver <FiCheckCircle size={14} /></>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default CreateDriver;
