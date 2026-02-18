import { useState } from 'react';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';

const vehicleTypes = [
    { value: 'car', label: 'Car', emoji: '🚗', desc: 'Sedan, SUV, Hatchback' },
    { value: 'bike', label: 'Bike', emoji: '🏍️', desc: 'Two-wheeler' },
    { value: 'auto', label: 'Auto', emoji: '🛺', desc: 'Three-wheeler' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 25 }, (_, i) => currentYear - i);

const Step4Vehicle = ({ formData, updateField, nextStep, prevStep }) => {
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!formData.vehicleType) e.vehicleType = 'Select a vehicle type';
        if (!formData.vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleContinue = () => {
        if (validate()) nextStep();
    };

    const isValid = formData.vehicleType && formData.vehicleNumber.trim();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Vehicle Details</h2>
                <p className="text-sm text-gray-500 mt-1">Tell us about your vehicle</p>
            </div>

            <div className="space-y-5">
                {/* Vehicle Type – Card Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type *</label>
                    <div className="grid grid-cols-3 gap-3">
                        {vehicleTypes.map((type) => (
                            <motion.button
                                key={type.value}
                                onClick={() => updateField('vehicleType', type.value)}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className={`relative p-4 rounded-xl border-2 text-center transition-all ${formData.vehicleType === type.value
                                        ? 'border-teal-500 bg-teal-50 shadow-md'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-3xl block mb-1">{type.emoji}</span>
                                <span className={`text-sm font-semibold block ${formData.vehicleType === type.value ? 'text-teal-700' : 'text-gray-700'}`}>
                                    {type.label}
                                </span>
                                <span className="text-[10px] text-gray-400 block mt-0.5">{type.desc}</span>
                                {formData.vehicleType === type.value && (
                                    <motion.div
                                        layoutId="vehicleCheck"
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs shadow-sm"
                                    >
                                        ✓
                                    </motion.div>
                                )}
                            </motion.button>
                        ))}
                    </div>
                    {errors.vehicleType && <p className="text-xs text-red-500 mt-1">{errors.vehicleType}</p>}
                </div>

                {/* Vehicle Model */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Model</label>
                    <input
                        type="text"
                        value={formData.vehicleModel}
                        onChange={(e) => updateField('vehicleModel', e.target.value)}
                        placeholder="e.g. Honda Activa, Maruti Swift"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none"
                    />
                </div>

                {/* Vehicle Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Number *</label>
                    <input
                        type="text"
                        value={formData.vehicleNumber}
                        onChange={(e) => updateField('vehicleNumber', e.target.value.toUpperCase())}
                        placeholder="e.g. TN 01 AB 1234"
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none ${errors.vehicleNumber ? 'border-red-300' : 'border-gray-200'}`}
                    />
                    {errors.vehicleNumber && <p className="text-xs text-red-500 mt-1">{errors.vehicleNumber}</p>}
                </div>

                {/* Color & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Color</label>
                        <input
                            type="text"
                            value={formData.vehicleColor}
                            onChange={(e) => updateField('vehicleColor', e.target.value)}
                            placeholder="e.g. White, Black"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacturing Year</label>
                        <select
                            value={formData.manufacturingYear}
                            onChange={(e) => updateField('manufacturingYear', e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 text-sm transition-all outline-none appearance-none"
                        >
                            <option value="">Select year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mt-8">
                <button
                    onClick={prevStep}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2 transition-all"
                >
                    <FiArrowLeft size={14} /> Back
                </button>
                <button
                    onClick={handleContinue}
                    disabled={!isValid}
                    className={`flex-[2] py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isValid
                            ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md active:scale-[0.98]'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Continue <FiArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default Step4Vehicle;
