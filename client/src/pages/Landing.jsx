import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiArrowRight, FiDollarSign, FiUsers, FiShield, FiCheckCircle, FiMessageCircle, FiZap,
    FiStar, FiMapPin, FiClock, FiChevronDown
} from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
    }),
};

const Landing = () => {
    const { user } = useAuth();
    const [openFaq, setOpenFaq] = useState(null);

    const features = [
        {
            icon: <FiDollarSign />,
            title: 'Negotiate Your Price',
            desc: 'Set your own fare. Drivers counter-offer. Agree on a fair price before you ride.',
        },
        {
            icon: <FiShield />,
            title: 'Admin-Verified Drivers',
            desc: 'Every driver is manually verified by our admin team. No unverified drivers on the platform.',
        },
        {
            icon: <FiMessageCircle />,
            title: 'Real-Time Offers',
            desc: 'Live chat-style negotiation with instant offer updates and countdown timers.',
        },
        {
            icon: <FiZap />,
            title: 'No Surge Pricing',
            desc: 'The price is between you and the driver. No algorithms inflating your fare.',
        },
        {
            icon: <FiUsers />,
            title: 'Marketplace Model',
            desc: 'Multiple drivers can see your request and compete to offer the best price.',
        },
        {
            icon: <FiStar />,
            title: 'Transparent Ratings',
            desc: 'Rate every ride. Build trust through honest reviews and verified profiles.',
        },
    ];

    const steps = [
        { num: '01', title: 'Enter Your Route', desc: 'Set your pickup and drop location, then propose your fare.', icon: <FiMapPin /> },
        { num: '02', title: 'Negotiate with Drivers', desc: 'Drivers see your offer and counter. Chat until you agree on a price.', icon: <FiMessageCircle /> },
        { num: '03', title: 'Ride at Your Price', desc: 'Once agreed, your ride is confirmed. Track your driver in real-time.', icon: <FiCheckCircle /> },
    ];

    const faqs = [
        { q: 'How is Safro different from Uber?', a: 'Safro lets you negotiate fares directly with drivers. No algorithms, no surge pricing — just a fair deal between rider and driver.' },
        { q: 'How are drivers verified?', a: 'All drivers are manually onboarded and verified by our admin team. License, Aadhaar, RC, and insurance are checked before approval.' },
        { q: 'What if no driver accepts my offer?', a: 'You can adjust your proposed fare upward, or wait for more drivers to see your request. The marketplace works best at fair prices.' },
        { q: 'Is my payment secure?', a: 'Payments are processed securely. You can pay via cash or digital methods after the ride is completed.' },
    ];

    return (
        <div className="bg-white">
            {/* ===== HERO ===== */}
            <section className="relative overflow-hidden bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left */}
                        <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                            <span className="inline-block px-4 py-1.5 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full mb-6 tracking-wide uppercase">
                                Negotiation-Based Rides
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
                                Safro is a<br />
                                <span className="text-teal-600">Negotiation-Based</span><br />
                                Ride Marketplace.
                            </h1>
                            <p className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed">
                                Drivers and riders agree on a fair price before travel. No algorithms. No surge pricing. Just a marketplace where the price is yours to decide.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    to={'/'}
                                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-sm hover:shadow-md"
                                >
                                    {user && (user.role === 'driver' || user.role === 'admin') ? 'Go to Dashboard' : 'Start Negotiation'} <FiArrowRight />
                                </Link>
                                <a href="#how-it-works" className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-all">
                                    How It Works
                                </a>
                            </div>
                        </motion.div>

                        {/* Right — Illustration Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="hidden lg:block"
                        >
                            <div className="relative bg-gray-50 rounded-2xl p-8 border border-gray-100">
                                {/* Negotiation Demo */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-3 h-3 rounded-full bg-red-400" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                        <div className="w-3 h-3 rounded-full bg-green-400" />

                                    </div>

                                    <div className="flex justify-end">
                                        <div className="bg-teal-600 text-white px-4 py-2.5 rounded-xl rounded-br-sm text-sm font-medium max-w-[200px]">
                                            I'll ride for <span className="font-bold">₹250</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <div className="bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl rounded-bl-sm text-sm font-medium max-w-[200px]">
                                            How about <span className="font-bold">₹300</span>?
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <div className="bg-teal-600 text-white px-4 py-2.5 rounded-xl rounded-br-sm text-sm font-medium max-w-[200px]">
                                            Let's do <span className="font-bold">₹280</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-start">
                                        <motion.div
                                            animate={{ scale: [1, 1.02, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="bg-green-100 text-green-700 border border-green-300 px-4 py-2.5 rounded-xl rounded-bl-sm text-sm font-bold max-w-[200px]"
                                        >
                                            ✓ Deal! ₹280 accepted
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Floating badge */}
                                <motion.div
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                    className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-md"
                                >
                                    <span className="text-xs text-gray-500">Avg. savings</span>
                                    <p className="text-lg font-bold text-teal-600">₹45/ride</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Subtle bg accent */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-teal-50/50 to-transparent -z-10" />
            </section>

            {/* ===== FEATURES ===== */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Why Safro?</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">A fairer, more transparent way to get where you're going.</p>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md hover:border-teal-200 transition-all group"
                            >
                                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center text-lg mb-4 group-hover:bg-teal-100 transition-colors">
                                    {f.icon}
                                </div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== HOW IT WORKS ===== */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                        <p className="text-gray-500 max-w-xl mx-auto">Three simple steps to ride at your price.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {steps.map((s, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="text-center"
                            >
                                <div className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center text-xl mx-auto mb-5 shadow-sm">
                                    {s.icon}
                                </div>
                                <span className="text-xs font-bold text-teal-600 tracking-wider uppercase">Step {s.num}</span>
                                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-3">{s.title}</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== SAFETY ===== */}
            <section id="safety" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Your Safety, Our Priority</h2>
                            <div className="space-y-5">
                                {[
                                    { title: 'Admin-Verified Drivers', desc: 'Every driver goes through manual verification. License, Aadhaar, RC, and insurance are cross-checked.' },
                                    { title: 'Live Ride Tracking', desc: 'Track your ride in real-time. Share your trip with guardians for extra safety.' },
                                    { title: 'SOS Emergency Button', desc: 'One-tap emergency button connects you to help instantly during any ride.' },
                                    { title: 'Ride History & Receipts', desc: 'Full transparency with detailed ride history, fare breakdowns, and digital receipts.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1">
                                            <FiCheckCircle className="text-teal-600" size={18} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 mb-1">{item.title}</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                    <FiCheckCircle className="text-green-600" />
                                    <span className="text-sm font-medium text-green-700">License Verified by Admin</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                    <FiCheckCircle className="text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Aadhaar Verified</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                    <FiCheckCircle className="text-green-600" />
                                    <span className="text-sm font-medium text-green-700">RC Verified</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                    <FiCheckCircle className="text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Insurance Verified</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-4 text-center">Driver verification panel</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ===== FAQ ===== */}
            <section id="faq" className="py-20 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                    </motion.div>

                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true }}
                                variants={fadeUp}
                                className="border border-gray-200 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                                    <FiChevronDown className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="py-20 bg-gray-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to ride at your price?</h2>
                        <p className="text-gray-400 mb-8 max-w-lg mx-auto">Join thousands of riders who negotiate their fare every day on Safro.</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {!user ? (
                                <>
                                    <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-sm">
                                        Get Started <FiArrowRight />
                                    </Link>
                                    <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-600 text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
                                        Sign In
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    to={user.role === 'driver' ? '/driver/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/rider/home'}
                                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-all shadow-sm"
                                >
                                    Go to Dashboard <FiArrowRight />
                                </Link>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-white border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/Logo.png" alt="Safro" className="w-8 h-8 object-contain" />
                                <span className="font-bold text-gray-900">Safro</span>
                            </div>
                            <p className="text-sm text-gray-500 leading-relaxed">Where the Price is Yours to Decide.</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/rider/home" className="hover:text-gray-900 transition-colors">Book Ride</Link></li>
                                <li><a href="#how-it-works" className="hover:text-gray-900 transition-colors">How It Works</a></li>
                                <li><a href="#safety" className="hover:text-gray-900 transition-colors">Safety</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/about" className="hover:text-gray-900 transition-colors">About</Link></li>
                                <li><Link to="/careers" className="hover:text-gray-900 transition-colors">Careers</Link></li>
                                <li><Link to="/blog" className="hover:text-gray-900 transition-colors">Blog</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link></li>
                                <li><Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link></li>
                                <li><Link to="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 mt-10 pt-6 text-center">
                        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Safro. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
