import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTarget, FiHeart, FiUsers, FiShield, FiArrowRight } from 'react-icons/fi';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const About = () => {
    const values = [
        { icon: <FiTarget />, title: 'Fair Pricing', desc: 'We believe riders and drivers should agree on a fair price — no algorithms, no surge.' },
        { icon: <FiShield />, title: 'Safety First', desc: 'Every driver is manually verified by our admin team. Your safety is non-negotiable.' },
        { icon: <FiHeart />, title: 'Community Driven', desc: 'Safro is built for the people. We listen, iterate, and grow with our community.' },
        { icon: <FiUsers />, title: 'Transparency', desc: 'No hidden fees. No mysterious algorithms. What you see is what you pay.' },
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <span className="inline-block px-4 py-1.5 bg-teal-500/10 text-teal-400 text-xs font-semibold rounded-full mb-6 tracking-wide uppercase border border-teal-500/20">
                            Our Story
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6 leading-tight">
                            About <span className="text-teal-400">Safro</span>
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Safro is India's first negotiation-based ride marketplace. We're building a platform where riders and drivers connect on fair terms — no surge pricing, no hidden algorithms.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
                            <p className="text-gray-500 leading-relaxed mb-4">
                                We started Safro with a simple question: <strong className="text-gray-900">why can't riders and drivers decide the price together?</strong>
                            </p>
                            <p className="text-gray-500 leading-relaxed mb-4">
                                Traditional ride-hailing apps use opaque algorithms that inflate prices during peak hours. Drivers get squeezed on commissions while riders pay more than they should.
                            </p>
                            <p className="text-gray-500 leading-relaxed">
                                Safro changes that. Our marketplace model lets both parties negotiate transparently, creating a fairer deal for everyone.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gray-50 rounded-2xl p-8 border border-gray-200"
                        >
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-teal-600">0%</p>
                                    <p className="text-xs text-gray-500 mt-1">Surge Pricing</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-teal-600">100%</p>
                                    <p className="text-xs text-gray-500 mt-1">Verified Drivers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-teal-600">₹45</p>
                                    <p className="text-xs text-gray-500 mt-1">Avg. Savings/Ride</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-extrabold text-teal-600">24/7</p>
                                    <p className="text-xs text-gray-500 mt-1">Support</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Values */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</motion.h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                        {values.map((v, i) => (
                            <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center text-lg mb-4">{v.icon}</div>
                                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gray-900">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Join the Movement</h2>
                    <p className="text-gray-400 mb-8">Be part of a fairer ride-sharing ecosystem.</p>
                    <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all">
                        Get Started <FiArrowRight />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default About;
