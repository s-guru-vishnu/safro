import { motion } from 'framer-motion';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Terms = () => {
    const sections = [
        {
            title: '1. Acceptance of Terms',
            content: `By accessing or using the Safro platform, you agree to be bound by these Terms of Service. If you do not agree to all terms, you may not use our services. These terms apply to all users including riders, drivers, and administrators.`,
        },
        {
            title: '2. Eligibility',
            content: `You must be at least 18 years old to use Safro. Drivers must hold a valid driving license, have verified vehicle documents (RC, Insurance), and pass our manual verification process conducted by the Safro admin team.`,
        },
        {
            title: '3. Negotiation-Based Pricing',
            content: `Safro operates on a negotiation model. Riders propose a fare, and drivers may accept, counter-offer, or decline. Both parties agree on the final price before the ride begins. Safro does not use surge pricing algorithms.

Once a fare is mutually agreed upon and the ride begins, it is considered binding unless the ride is cancelled as per our cancellation policy.`,
        },
        {
            title: '4. User Responsibilities',
            content: `Riders must:
• Provide accurate pickup and drop locations
• Be present at the pickup point within a reasonable time
• Treat drivers with respect and follow safety guidelines
• Pay the agreed-upon fare at the end of the ride

Drivers must:
• Maintain valid and up-to-date vehicle documents
• Arrive at the pickup location promptly
• Follow the agreed route unless instructed otherwise
• Maintain their vehicle in safe, roadworthy condition`,
        },
        {
            title: '5. Cancellation Policy',
            content: `Riders may cancel a ride before the driver arrives without penalty. After the driver arrives, a cancellation fee may apply. Drivers who frequently cancel accepted rides may face account restrictions.`,
        },
        {
            title: '6. Payments',
            content: `Payment for rides can be made via cash or supported digital payment methods. Safro may charge a small service fee on each ride. Payment disputes should be reported within 48 hours of the ride completion.`,
        },
        {
            title: '7. Account Suspension',
            content: `Safro reserves the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, receive repeated complaints, or compromise the safety of other users. Suspended users will be notified via email.`,
        },
        {
            title: '8. Limitation of Liability',
            content: `Safro acts as a platform connecting riders and drivers. We are not a transportation provider. We are not liable for any damages, injuries, or losses arising from the use of our platform. Users acknowledge that they use Safro at their own risk.`,
        },
        {
            title: '9. Intellectual Property',
            content: `All content, trademarks, logos, and software on the Safro platform are owned by Safro and protected by intellectual property laws. You may not copy, modify, or distribute any part of our platform without written permission.`,
        },
        {
            title: '10. Changes to Terms',
            content: `We may update these terms from time to time. Continued use of Safro after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or in-app notification.`,
        },
        {
            title: '11. Contact',
            content: `For questions about these Terms of Service, contact us at safro.2026.safro@gmail.com.`,
        },
    ];

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">Terms of Service</h1>
                        <p className="text-gray-400 dark:text-gray-500">Last updated: March 1, 2026</p>
                    </motion.div>
                </div>
            </section>

            {/* Content */}
            <section className="py-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                        className="text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
                        Please read these Terms of Service carefully before using the Safro ride-sharing platform.
                    </motion.p>
                    <div className="space-y-10">
                        {sections.map((s, i) => (
                            <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h2>
                                <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">{s.content}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Terms;
