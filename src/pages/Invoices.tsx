import { useState } from 'react';
import { useStore } from '../lib/store';
import { useOrganizationData } from '../lib/hooks';
import { Card } from '../components/ui/Card';
import { Plus, FileText, ArrowUpRight, ArrowDownLeft, Trash2, Edit2, Paperclip, Calendar } from 'lucide-react';
import { cn, formatDate, resizeImage } from '../lib/utils';
import type { Invoice } from '../lib/types';
import { UserAvatar } from '../components/UserAvatar';

export function Invoices() {
    // Use Clean Data Hook (RLS)
    const { invoices } = useOrganizationData();
    // Store actions
    const { addInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice } = useStore();
    const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
    const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
    const [dateFilter, setDateFilter] = useState<'this_month' | 'last_month' | 'this_financial_year' | 'all_time'>('this_month');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [invoiceType, setInvoiceType] = useState<'sent' | 'received'>('sent');
    const [attachment, setAttachment] = useState<string | null>(null);

    // Filter Logic
    const filteredInvoices = invoices.filter(inv => {
        // 1. Filter by Sent/Received (Tab)
        if (inv.type !== activeTab) return false;

        // 2. Filter by View Mode (Pending vs History)
        if (viewMode === 'pending') {
            return inv.status === 'pending' || inv.status === 'overdue';
        } else {
            // History (Paid)
            if (inv.status !== 'paid') return false;

            // 3. Date Filter (Only for History)
            if (dateFilter === 'all_time') return true;

            const invDate = new Date(inv.date); // Issue Date
            const now = new Date();

            // Standard Month Filters
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            // Australian Financial Year (July 1 - June 30)
            let fyStartYear = now.getFullYear();
            if (now.getMonth() < 6) { // Jan (0) - June (5)
                fyStartYear = now.getFullYear() - 1;
            }
            const startOfFY = new Date(fyStartYear, 6, 1); // July 1st
            const endOfFY = new Date(fyStartYear + 1, 5, 30, 23, 59, 59, 999); // June 30th next year

            if (dateFilter === 'this_month') {
                return invDate >= startOfThisMonth;
            } else if (dateFilter === 'last_month') {
                return invDate >= startOfLastMonth && invDate <= endOfLastMonth;
            } else if (dateFilter === 'this_financial_year') {
                return invDate >= startOfFY && invDate <= endOfFY;
            }
            return true;
        }
    });

    // Calculate totals based on CURRENT VIEW
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // For pending tab, we show total outstanding. For history tab, we show total revenue/paid.
    // The card title and value should reflect the CURRENT filtered list.

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                // If it's an image, resize it. If it's a PDF or other, we might need a different strategy.
                // For now, assuming images or small files acceptable as base64.
                // NOTE: resizeImage returns a base64 string for images.
                if (file.type.startsWith('image/')) {
                    const resized = await resizeImage(file, 800);
                    setAttachment(resized);
                } else {
                    // For non-images, straightforward base64 (caution: large files)
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        setAttachment(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error("File upload failed", error);
                alert("Failed to process file.");
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && editingId) {
            // Update existing
            const existing = invoices.find(i => i.id === editingId);
            if (!existing) return;

            updateInvoice({
                ...existing,
                clientName,
                amount: parseFloat(amount),
                dueDate,
                date: issueDate,
                description,
                attachmentUrl: attachment || undefined
            });
        } else {
            // Create new
            const newInvoice: Omit<Invoice, 'organizationId'> = {
                id: Math.random().toString(36).substr(2, 9),
                type: invoiceType,
                amount: parseFloat(amount),
                clientName,
                dueDate,
                description,
                date: issueDate,
                status: 'pending',
                attachmentUrl: attachment || undefined
            };
            addInvoice(newInvoice);
        }
        setIsFormOpen(false);
        resetForm();
    };

    const handleEdit = (invoice: Invoice) => {
        setIsEditing(true);
        setEditingId(invoice.id);
        setClientName(invoice.clientName);
        setAmount(invoice.amount.toString());
        setDueDate(invoice.dueDate);
        setIssueDate(invoice.date);
        setDescription(invoice.description);
        setInvoiceType(invoice.type);
        setAttachment(invoice.attachmentUrl || null);
        setIsFormOpen(true);
    };

    const resetForm = () => {
        setClientName('');
        setAmount('');
        setDueDate('');
        setIssueDate(new Date().toISOString().split('T')[0]);
        setDescription('');
        setAttachment(null);
        setIsEditing(false);
        setEditingId(null);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy-900">Invoices</h1>
                    <p className="text-text-muted mt-1">Manage your {activeTab === 'sent' ? 'receivables' : 'payables'}.</p>
                </div>
                <button
                    onClick={() => {
                        setInvoiceType(activeTab);
                        setIsFormOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === 'sent' ? 'New Invoice' : 'New Bill'}
                </button>
            </div>

            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 border-none shadow-sm bg-white text-navy-900">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-50 rounded-full">
                            {activeTab === 'sent' ? <ArrowUpRight className="w-6 h-6 text-emerald-500" /> : <ArrowDownLeft className="w-6 h-6 text-emerald-500" />}
                        </div>
                        <div>
                            <p className="text-navy-600 text-sm font-medium">
                                {viewMode === 'pending'
                                    ? (activeTab === 'sent' ? 'Total Outstanding Receivables' : 'Total Outstanding Payables')
                                    : (activeTab === 'sent' ? 'Total Revenue Collected' : 'Total Paid')
                                }
                            </p>
                            <h3 className="text-5xl font-extrabold text-navy-900">${totalAmount.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-4 border-t-4 border-emerald-500">
                        <span className="text-navy-700">
                            {viewMode === 'pending'
                                ? 'Pending & Overdue'
                                : `Paid (${dateFilter.replace('this_financial_year', 'FY YTD').replace('_', ' ')})`
                            }
                        </span>
                        <span className="font-bold text-navy-900">{filteredInvoices.length} invoices</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    {/* Main Tabs (Sent vs Received) */}
                    <div className="flex gap-4 border-b border-slate-100 pb-4">
                        <button
                            onClick={() => { setActiveTab('sent'); setViewMode('pending'); }}
                            className={cn("px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2", activeTab === 'sent' ? "bg-emerald-50 text-emerald-600" : "text-text-muted hover:text-navy-900 hover:bg-slate-50")}
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            Invoices Sent (Receivables)
                        </button>
                        <button
                            onClick={() => { setActiveTab('received'); setViewMode('pending'); }}
                            className={cn("px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2", activeTab === 'received' ? "bg-emerald-50 text-emerald-600" : "text-text-muted hover:text-navy-900 hover:bg-slate-50")}
                        >
                            <ArrowDownLeft className="w-4 h-4" />
                            Bills to Pay (Payables)
                        </button>
                    </div>

                    {/* Sub-Tabs (Pending vs History) & Filters */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex p-1 bg-slate-100 rounded-xl self-start">
                            <button
                                onClick={() => setViewMode('pending')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    viewMode === 'pending' ? "bg-white text-navy-900 shadow-sm" : "text-text-muted hover:text-navy-700"
                                )}
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => setViewMode('history')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    viewMode === 'history' ? "bg-white text-navy-900 shadow-sm" : "text-text-muted hover:text-navy-700"
                                )}
                            >
                                History / Paid
                            </button>
                        </div>

                        {viewMode === 'history' && (
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                <Calendar className="w-4 h-4 text-emerald-600" />
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value as any)}
                                    className="bg-transparent text-sm font-medium text-navy-900 outline-none cursor-pointer"
                                >
                                    <option value="this_month">This Month</option>
                                    <option value="last_month">Last Month</option>
                                    <option value="this_financial_year">Financial Year (YTD)</option>
                                    <option value="all_time">All Time</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Invoice List */}
                    <div className="space-y-4">
                        {filteredInvoices.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-text-muted">No {viewMode} invoices found for {dateFilter.replace('_', ' ')}.</p>
                            </div>
                        ) : (
                            filteredInvoices.map(invoice => (
                                <Card key={invoice.id} className="p-4 md:p-5 border-none shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row items-stretch md:items-center gap-3">
                                    {/* Left Section (Info) */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                            {/* Icon */}
                                            <div className={cn("hidden md:flex p-2 rounded-lg shrink-0 items-center justify-center", activeTab === 'sent' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600")}>
                                                <FileText className="w-5 h-5" />
                                            </div>

                                            <h3 className="font-bold text-navy-900 text-base truncate max-w-[150px] md:max-w-none">{invoice.clientName}</h3>

                                            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0",
                                                invoice.status === 'paid' ? "bg-emerald-100 text-emerald-700" :
                                                    invoice.status === 'overdue' ? "bg-rose-100 text-rose-700" :
                                                        "bg-amber-100 text-amber-700")}>
                                                {invoice.status}
                                            </span>

                                            <UserAvatar userId={invoice.createdBy} className="h-6 w-6 text-[10px] shrink-0" />

                                            {/* Desktop Attachment Button */}
                                            {invoice.attachmentUrl && (
                                                <a href={invoice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 ml-2 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors group" title="View Attachment">
                                                    <Paperclip className="w-3.5 h-3.5" />
                                                    <span className="text-xs font-medium">Attachment</span>
                                                </a>
                                            )}
                                        </div>

                                        {/* Description & Date */}
                                        <div className="pl-0 md:pl-[52px] mt-1">
                                            <p className="text-sm text-text-muted mb-1 line-clamp-1">{invoice.description}</p>
                                            <p className="text-xs text-slate-400">
                                                {activeTab === 'sent' ? 'Issued' : 'Received'}: {formatDate(invoice.date, 'MMM d, yyyy')} • Due: {formatDate(invoice.dueDate, 'MMM d, yyyy')}
                                            </p>
                                        </div>

                                        {/* Mobile Attachment Button (Middle Row) */}
                                        {invoice.attachmentUrl && (
                                            <div className="md:hidden mt-3">
                                                <a href={invoice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 rounded-lg text-emerald-600 text-sm font-medium border border-slate-100 hover:bg-slate-100 transition-colors">
                                                    <Paperclip className="w-4 h-4" /> View Attachment
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Section: Amount + Actions */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-slate-100">
                                        <span className="text-lg md:text-xl font-bold text-navy-900 block md:mb-1">${invoice.amount.toLocaleString()}</span>

                                        {/* Action Buttons Group */}
                                        <div className="flex items-center gap-1">
                                            {invoice.status !== 'paid' ? (
                                                <button onClick={() => updateInvoiceStatus(invoice.id, 'paid')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0">
                                                    Mark Paid
                                                </button>
                                            ) : (
                                                <button onClick={() => updateInvoiceStatus(invoice.id, 'pending')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors shrink-0">
                                                    Mark Unpaid
                                                </button>
                                            )}
                                            <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-100 ml-1">
                                                <button onClick={() => handleEdit(invoice)} className="p-1.5 text-slate-400 hover:text-navy-900 hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm" title="Edit">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <div className="w-px bg-slate-200 my-1 mx-0.5" />
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Delete this invoice? Marking as paid is preferred for history.')) {
                                                            deleteInvoice(invoice.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white rounded-md transition-all shadow-none hover:shadow-sm"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* New Invoice Modal */}
            {
                isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                            <h3 className="text-xl font-bold text-navy-900 mb-4">
                                {isEditing ? 'Edit Invoice' : (activeTab === 'sent' ? 'New Invoice' : 'New Bill')}
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">{activeTab === 'sent' ? 'Client Name' : 'Payee Name'}</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Amount ($)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-navy-900 mb-1.5">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Issue Date</label>
                                    <input
                                        type="date"
                                        value={issueDate}
                                        onChange={(e) => setIssueDate(e.target.value)}
                                        className="w-full px-4 py-2 rounded-full bg-slate-50 border border-slate-200 focus:border-emerald-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-navy-900 mb-1.5">Attachment (Optional)</label>
                                    <div className="flex items-center gap-3">
                                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition-colors text-sm font-medium text-navy-700">
                                            <Paperclip className="w-4 h-4" />
                                            <span>{attachment ? 'Change File' : 'Upload File'}</span>
                                            <input
                                                type="file"
                                                accept="image/*,application/pdf"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        {attachment && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><FileText className="w-3 h-3" /> File Selected</span>}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="flex-1 px-4 py-2 rounded-full border border-slate-200 text-navy-900 hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                    >
                                        {isEditing ? 'Save Changes' : (activeTab === 'sent' ? 'Create Invoice' : 'Create Bill')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
