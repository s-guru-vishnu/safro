import { useState } from 'react';
import { FiArrowRight, FiArrowLeft, FiUpload, FiX, FiCalendar, FiHash, FiAlertCircle } from 'react-icons/fi';

const Step5Insurance = ({ formData, updateField, nextStep, prevStep }) => {
    const [errors, setErrors] = useState({});

    const handleContinue = () => nextStep();

    const handleFileUpload = (field) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, [field]: 'File must be under 5MB' }));
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => updateField(field, reader.result);
        reader.readAsDataURL(file);
    };

    const FileUpload = ({ field, label }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
            {formData[field] ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950">
                    <img src={formData[field]} alt={label} className="w-full h-36 object-contain bg-white dark:bg-gray-900" />
                    <button
                        onClick={() => updateField(field, '')}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-50 dark:bg-red-900/20 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                    >
                        <FiX size={14} />
                    </button>
                </div>
            ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-teal-400 hover:bg-teal-50 dark:bg-teal-900/20 transition-all">
                    <FiUpload size={20} className="text-gray-400 dark:text-gray-500 mb-1.5" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Upload document</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">PNG, JPG, PDF up to 5MB</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload(field)} className="hidden" />
                </label>
            )}
            {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Insurance & RC Details</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload your insurance and registration certificate</p>
            </div>

            {/* Admin verification notice */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                <FiAlertCircle className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <div>
                    <p className="text-sm font-medium text-amber-800">Verified by Admin before activation</p>
                    <p className="text-xs text-amber-600 mt-0.5">All documents are reviewed by our admin team. You'll be notified once verification is complete.</p>
                </div>
            </div>

            <div className="space-y-5">
                {/* Insurance Section */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Insurance</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Policy Number</label>
                                <div className="relative">
                                    <FiHash className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                                    <input
                                        type="text"
                                        value={formData.insurancePolicyNumber}
                                        onChange={(e) => updateField('insurancePolicyNumber', e.target.value)}
                                        placeholder="Policy number"
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date</label>
                                <div className="relative">
                                    <FiCalendar className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                                    <input
                                        type="date"
                                        value={formData.insuranceExpiry}
                                        onChange={(e) => updateField('insuranceExpiry', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 dark:text-white text-sm transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                        <FileUpload field="insuranceDocument" label="Upload Insurance Document" />
                    </div>
                </div>

                {/* RC Section */}
                <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Registration Certificate (RC)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">RC Number</label>
                            <div className="relative">
                                <FiHash className="absolute left-3.5 top-3.5 text-gray-400 dark:text-gray-500" size={16} />
                                <input
                                    type="text"
                                    value={formData.rcNumber}
                                    onChange={(e) => updateField('rcNumber', e.target.value.toUpperCase())}
                                    placeholder="RC number"
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm transition-all outline-none"
                                />
                            </div>
                        </div>
                        <FileUpload field="rcDocument" label="Upload RC Document" />
                    </div>
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
                    className="flex-[2] py-3.5 rounded-xl font-semibold text-sm bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    Continue <FiArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default Step5Insurance;
