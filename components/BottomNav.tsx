'use client';

import React from 'react';
import { Home, Bookmark, Bot } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-[90px] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.05)] rounded-t-[30px] px-8 pb-2 flex items-center justify-around">

            {/* Beranda */}
            <button
                onClick={() => onTabChange('beranda')}
                className="flex flex-col items-center gap-1 w-16 transition-transform active:scale-95"
            >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === 'beranda' ? 'bg-blue-50 text-[#365594]' : 'text-[#929398]'}`}>
                    <Home size={24} fill={activeTab === 'beranda' ? "currentColor" : "none"} />
                </div>
                <span className={`text-[10px] font-bold ${activeTab === 'beranda' ? 'text-[#365594]' : 'text-[#929398]'}`}>
                    Beranda
                </span>
            </button>

            {/* Palapabot - Floating Action Button */}
            <button
                onClick={() => onTabChange('palapabot')}
                className="relative -top-8 group"
            >
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#3B6ACE] to-[#1E3568] shadow-[0_8px_20px_rgba(59,106,206,0.4)] flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95 border-4 border-slate-50">
                    <div className="w-[56px] h-[56px] rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Bot size={32} className="text-white" />
                    </div>
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#929398] whitespace-nowrap">
                    Palapabot
                </span>
            </button>

            {/* Koleksi */}
            <button
                onClick={() => onTabChange('koleksi')}
                className="flex flex-col items-center gap-1 w-16 transition-transform active:scale-95"
            >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === 'koleksi' ? 'bg-blue-50 text-[#365594]' : 'text-[#929398]'}`}>
                    <Bookmark size={24} fill={activeTab === 'koleksi' ? "currentColor" : "none"} />
                </div>
                <span className={`text-[10px] font-bold ${activeTab === 'koleksi' ? 'text-[#365594]' : 'text-[#929398]'}`}>
                    Koleksi
                </span>
            </button>

        </nav>
    );
};
