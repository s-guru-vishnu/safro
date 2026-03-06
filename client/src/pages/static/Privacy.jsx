import { motion } from 'framer-motion';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Privacy = () => {
    const sections = [
        {
            title: '1. Information We Collect',
            content: `When you use Safro, we collect information you provide directly, such as your name, phone number, email address, and location data. We also collect device information, IP address, and usage data to improve our services.

For drivers, we additionally collect identity documents (Aadhaar, Driving License, RC, Insurance) for verification purposes.`,
        },
        {
            title: '2. How We Use Your Information',
            content: `We use your information to:
• Provide and improve our ride-matching and negotiation services
• Verify driver identities and ensure platform safety
• Process payments and send receipts
• Communicate important updates and promotional offers
• Provide real-time ride tracking and navigation
• Respond to support requests and ensure platform security`,
        },
        {
            title: '3. Location Data',
            content: `Safro collects precise location data from drivers and riders during active sessions. For drivers, location is collected while they are online to show availability on the map. For riders, location is collected during ride booking and tracking.

You can disable location services through your device settings, but this will impact the core functionality of the app.`,
        },
        {
            title: '4. Data Sharing',
            content: `We do not sell your personal data. We share information only in these cases:
• Between riders and drivers during an active ride (name, phone, location)
• With payment processors to complete transactions
• With law enforcement when required by law
• With our verification partners for driver identity checks
• In aggregated, anonymized form for analytics`,
        },
        {
            title: '5. Data Security',
            content: `We implement industry-standard security measures including encrypted data transmission (TLS/SSL), secure database storage, JWT-based authentication, and regular security audits. However, no system is completely secure, and we cannot guarantee absolute security.`,
        },
        {
            title: '6. Data Retention',
            content: `We retain your account data as long as your account is active. Ride history and transaction records are retained for 5 years for legal and accounting purposes. You can request deletion of your account and personal data by contacting our support team.`,
        },
        {
            title: '7. Your Rights',
            content: `You have the right to:
• Access your personal data
• Correct inaccurate data
• Delete your account and associated data
• Opt out of promotional communications
• Download a copy of your data`,
        },
        {
            title: '8. Contact Us',
            content: `For privacy-related questions or requests, contact us at safro.2026.safro@gmail.com or write to:

Safro Privacy Team
Bengaluru, Karnataka, India`,
        },
    ];

    return (
        <div className="bg-white min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">Privacy Policy</h1>
                        <p className="text-gray-400">Last updated: March 1, 2026</p>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="text-gray-500 leading-relaxed mb-10">
                        At Safro, we take your privacy seriously. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our ride-sharing platform.
                    </motion.p>
                    <div className="space-y-10">
                        {sections.map((s, i) => (
                            <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                <h2 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h2>
                                <div className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{s.content}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Privacy;
