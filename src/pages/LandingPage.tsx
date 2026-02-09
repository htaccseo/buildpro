import { useNavigate } from 'react-router-dom';
// Force rebuild: 2026-02-09T19:35 - Fixed ArrowRight build error
import { useStore } from '../lib/store';
import { Layout, Calendar, FileText, Hexagon, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import dashboardPreview from '../assets/dashboard-preview.png';

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

    const handleSignUpClick = () => {
        navigate('/signup');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-slate-100/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-emerald-500/20 shadow-lg">
                            <Hexagon className="w-6 h-6 fill-current" />
                        </div>
                        <span className="text-2xl font-extrabold text-navy-900 tracking-tight">meits</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleLoginClick}
                            className="text-slate-600 font-medium hover:text-navy-900 transition-colors px-4 py-2"
                        >
                            Login
                        </button>
                        <button
                            onClick={handleSignUpClick}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Sign Up
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Column: Text */}
                    <div className="text-left space-y-8 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-6 border border-emerald-100">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Simple & Minimal
                            </div>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-navy-900 tracking-tight leading-[1.1]">
                                Project <br />
                                Management <br />
                                <span className="text-emerald-600">Simplified.</span>
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-lg">
                                Designed for small builders who need clarity, not complexity.
                                Track projects, schedule teams, and manage invoices in one beautiful, minimal dashboard.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2"
                        >
                            <button
                                onClick={handleSignUpClick}
                                className="px-8 py-4 bg-emerald-600 text-white text-lg font-extrabold rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/30 hover:-translate-y-1 w-full sm:w-auto"
                            >
                                Get Started
                            </button>
                            <div className="flex items-center gap-2 text-sm text-slate-500 px-2 opacity-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>&nbsp;</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 40, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="relative"
                    >
                        <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl shadow-navy-900/10 border border-slate-200/60 bg-white">
                            <img
                                src={dashboardPreview}
                                alt="meits Dashboard Preview"
                                className="w-full h-auto object-cover"
                            />


                        </div>

                        {/* Decorative background blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-500/5 rounded-full blur-3xl -z-10" />
                    </motion.div>
                </div>
            </section>

            {/* Features Preview - Minimal Grid */}
            <section className="py-24 bg-slate-50/50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                        <div className="max-w-xl">
                            <h2 className="text-3xl font-extrabold text-navy-900 mb-4">Focus on building, not paperwork</h2>
                            <p className="text-slate-600 text-lg">
                                We stripped away the bloat to give you exactly what you need.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={Layout}
                            title="Visual Dashboard"
                            description="See your entire operation at a glance. Clean, simple, and effective."
                        />
                        <FeatureCard
                            icon={Calendar}
                            title="Smart Schedule"
                            description="A simple way to schedule that keeps your team and subcontractors aligned."
                        />
                        <FeatureCard
                            icon={Hexagon} // Using Hexagon as a placeholder for a 'Project' icon if needed, or Users
                            title="Project Tracking"
                            description="Monitor progress with minimal input. Updates that actually make sense."
                        />
                        <FeatureCard
                            icon={FileText}
                            title="Invoices"
                            description="An efficient way to monitor outstanding payments."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-navy-900 text-white overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute -top-[50%] -right-[20%] w-[80%] h-[180%] bg-emerald-500/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">Ready to simplify your workflow?</h2>
                    <p className="text-navy-200 text-lg mb-10 max-w-2xl mx-auto">
                        Join thousands of small builders who are managing their projects with meits.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleSignUpClick}
                            className="px-8 py-4 bg-emerald-500 text-white text-lg font-extrabold rounded-2xl hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 hover:-translate-y-1 w-full sm:w-auto"
                        >
                            Get Started Now
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                                <Hexagon className="w-5 h-5 fill-current" />
                            </div>
                            <span className="font-extrabold text-navy-900 text-xl">meits</span>
                        </div>
                        <div className="flex gap-8 text-slate-500 text-sm font-medium">
                            <a href="#" className="hover:text-emerald-600 transition-colors">Features</a>
                            <a href="#" className="hover:text-emerald-600 transition-colors">Pricing</a>
                            <a href="#" className="hover:text-emerald-600 transition-colors">Support</a>
                            <a href="#" className="hover:text-emerald-600 transition-colors">Login</a>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
                        <p>© 2026 MEITS. All rights reserved.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-slate-600">Privacy Policy</a>
                            <a href="#" className="hover:text-slate-600">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
        >
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 text-slate-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-navy-900 mb-3 group-hover:text-emerald-600 transition-colors">{title}</h3>
            <p className="text-slate-500 leading-relaxed">{description}</p>
        </motion.div>
    );
}

