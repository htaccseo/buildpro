import React from 'react';
import { format } from 'date-fns';
import { X, Trash2 } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import type { TaskComment, User } from '../lib/types'; // Assuming TaskComment is exported from types

interface CommentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    comment: TaskComment | null;
    user?: User;
    onDelete: () => void;
    canDelete: boolean;
}

export const CommentDetailModal: React.FC<CommentDetailModalProps> = ({
    isOpen,
    onClose,
    comment,
    user,
    onDelete,
    canDelete
}) => {
    if (!isOpen || !comment) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <UserAvatar userId={comment.userId} className="w-10 h-10" />
                        <div>
                            <h3 className="font-bold text-navy-900">{user?.name || 'Unknown'}</h3>
                            <p className="text-xs text-text-muted">
                                {format(new Date(comment.createdAt), 'd/M, h:mm a')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-navy-900 hover:bg-slate-50 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-navy-900 whitespace-pre-wrap text-base leading-relaxed">
                        {comment.message}
                    </p>

                    {comment.images && comment.images.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {comment.images.map((img: string, idx: number) => (
                                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200">
                                    <img src={img} alt="Attachment" className="w-full h-auto object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {canDelete && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete this comment?')) {
                                    onDelete();
                                    onClose();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors font-medium shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Comment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
