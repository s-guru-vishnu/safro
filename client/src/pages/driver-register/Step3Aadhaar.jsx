import { useState } from 'react';
import { FiArrowRight, FiArrowLeft, FiUpload, FiX, FiShield, FiHash } from 'react-icons/fi';

const Step3Aadhaar = ({ formData, updateField, nextStep, prevStep }) => {
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!formData.aadhaarNumber.trim()) e.aadhaarNumber = 'Aadhaar number is required';
        else if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) e.aadhaarNumber = 'Enter a valid 12-digit Aadhaar number';
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
            setErrors(prev => ({ ...prev, aadhaarImage: 'File must be under 5MB' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => updateField('aadhaarImage', reader.result);
        reader.readAsDataURL(file);
    };

    const formatAadhaar = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 12);
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    const isValid = formData.aadhaarNumber.replace(/\s/g, '').length === 12;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload your Aadhaar Card</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Aadhaar verification is required for safety and compliance. Your data is securely stored and used only for identity verification.
                </p>
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
                <FiShield className="text-teal-600 shrink-0 mt-0.5" size={18} />
                <div>
                    <p className="text-sm font-medium text-teal-800">Your privacy is important</p>
                    <p className="text-xs text-teal-600 mt-0.5">Your Aadhaar details are encrypted and only accessible to verified admins during the review process.</p>
                </div>
            </div>

            <div className="space-y-5">
                {/* Aadhaar Number */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Aadhaar Number *</label>
                    <div className="relative">
                        <FiHash className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={formatAadhaar(formData.aadhaarNumber)}
                            onChange={(e) => updateField('aadhaarNumber', e.target.value.replace(/\s/g, ''))}
                            placeholder="XXXX XXXX XXXX"
                            maxLength={14}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm tracking-wider transition-all outline-none ${errors.aadhaarNumber ? 'border-red-300' : 'border-gray-200'}`}
                        />
                    </div>
                    {errors.aadhaarNumber && <p className="text-xs text-red-500 mt-1">{errors.aadhaarNumber}</p>}
                </div>

                {/* Aadhaar Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Aadhaar Image</label>
                    {formData.aadhaarImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                            <img src={formData.aadhaarImage} alt="Aadhaar" className="w-full h-48 object-contain bg-white" />
                            <button
                                onClick={() => updateField('aadhaarImage', '')}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                            >
                                <FiX size={14} />
                            </button>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all">
                            <FiUpload size={24} className="text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">Click to upload Aadhaar</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                    )}
                    {errors.aadhaarImage && <p className="text-xs text-red-500 mt-1">{errors.aadhaarImage}</p>}
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

export default Step3Aadhaar;
