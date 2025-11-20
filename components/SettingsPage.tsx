'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Lock, Globe, Moon, HelpCircle, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface SettingsPageProps {
    onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 z-40 bg-slate-50 flex flex-col"
        >
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 shadow-sm z-10 flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={24} className="text-slate-800" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Pengaturan</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Section: Umum */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Umum</h3>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#365594]">
                                    <Bell size={18} />
                                </div>
                                <span className="font-medium text-slate-900">Notifikasi</span>
                            </div>
                            <Switch />
                        </div>
                        <div className="p-4 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Moon size={18} />
                                </div>
                                <span className="font-medium text-slate-900">Mode Gelap</span>
                            </div>
                            <Switch />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                    <Globe size={18} />
                                </div>
                                <span className="font-medium text-slate-900">Bahasa</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="text-sm">Indonesia</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: Keamanan */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Keamanan</h3>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                    <Lock size={18} />
                                </div>
                                <span className="font-medium text-slate-900">Ubah Kata Sandi</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </div>
                    </div>
                </div>

                {/* Section: Lainnya */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Lainnya</h3>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <HelpCircle size={18} />
                                </div>
                                <span className="font-medium text-slate-900">Bantuan & Dukungan</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-400" />
                        </div>
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                    <div className="font-bold text-xs">v1.0</div>
                                </div>
                                <span className="font-medium text-slate-900">Versi Aplikasi</span>
                            </div>
                            <span className="text-sm text-slate-400">1.0.0 (Beta)</span>
                        </div>
                    </div>
                </div>

            </div>
        </motion.div>
    );
};
