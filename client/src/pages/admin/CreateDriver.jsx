import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiTruck, FiFileText, FiShield, FiArrowLeft, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const CreateDriver = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        vehicleType: 'sedan', vehicleNumber: '', licenseNumber: '',
        aadhaar: '', rc: '', insurance: '', taluk: ''
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
            <div className="relative">
                <Icon className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                <input
                    {...props}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 transition-all outline-none"
                />
            </div>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto px-4 sm:px-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6">
                    <FiArrowLeft size={14} /> Back
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center">
                            <FiTruck size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Create New Driver</h2>
                            <p className="text-xs text-gray-500">Driver will be auto-verified and approved</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Personal Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Personal Information</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <InputField icon={FiUser} label="Full Name" type="text" name="name" placeholder="Driver name" value={form.name} required />
                                <InputField icon={FiMail} label="Email" type="email" name="email" placeholder="driver@email.com" value={form.email} required />
                                <InputField icon={FiLock} label="Password" type="password" name="password" placeholder="Min 6 characters" value={form.password} required />
                                <InputField icon={FiPhone} label="Phone" type="tel" name="phone" placeholder="Phone number" value={form.phone} required />
                            </div>
                        </div>

                        {/* Vehicle Info */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehicle Details</h4>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                                    <select
                                        name="vehicleType"
                                        value={form.vehicleType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 transition-all outline-none"
                                    >
                                        <option value="bike">Bike</option>
                                        <option value="auto">Auto</option>
                                        <option value="sedan">Sedan</option>
                                        <option value="suv">SUV</option>
                                    </select>
                                </div>
                                <InputField icon={FiTruck} label="Vehicle Number" type="text" name="vehicleNumber" placeholder="e.g. KA-01-AB-1234" value={form.vehicleNumber} required />
                                <InputField icon={FiFileText} label="License Number" type="text" name="licenseNumber" placeholder="License number" value={form.licenseNumber} required />
                                <InputField icon={FiMapPin} label="Taluk" type="text" name="taluk" placeholder="Enter taluk" value={form.taluk} required />
                            </div>
                        </div>

                        {/* Documents */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Documents</h4>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <InputField icon={FiShield} label="Aadhaar" type="text" name="aadhaar" placeholder="Aadhaar number" value={form.aadhaar} />
                                <InputField icon={FiFileText} label="RC Number" type="text" name="rc" placeholder="RC number" value={form.rc} />
                                <InputField icon={FiFileText} label="Insurance" type="text" name="insurance" placeholder="Insurance number" value={form.insurance} />
                            </div>
                        </div>

                        {/* Notice */}
                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                            <FiCheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={16} />
                            <p className="text-xs text-green-700 leading-relaxed">
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
