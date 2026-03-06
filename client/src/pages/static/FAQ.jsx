import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiSearch } from 'react-icons/fi';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const categories = ['All', 'General', 'Riders', 'Drivers', 'Payments', 'Safety'];

    const faqs = [
        // General
        { q: 'What is Safro?', a: 'Safro is a negotiation-based ride-sharing platform where riders and drivers agree on a fare before the ride begins. No surge pricing, no hidden algorithms.', category: 'General' },
        { q: 'How is Safro different from Uber or Ola?', a: 'Unlike traditional ride-hailing apps, Safro lets you negotiate the fare. Riders propose a price, drivers counter-offer, and both agree before the ride starts. This eliminates surge pricing and gives both parties control.', category: 'General' },
        { q: 'Is Safro available in my city?', a: 'Safro is currently launched in Bengaluru with plans to expand to Chennai, Hyderabad, and other major cities in India. Stay tuned for updates!', category: 'General' },

        // Riders
        { q: 'How do I book a ride?', a: 'Open the Safro app, enter your pickup and drop location, propose a fare, and wait for drivers to respond. You can accept a driver\'s counter-offer or continue negotiating.', category: 'Riders' },
        { q: 'What if no driver accepts my price?', a: 'If no driver accepts, you can increase your offer or wait. The marketplace works best when fares are fair for both sides. You\'ll see the average fare for your route to help guide your offer.', category: 'Riders' },
        { q: 'Can I cancel a ride?', a: 'Yes. Rides can be cancelled before the driver arrives with no charge. After the driver arrives, a small cancellation fee may apply.', category: 'Riders' },
        { q: 'How do I track my ride?', a: 'Once your ride is confirmed, you can track your driver in real-time on the map. You can also share your ride details with emergency contacts.', category: 'Riders' },

        // Drivers
        { q: 'How do I become a Safro driver?', a: 'Register through the app, upload your documents (Driving License, Aadhaar, RC, Insurance), and our admin team will verify your application. Once approved, you can start accepting rides.', category: 'Drivers' },
        { q: 'How are drivers verified?', a: 'Every driver goes through manual verification by our admin team. We check your Driving License, Aadhaar, Vehicle RC, and Insurance documents before approval.', category: 'Drivers' },
        { q: 'How do I earn more on Safro?', a: 'You earn what you negotiate. There\'s no commission squeeze. Maintain high ratings, stay available during peak hours, and negotiate fair prices to maximize your earnings.', category: 'Drivers' },
        { q: 'Can I reject a ride request?', a: 'Yes, drivers can choose which rides to accept. However, consistently declining rides may affect your visibility to riders.', category: 'Drivers' },

        // Payments
        { q: 'What payment methods are supported?', a: 'Safro supports cash payments and digital payment methods. We\'re constantly adding new payment options.', category: 'Payments' },
        { q: 'When do drivers get paid?', a: 'For cash rides, drivers receive payment at the end of the ride. For digital payments, payouts are processed within 24–48 hours.', category: 'Payments' },
        { q: 'Are there any hidden fees?', a: 'No. Safro charges a small, transparent platform fee. There are no hidden charges, surge fees, or dynamic pricing algorithms.', category: 'Payments' },

        // Safety
        { q: 'How does Safro ensure rider safety?', a: 'All drivers are manually verified. We offer real-time ride tracking, SOS emergency buttons, ride sharing with contacts, and 24/7 support.', category: 'Safety' },
        { q: 'What is the SOS feature?', a: 'During any ride, you can tap the SOS button to immediately alert our admin team and share your live location. This is available for both riders and drivers.', category: 'Safety' },
        { q: 'Can I share my ride with someone?', a: 'Yes, you can share your live ride tracking link with emergency contacts so they can monitor your trip in real-time.', category: 'Safety' },
    ];

    const filtered = faqs.filter(faq => {
        const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
        const matchesSearch = !search || faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="bg-white min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
                            Frequently Asked <span className="text-teal-400">Questions</span>
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
                            Everything you need to know about Safro.
                        </p>

                        {/* Search */}
                        <div className="max-w-md mx-auto relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search questions..."
                                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-teal-400 transition-colors"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FAQ List */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap gap-2 mb-10 justify-center">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Questions */}
                    <div className="space-y-3">
                        {filtered.length === 0 && (
                            <p className="text-center text-gray-400 py-8">No questions match your search.</p>
                        )}
                        {filtered.map((faq, i) => (
                            <motion.div
                                key={`${faq.category}-${i}`}
                                custom={i}
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="border border-gray-200 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded uppercase">{faq.category}</span>
                                        <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                                    </div>
                                    <FiChevronDown className={`text-gray-400 transition-transform shrink-0 ml-3 ${openIndex === i ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {openIndex === i && (
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

            {/* Contact CTA */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Still have questions?</h2>
                    <p className="text-gray-500 mb-6">Our support team is here to help.</p>
                    <a href="mailto:safro.2026.safro@gmail.com" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-lg hover:bg-teal-600 transition-all">
                        Contact Support
                    </a>
                </div>
            </section>
        </div>
    );
};

export default FAQ;
