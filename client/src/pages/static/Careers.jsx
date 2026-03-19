import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    MapPin, ArrowRight, ExternalLink, TrendingUp, Users, DollarSign, Calendar, Briefcase,
    Home, Target, Cpu, Heart, Umbrella
} from 'lucide-react';

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Careers = () => {
    const perks = [
        { icon: <Home className="text-teal-600" />, title: 'Remote First', desc: 'Work from anywhere in India. Quarterly team retreats.' },
        { icon: <TrendingUp className="text-teal-600" />, title: 'Equity & ESOPs', desc: 'Own a piece of Safro with generous stock options.' },
        { icon: <Target className="text-teal-600" />, title: 'Real Impact', desc: 'Build products used by millions of riders & drivers daily.' },
        { icon: <Cpu className="text-teal-600" />, title: 'Growth Budget', desc: '₹50K/year learning budget, conferences, and mentorship.' },
        { icon: <Heart className="text-teal-600" />, title: 'Health Benefits', desc: 'Full medical insurance for you and your family.' },
        { icon: <Umbrella className="text-teal-600" />, title: 'Unlimited PTO', desc: 'We trust you. Take time off when you need it.' },
    ];

    const hiringStats = [
        { label: 'Team Size', value: '45+', icon: <Users /> },
        { label: 'Hires in 2025', value: '28', icon: <TrendingUp /> },
        { label: 'Avg. Salary', value: '₹18L', icon: <DollarSign /> },
        { label: 'Open Roles', value: '8', icon: <Briefcase /> },
    ];

    const openings = [
        {
            title: 'Senior Full-Stack Engineer',
            team: 'Engineering',
            location: 'Remote / Bengaluru',
            type: 'Full-Time',
            salary: '₹25L – ₹40L',
            experience: '4–7 years',
            posted: 'Feb 28, 2026',
            description: 'Build and scale our real-time ride marketplace platform using React, Node.js, MongoDB, and Socket.io.',
            skills: ['React', 'Node.js', 'MongoDB', 'Socket.io', 'AWS'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Product Designer (Senior)',
            team: 'Design',
            location: 'Remote',
            type: 'Full-Time',
            salary: '₹20L – ₹32L',
            experience: '3–6 years',
            posted: 'Mar 1, 2026',
            description: 'Design intuitive rider and driver experiences. Own the full design lifecycle from research to pixel-perfect UI.',
            skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Backend Engineer (Node.js)',
            team: 'Engineering',
            location: 'Bengaluru',
            type: 'Full-Time',
            salary: '₹18L – ₹30L',
            experience: '2–5 years',
            posted: 'Mar 2, 2026',
            description: 'Build high-performance APIs, real-time WebSocket services, and geospatial features for live tracking.',
            skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Socket.io'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Growth Marketing Manager',
            team: 'Marketing',
            location: 'Remote',
            type: 'Full-Time',
            salary: '₹15L – ₹25L',
            experience: '3–5 years',
            posted: 'Feb 25, 2026',
            description: 'Drive user acquisition and retention through data-driven campaigns across digital channels.',
            skills: ['Performance Marketing', 'SEO', 'Analytics', 'Content Strategy'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Operations Lead — South India',
            team: 'Operations',
            location: 'Chennai',
            type: 'Full-Time',
            salary: '₹12L – ₹20L',
            experience: '3–6 years',
            posted: 'Feb 20, 2026',
            description: 'Launch and manage city operations, onboard drivers, handle ground support, and ensure ride quality.',
            skills: ['Operations', 'Driver Onboarding', 'City Launches', 'Analytics'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Data Analyst',
            team: 'Analytics',
            location: 'Remote',
            type: 'Contract → Full-Time',
            salary: '₹10L – ₹18L',
            experience: '1–3 years',
            posted: 'Mar 3, 2026',
            description: 'Analyze ride patterns, pricing trends, and user behavior to drive product decisions.',
            skills: ['SQL', 'Python', 'Tableau', 'Data Modeling'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Mobile Engineer (React Native)',
            team: 'Engineering',
            location: 'Remote / Bengaluru',
            type: 'Full-Time',
            salary: '₹22L – ₹35L',
            experience: '3–5 years',
            posted: 'Mar 4, 2026',
            description: 'Build and ship our native mobile apps for riders and drivers with offline-first architecture.',
            skills: ['React Native', 'TypeScript', 'Redux', 'Maps SDK'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
        {
            title: 'Customer Support Lead',
            team: 'Support',
            location: 'Bengaluru',
            type: 'Full-Time',
            salary: '₹8L – ₹14L',
            experience: '2–4 years',
            posted: 'Feb 18, 2026',
            description: 'Build and lead a world-class support team handling rider and driver queries across chat, email, and phone.',
            skills: ['Customer Support', 'Team Management', 'CRM Tools', 'Escalation Handling'],
            linkedIn: 'https://www.linkedin.com/company/safro-rides/jobs/',
        },
    ];

    const hiringTimeline = [
        { year: '2024', event: 'Founded in Bengaluru', hires: 'Core team of 5 engineers', highlight: true },
        { year: 'Q1 2025', event: 'Seed Round ($2M)', hires: '12 hires across Eng, Design, Ops' },
        { year: 'Q3 2025', event: 'Bengaluru Launch', hires: '16 hires — expanded to 45+ team members' },
        { year: '2026', event: 'Series A & Multi-City Expansion', hires: '8 open roles — hiring aggressively', highlight: true },
    ];

    const teamColors = {
        Engineering: 'bg-blue-50 text-blue-700 border-blue-200',
        Design: 'bg-purple-50 text-purple-700 border-purple-200',
        Marketing: 'bg-amber-50 text-amber-700 border-amber-200',
        Operations: 'bg-green-50 text-green-700 border-green-200',
        Analytics: 'bg-teal-50 text-teal-700 border-teal-200',
        Support: 'bg-red-50 text-red-700 border-red-200',
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Hero */}
            <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                        <span className="inline-block px-4 py-1.5 bg-teal-500/10 text-teal-400 text-xs font-semibold rounded-full mb-6 tracking-wide uppercase border border-teal-500/20">
                            We're Hiring
                        </span>
                        <h1 className="text-4xl sm:text-5xl font-extrabold mb-6">
                            Build the Future of <span className="text-teal-400">Fair Rides</span>
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
                            Join a passionate team redefining how India moves. We're looking for dreamers, builders, and hustlers.
                        </p>
                        <a href="https://www.linkedin.com/company/safro-rides/" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A66C2] text-white font-semibold rounded-lg hover:bg-[#004182] transition-all text-sm">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                            Follow Us on LinkedIn
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* Hiring Stats */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {hiringStats.map((stat, i) => (
                            <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-md transition-all">
                                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center mx-auto mb-3">{stat.icon}</div>
                                <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hiring Timeline */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-gray-900 text-center mb-12">Hiring Journey</motion.h2>
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 hidden sm:block" />
                        <div className="space-y-8">
                            {hiringTimeline.map((item, i) => (
                                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                    className="flex gap-6 items-start">
                                    <div className={`relative z-10 shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold border-2 ${item.highlight ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                                        <Calendar size={16} />
                                    </div>
                                    <div className={`flex-1 p-5 rounded-xl border ${item.highlight ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{item.year}</span>
                                            <h3 className="font-bold text-gray-900">{item.event}</h3>
                                        </div>
                                        <p className="text-sm text-gray-500">{item.hires}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Perks */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-gray-900 text-center mb-12">Why Work at Safro?</motion.h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {perks.map((p, i) => (
                            <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-md transition-all">
                                <span className="mb-3 block flex justify-center">{p.icon}</span>
                                <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                                <p className="text-sm text-gray-500">{p.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Salary Insights */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-gray-900 text-center mb-4">Compensation Transparency</motion.h2>
                    <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-gray-500 text-center mb-12 max-w-xl mx-auto">We believe in transparent compensation. Here's what our team earns.</motion.p>
                    <div className="grid sm:grid-cols-3 gap-6">
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                            className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-xl border border-teal-200 p-6 text-center">
                            <p className="text-xs text-teal-600 font-bold uppercase tracking-wider mb-2">Highest Package</p>
                            <p className="text-3xl font-extrabold text-gray-900">₹40L</p>
                            <p className="text-xs text-gray-500 mt-1">Senior Full-Stack Engineer</p>
                        </motion.div>
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
                            className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-6 text-center">
                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Average Salary</p>
                            <p className="text-3xl font-extrabold text-gray-900">₹18L</p>
                            <p className="text-xs text-gray-500 mt-1">Across all roles</p>
                        </motion.div>
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
                            className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 p-6 text-center">
                            <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-2">ESOP Pool</p>
                            <p className="text-3xl font-extrabold text-gray-900">12%</p>
                            <p className="text-xs text-gray-500 mt-1">Reserved for employees</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Open Positions */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-3xl font-bold text-gray-900 text-center mb-4">Open Positions</motion.h2>
                    <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-gray-500 text-center mb-12">{openings.length} roles • All include ESOPs</motion.p>
                    <div className="space-y-4">
                        {openings.map((job, i) => (
                            <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-200 transition-all group">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${teamColors[job.team] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{job.team}</span>
                                            <span className="text-[10px] text-gray-400">{job.type}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-600 transition-colors mb-1">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mb-3 leading-relaxed">{job.description}</p>
                                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-3">
                                            <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>
                                            <span className="flex items-center gap-1"><Briefcase size={11} /> {job.experience}</span>
                                            <span className="flex items-center gap-1"><Calendar size={11} /> Posted {job.posted}</span>
                                        </div>
                                        {/* Skills */}
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {job.skills.map((skill, j) => (
                                                <span key={j} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{skill}</span>
                                            ))}
                                        </div>
                                        {/* Salary */}
                                        <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-lg text-xs font-bold">
                                            <DollarSign size={12} /> {job.salary} / year + ESOPs
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <a href={job.linkedIn} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-teal-600 transition-all whitespace-nowrap">
                                            Apply <ArrowRight size={14} />
                                        </a>
                                        <a href={job.linkedIn} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 border border-gray-300 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-all whitespace-nowrap">
                                            <ExternalLink size={12} /> View on LinkedIn
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gray-900">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">Don't see your role?</h2>
                    <p className="text-gray-400 mb-6">Send us your resume and we'll keep you in mind for future openings.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a href="mailto:safro.2026.safro@gmail.com" className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all">
                            safro.2026.safro@gmail.com <ArrowRight />
                        </a>
                        <a href="https://www.linkedin.com/company/safro-rides/" target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800 transition-all">
                            <ExternalLink size={14} /> LinkedIn Page
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Careers;
