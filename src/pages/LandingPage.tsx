import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { ArrowRight, Layout, Calendar, Users, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
    const { currentUser } = useStore();
    const navigate = useNavigate();

    const handleLoginClick = () => {
        if (currentUser) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
                            M
                        </div>
                        <span className="text-xl font-bold text-navy-900 tracking-tight">meits</span>
                    </div>
                    <button
                        onClick={handleLoginClick}
                        className="px-5 py-2.5 bg-navy-900 text-white font-medium rounded-xl hover:bg-navy-800 transition-colors shadow-lg shadow-navy-900/20 flex items-center gap-2"
                    >
                        {currentUser ? 'Go to Dashboard' : 'Login'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center max-w-3xl mx-auto space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl sm:text-6xl font-bold text-navy-900 tracking-tight leading-tight">
                            Construction Management <br />
                            <span className="text-emerald-600">Simplified.</span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Streamline your projects, manage your team, and track progress effortlessly.
                            MEITS brings everything you need into one beautiful workspace.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center justify-center gap-4 pt-4"
                    >
                        <button
                            onClick={handleLoginClick}
                            className="px-8 py-4 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/30 hover:-translate-y-1"
                        >
                            Get Started
                        </button>
                        <button className="px-8 py-4 bg-white text-navy-900 text-lg font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm hover:-translate-y-1">
                            Learn More
                        </button>
                    </motion.div>
                </div>
            </section>

            {/* Dashboard Preview */}
            <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-24">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="relative rounded-3xl overflow-hidden shadow-2xl shadow-navy-900/10 border border-slate-200 bg-slate-50 aspect-[16/9]"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                        {/* Abstract UI representation */}
                        <div className="w-full h-full p-8 grid grid-cols-4 gap-6 opacity-50 blur-[1px] scale-95 origin-top transform">
                            <div className="col-span-1 bg-white rounded-2xl shadow-sm h-full"></div>
                            <div className="col-span-3 space-y-6">
                                <div className="h-32 bg-white rounded-2xl shadow-sm w-full"></div>
                                <div className="grid grid-cols-2 gap-6 h-64">
                                    <div className="bg-white rounded-2xl shadow-sm"></div>
                                    <div className="bg-white rounded-2xl shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-slate-400 font-medium tracking-widest uppercase text-sm">Dashboard Preview</p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-navy-900 mb-4">Everything you need to build better</h2>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Powerful tools integrated into a seamless workflow for modern construction teams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <FeatureCard
                            icon={Layout}
                            title="Project Management"
                            description="Track every detail of your build from start to finish with intuitive visual boards."
                        />
                        <FeatureCard
                            icon={Calendar}
                            title="Smart Scheduling"
                            description="Coordinate your team and subcontractors with an integrated calendar system."
                        />
                        <FeatureCard
                            icon={Users}
                            title="Team Collaboration"
                            description="Keep everyone in sync with real-time updates and task assignments."
                        />
                        <FeatureCard
                            icon={FileText}
                            title="Docs & Invoices"
                            description="Manage quotes, invoices, and compliance documents in one secure place."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-600 rounded-md flex items-center justify-center text-white font-bold text-xs">M</div>
                        <span className="font-bold text-navy-900">meits</span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2026 MEITS. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
        >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-2">{title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}
