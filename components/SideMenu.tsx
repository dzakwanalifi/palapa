'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ShoppingBag, Landmark, Map, Settings, ChevronRight } from 'lucide-react';

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: string) => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate }) => {
    const menuItems = [
        { id: 'profile', label: 'Profil Saya', icon: User },
        { id: 'umkm', label: 'UMKM Center', icon: ShoppingBag },
        { id: 'heritage', label: 'Heritage & Budaya', icon: Landmark },
        { id: 'guides', label: 'Local Guide', icon: Map },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
                    />

                    {/* Menu Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-[280px] bg-white/90 backdrop-blur-xl shadow-2xl border-l border-white/50"
                    >
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                                <h2 className="text-xl font-bold text-slate-800">Menu</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            {/* User Profile Summary */}
                            <div className="p-6 bg-blue-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#365594] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        D
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">Dzakwan Alifi</h3>
                                        <p className="text-xs text-slate-500">Traveler Pemula</p>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="flex-1 overflow-y-auto py-4">
                                {menuItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            onNavigate(item.id);
                                            onClose();
                                        }}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-[#365594] group-hover:text-white transition-colors">
                                                <item.icon size={18} />
                                            </div>
                                            <span className="font-medium text-slate-700">{item.label}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-[#365594]" />
                                    </button>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-slate-100">
                                <p className="text-xs text-center text-slate-400">
                                    Budaya GO v1.0.0
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
