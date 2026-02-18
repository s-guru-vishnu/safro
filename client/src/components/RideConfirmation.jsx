import { FiUser, FiTruck, FiCheckCircle, FiPhone, FiStar, FiMapPin } from 'react-icons/fi';

const RideConfirmation = ({ ride }) => {
    return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Status Header */}
            <div className="bg-green-600 p-6 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <FiCheckCircle size={32} />
                </div>
                <h2 className="text-2xl font-bold mb-1">Ride Confirmed!</h2>
                <p className="text-green-100">Driver is on the way to pickup</p>
            </div>

            <div className="p-6 space-y-8">
                {/* OTP Section */}
                <div className="text-center">
                    <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-2">Share OTP with Driver</p>
                    <div className="inline-block bg-gray-100 px-8 py-3 rounded-lg border-2 border-dashed border-gray-300">
                        <span className="text-4xl font-mono font-bold text-gray-800 tracking-[0.5em]">{ride.otp}</span>
                    </div>
                </div>

                {/* Fare & Vehicle Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Final Fare</p>
                        <p className="text-2xl font-bold text-gray-900">₹{ride.fare.final}</p>
                        <p className="text-xs text-green-600 font-medium">Locked Price</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                        <div className="flex items-center gap-2">
                            <FiTruck className="text-gray-400" />
                            <p className="font-bold text-gray-900">{ride.driverId?.vehicle?.model || 'Sedan'}</p>
                        </div>
                        <p className="text-xs text-gray-600">{ride.driverId?.vehicle?.number || 'TN 01 AB 1234'}</p>
                    </div>
                </div>

                {/* Driver Details */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <FiUser className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{ride.driverId?.name || 'Driver'}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <FiStar className="text-yellow-400 fill-current" />
                            <span>{ride.driverId?.rating || '4.8'}</span>
                            <span>•</span>
                            <span className="text-gray-400">500+ rides</span>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center hover:bg-teal-200 transition-colors">
                        <FiPhone />
                    </button>
                </div>

                {/* Location Summary */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">PICKUP</p>
                            <p className="text-sm font-semibold text-gray-700">{ride.pickupLocation?.address}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">DROP</p>
                            <p className="text-sm font-semibold text-gray-700">{ride.dropLocation?.address}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RideConfirmation;
