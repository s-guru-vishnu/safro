import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiArrowRight, FiTag } from 'react-icons/fi';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Blog = () => {
    const posts = [
        {
            title: 'How Negotiation-Based Pricing is Changing Ride-Sharing',
            excerpt: 'Why letting riders and drivers agree on fares leads to better outcomes for everyone.',
            date: 'Mar 1, 2026',
            category: 'Product',
            readTime: '5 min read',
        },
        {
            title: 'Behind the Scenes: How We Verify Every Driver',
            excerpt: 'A deep dive into our manual verification process — license, Aadhaar, RC, and insurance.',
            date: 'Feb 22, 2026',
            category: 'Safety',
            readTime: '4 min read',
        },
        {
            title: 'The Real Cost of Surge Pricing (And How to Avoid It)',
            excerpt: 'Breaking down how algorithmic pricing hurts both riders and drivers.',
            date: 'Feb 15, 2026',
            category: 'Insights',
            readTime: '6 min read',
        },
        {
            title: 'Safro Live Tracking: How We Built Real-Time Maps',
            excerpt: 'A technical look at our WebSocket-based live tracking system for drivers and admins.',
            date: 'Feb 8, 2026',
            category: 'Engineering',
            readTime: '7 min read',
        },
        {
            title: 'Launching in Bengaluru: Lessons from Our First City',
            excerpt: 'What we learned from our pilot launch and how it shaped the product.',
            date: 'Jan 30, 2026',
            category: 'Company',
            readTime: '5 min read',
        },
        {
            title: 'Why Drivers Love Safro: No Commission Squeeze',
            excerpt: 'Hear from drivers who switched to Safro and earn more per ride.',
            date: 'Jan 20, 2026',
            category: 'Stories',
            readTime: '4 min read',
        },
    ];

    const categoryColors = {
        Product: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
        Safety: 'bg-red-50 dark:bg-red-900/20 text-red-700',
        Insights: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700',
        Engineering: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700',
        Company: 'bg-amber-50 text-amber-700',
        Stories: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    };

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <span className="inline-block px-4 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-400 text-xs font-semibold rounded-full mb-6 tracking-wide uppercase border border-teal-500/20">
                            Blog
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
                            The Safro <span className="text-teal-400">Blog</span>
                        </h1>
                        <p className="text-lg text-gray-400 dark:text-gray-500 max-w-2xl mx-auto leading-relaxed">
                            Insights, stories, and updates from the team building India's fairest ride platform.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Posts Grid */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post, i) => (
                            <motion.article
                                key={i} custom={i}
                                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-teal-200 dark:border-teal-800 transition-all group cursor-pointer"
                            >
                                {/* Color accent bar */}
                                <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-600 group-hover:from-teal-400 group-hover:to-teal-500 transition-all" />
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${categoryColors[post.category] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                            {post.category}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 dark:text-teal-400 transition-colors leading-snug">{post.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{post.excerpt}</p>
                                    <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                                        <span className="flex items-center gap-1"><FiClock size={12} /> {post.readTime}</span>
                                        <span>{post.date}</span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Blog;
