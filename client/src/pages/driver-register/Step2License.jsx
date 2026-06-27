import { useState } from 'react';
import { FiArrowRight, FiArrowLeft, FiUpload, FiX, FiCalendar, FiHash } from 'react-icons/fi';

const Step2License = ({ formData, updateField, nextStep, prevStep }) => {
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!formData.licenseNumber.trim()) e.licenseNumber = 'License number is required';
        if (!formData.dateOfBirth) e.dateOfBirth = 'Date of birth is required';
        if (!formData.licenseExpiry) e.licenseExpiry = 'License expiry date is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleContinue = () => {
        if (validate()) nextStep();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, licenseImage: 'File must be under 5MB' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => updateField('licenseImage', reader.result);
        reader.readAsDataURL(file);
    };

    const isValid = formData.licenseNumber.trim() && formData.dateOfBirth && formData.licenseExpiry;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Driving License Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Provide your license information for verification</p>
            </div>

            <div className="space-y-5">
                {/* License Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">License Number *</label>
                    <div className="relative">
                        <FiHash className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                        <input
                            type="text"
                            value={formData.licenseNumber}
                            onChange={(e) => updateField('licenseNumber', e.target.value.toUpperCase())}
                            placeholder="e.g. TN0120200012345"
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition-all outline-none ${errors.licenseNumber ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}
                        />
                    </div>
                    {errors.licenseNumber && <p className="text-xs text-red-500 mt-1">{errors.licenseNumber}</p>}
                </div>

                {/* Date of Birth & Expiry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date of Birth *</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 dark:text-white text-sm transition-all outline-none ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}
                            />
                        </div>
                        {errors.dateOfBirth && <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">License Expiry *</label>
                        <div className="relative">
                            <FiCalendar className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                            <input
                                type="date"
                                value={formData.licenseExpiry}
                                onChange={(e) => updateField('licenseExpiry', e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 dark:text-white text-sm transition-all outline-none ${errors.licenseExpiry ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'}`}
                            />
                        </div>
                        {errors.licenseExpiry && <p className="text-xs text-red-500 mt-1">{errors.licenseExpiry}</p>}
                    </div>
                </div>

                {/* License Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Upload License Image</label>
                    {formData.licenseImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950">
                            <img src={formData.licenseImage} alt="License" className="w-full h-48 object-contain bg-white dark:bg-gray-900" />
                            <button
                                onClick={() => updateField('licenseImage', '')}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-50 dark:bg-red-900/20 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                            >
                                <FiX size={14} />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 dark:bg-teal-900/20 transition-all">
                            <FiUpload size={24} className="text-gray-400 dark:text-gray-500 mb-2" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">Click to upload license</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    )}
                    {errors.licenseImage && <p className="text-xs text-red-500 mt-1">{errors.licenseImage}</p>}
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button
                    onClick={prevStep}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 flex items-center justify-center gap-2 transition-all"
                >
                    <FiArrowLeft size={14} /> Back
                </button>
                <button
                    onClick={handleContinue}
                    disabled={!isValid}
                    className={`flex-[2] py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isValid
                            ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md active:scale-[0.98]'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    Continue <FiArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default Step2License;
