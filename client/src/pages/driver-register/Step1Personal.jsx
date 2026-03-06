import { useState } from 'react';
import { FiUser, FiMail, FiPhone, FiCamera, FiArrowRight, FiX, FiMapPin } from 'react-icons/fi';

const Step1Personal = ({ formData, updateField, nextStep }) => {
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!formData.fullName.trim()) e.fullName = 'Full name is required';
        if (!formData.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
        if (!formData.phone.trim()) e.phone = 'Phone number is required';
        else if (formData.phone.length < 10) e.phone = 'Enter a valid phone number';
        if (!formData.taluk?.trim()) e.taluk = 'Taluk is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleContinue = () => {
        if (validate()) nextStep();
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, photo: 'File must be under 5MB' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => updateField('profilePhoto', reader.result);
        reader.readAsDataURL(file);
    };

    const isValid = formData.fullName.trim() && formData.email.trim() && formData.phone.trim() && formData.taluk?.trim();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
                <p className="text-sm text-gray-500 mt-1">Tell us about yourself to get started</p>
            </div>

            {/* Profile Photo */}
            <div className="flex flex-col items-center mb-8">
                <div className="relative group">
                    {formData.profilePhoto ? (
                        <div className="relative">
                            <img src={formData.profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-teal-100 shadow-md" />
                            <button
                                onClick={() => updateField('profilePhoto', '')}
                                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                                <FiX size={12} />
                            </button>
                        </div>
                    ) : (
                        <label className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all group">
                            <FiCamera size={20} className="text-gray-400 group-hover:text-teal-500" />
                            <span className="text-[10px] text-gray-400 mt-1 group-hover:text-teal-500">Upload</span>
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-2">Profile photo (optional)</p>
                {errors.photo && <p className="text-xs text-red-500 mt-1">{errors.photo}</p>}
            </div>

            <div className="space-y-5">
                {/* Full Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                    <div className="relative">
                        <FiUser className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => updateField('fullName', e.target.value)}
                            placeholder="Enter your full name"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none ${errors.fullName ? 'border-red-300' : 'border-gray-200'}`}
                        />
                    </div>
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                    <div className="relative">
                        <FiMail className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="name@example.com"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
                        />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
                    <div className="relative">
                        <FiPhone className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="Enter your phone number"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none ${errors.phone ? 'border-red-300' : 'border-gray-200'}`}
                        />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Taluk */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Taluk *</label>
                    <div className="relative">
                        <FiMapPin className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={formData.taluk}
                            onChange={(e) => updateField('taluk', e.target.value)}
                            placeholder="Enter your taluk Nearby (e.g., Coimbatore North)"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none ${errors.taluk ? 'border-red-300' : 'border-gray-200'}`}
                        />
                    </div>
                    {errors.taluk && <p className="text-xs text-red-500 mt-1">{errors.taluk}</p>}
                </div>
            </div>

            <button
                onClick={handleContinue}
                disabled={!isValid}
                className={`mt-8 w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isValid
                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                Continue <FiArrowRight size={14} />
            </button>
        </div>
    );
};

export default Step1Personal;
