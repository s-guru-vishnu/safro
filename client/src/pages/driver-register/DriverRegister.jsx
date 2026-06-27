import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Step1Personal from './Step1Personal';
import Step2License from './Step2License';
import Step3Aadhaar from './Step3Aadhaar';
import Step4Vehicle from './Step4Vehicle';
import Step5Insurance from './Step5Insurance';
import Step6Review from './Step6Review';
import { FiUser, FiFileText, FiCreditCard, FiTruck, FiShield, FiCheckCircle } from 'react-icons/fi';

const steps = [
    { label: 'Personal', icon: FiUser },
    { label: 'License', icon: FiFileText },
    { label: 'Aadhaar', icon: FiCreditCard },
    { label: 'Vehicle', icon: FiTruck },
    { label: 'Insurance', icon: FiShield },
    { label: 'Review', icon: FiCheckCircle },
];

const DriverRegister = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [formData, setFormData] = useState({
        // Step 1
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        profilePhoto: '',
        // Step 2
        licenseNumber: '',
        dateOfBirth: '',
        licenseExpiry: '',
        licenseImage: '',
        // Step 3
        aadhaarNumber: '',
        aadhaarImage: '',
        // Step 4
        vehicleType: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleColor: '',
        manufacturingYear: '',
        // Step 5
        insurancePolicyNumber: '',
        insuranceExpiry: '',
        insuranceDocument: '',
        rcNumber: '',
        rcDocument: '',
        district: '',
        taluk: '',
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.post('/auth/apply-driver', {
                profilePhoto: formData.profilePhoto,
                licenseNumber: formData.licenseNumber,
                dateOfBirth: formData.dateOfBirth,
                licenseExpiry: formData.licenseExpiry,
                licenseImage: formData.licenseImage,
                aadhaarNumber: formData.aadhaarNumber,
                aadhaarImage: formData.aadhaarImage,
                vehicleType: formData.vehicleType,
                vehicleModel: formData.vehicleModel,
                vehicleNumber: formData.vehicleNumber,
                vehicleColor: formData.vehicleColor,
                manufacturingYear: formData.manufacturingYear ? parseInt(formData.manufacturingYear) : null,
                insurancePolicyNumber: formData.insurancePolicyNumber,
                insuranceExpiry: formData.insuranceExpiry,
                insuranceDocument: formData.insuranceDocument,
                rcNumber: formData.rcNumber,
                rcDocument: formData.rcDocument,
                district: formData.district,
                taluk: formData.taluk,
            });
            toast.success('Application submitted!');
            navigate('/driver/submitted');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep = () => {
        const props = { formData, updateField, nextStep, prevStep };
        switch (currentStep) {
            case 0: return <Step1Personal {...props} />;
            case 1: return <Step2License {...props} />;
            case 2: return <Step3Aadhaar {...props} />;
            case 3: return <Step4Vehicle {...props} />;
            case 4: return <Step5Insurance {...props} />;
            case 5: return <Step6Review {...props} formData={formData} onSubmit={handleSubmit} submitting={submitting} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* Progress Bar */}
            <div className="max-w-xl mx-auto px-4 pt-8 pb-4">
                <div className="flex items-start justify-between mb-2">
                    {steps.map((step, i) => {
                        const Icon = step.icon;
                        const isComplete = i < currentStep;
                        const isCurrent = i === currentStep;
                        return (
                            <div key={i} className="flex flex-col items-center relative" style={{ flex: '1' }}>
                                {/* Connector line */}
                                {i > 0 && (
                                    <div className="absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2">
                                        <motion.div
                                            className="h-full rounded-full"
                                            initial={{ backgroundColor: '#e5e7eb' }}
                                            animate={{ backgroundColor: isComplete || isCurrent ? '#14b8a6' : '#e5e7eb' }}
                                            transition={{ duration: 0.4 }}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                )}
                                {/* Icon circle */}
                                <motion.div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${isComplete ? 'bg-teal-50 dark:bg-teal-900/20 text-white shadow-md' :
                                        isCurrent ? 'bg-gray-900 text-white shadow-lg ring-4 ring-teal-100' :
                                            'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                        }`}
                                    whileHover={{ scale: 1.1 }}
                                >
                                    {isComplete ? <FiCheckCircle size={16} /> : <Icon size={16} />}
                                </motion.div>
                                {/* Label */}
                                <span className={`text-xs mt-2 font-medium hidden sm:block text-center ${isCurrent ? 'text-gray-900 dark:text-white' : isComplete ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Step counter (mobile) */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 sm:hidden mt-3">
                    Step {currentStep + 1} of {steps.length} — <span className="font-semibold text-gray-700 dark:text-gray-300">{steps[currentStep].label}</span>
                </p>
            </div>

            {/* Step Content */}
            <div className="max-w-2xl mx-auto px-4 pb-16">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.3 }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DriverRegister;
