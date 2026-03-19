import { FiArrowLeft, FiSend, FiUser, FiFileText, FiCreditCard, FiTruck, FiShield, FiCheckCircle } from 'react-icons/fi';

const Section = ({ icon: Icon, title, children }) => (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
            <Icon size={16} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="space-y-1.5">{children}</div>
    </div>
);

const Row = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
);

const Step6Review = ({ formData, prevStep, onSubmit, submitting }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Review Your Application</h2>
                <p className="text-sm text-gray-500 mt-1">Please verify all your details before submitting</p>
            </div>

            {/* Branding message */}
            <div className="flex items-start gap-3 bg-teal-50 border border-teal-100 rounded-xl p-4 mb-6">
                <FiCheckCircle className="text-teal-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-teal-700">
                    Safro ensures all drivers are verified by our admin team to maintain trust and safety.
                </p>
            </div>

            <div className="space-y-4">
                {/* Personal */}
                <Section icon={FiUser} title="Personal Details">
                    <Row label="Full Name" value={formData.fullName} />
                    <Row label="Email" value={formData.email} />
                    <Row label="Phone" value={formData.phone} />
                    <Row label="District" value={formData.district} />
                    <Row label="Taluk" value={formData.taluk} />
                    {formData.profilePhoto && (
                        <div className="pt-2">
                            <img src={formData.profilePhoto} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-teal-100" />
                        </div>
                    )}
                </Section>

                {/* License */}
                <Section icon={FiFileText} title="License Details">
                    <Row label="License Number" value={formData.licenseNumber} />
                    <Row label="Date of Birth" value={formData.dateOfBirth} />
                    <Row label="License Expiry" value={formData.licenseExpiry} />
                    {formData.licenseImage && (
                        <div className="pt-2">
                            <img src={formData.licenseImage} alt="License" className="w-full h-28 object-contain bg-white rounded-lg border border-gray-200" />
                        </div>
                    )}
                </Section>

                {/* Aadhaar */}
                <Section icon={FiCreditCard} title="Aadhaar">
                    <Row label="Aadhaar Number" value={formData.aadhaarNumber ? `XXXX XXXX ${formData.aadhaarNumber.slice(-4)}` : '—'} />
                    {formData.aadhaarImage && (
                        <div className="pt-2">
                            <img src={formData.aadhaarImage} alt="Aadhaar" className="w-full h-28 object-contain bg-white rounded-lg border border-gray-200" />
                        </div>
                    )}
                </Section>

                {/* Vehicle */}
                <Section icon={FiTruck} title="Vehicle Details">
                    <Row label="Type" value={formData.vehicleType ? formData.vehicleType.charAt(0).toUpperCase() + formData.vehicleType.slice(1) : '—'} />
                    <Row label="Model" value={formData.vehicleModel} />
                    <Row label="Number" value={formData.vehicleNumber} />
                    <Row label="Color" value={formData.vehicleColor} />
                    <Row label="Year" value={formData.manufacturingYear} />
                </Section>

                {/* Insurance & RC */}
                <Section icon={FiShield} title="Insurance & RC">
                    <Row label="Insurance Policy" value={formData.insurancePolicyNumber} />
                    <Row label="Insurance Expiry" value={formData.insuranceExpiry} />
                    <Row label="RC Number" value={formData.rcNumber} />
                </Section>
            </div>

            <div className="flex gap-3 mt-8">
                <button
                    onClick={prevStep}
                    disabled={submitting}
                    className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-2 transition-all"
                >
                    <FiArrowLeft size={14} /> Back
                </button>
                <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="flex-[2] py-3.5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Submit for Verification <FiSend size={14} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default Step6Review;
