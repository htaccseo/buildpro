import React, { useState } from 'react';
import { X, Mail, User, Phone, Briefcase, Shield } from 'lucide-react';
import { useStore } from '../lib/store';
import type { UserRole } from '../lib/types';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
    const [inviteLink, setInviteLink] = useState('');
    const { inviteUser } = useStore();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('worker');
    const [phone, setPhone] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Generate Invite Link
        const link = inviteUser(email, role);
        setInviteLink(link);

        // We still add the user to the store as a placeholder/pre-registered user?
        // Or we just show the link. For this demo, let's just show the link.
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        alert('Invite link copied to clipboard!');
        onClose();
        setInviteLink('');
        setName('');
        setEmail('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-navy-900">Invite Team Member</h2>
                    <button onClick={() => { onClose(); setInviteLink(''); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {inviteLink ? (
                    <div className="p-6 space-y-4">
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-navy-900 mb-1">Invite Generated!</h3>
                            <p className="text-sm text-text-muted mb-4">Share this link with {name || email} to join your team.</p>

                            <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-500 break-all mb-4 font-mono">
                                {inviteLink}
                            </div>

                            <button
                                onClick={copyLink}
                                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                            >
                                Copy Link & Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-navy-700">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-navy-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-navy-700">Phone Number (Optional)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-navy-700">Role</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('worker')}
                                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${role === 'worker'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <Briefcase className="w-4 h-4" />
                                    Worker
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('builder')}
                                    className={`p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${role === 'builder'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <Shield className="w-4 h-4" />
                                    Manager
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-colors"
                            >
                                Generate Invite Link
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
