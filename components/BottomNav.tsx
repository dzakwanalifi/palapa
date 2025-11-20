'use client';

import React from 'react';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-[90px] bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-6 pb-3 flex items-center justify-around border-t border-slate-100">

            {/* Beranda */}
            <button
                onClick={() => onTabChange('beranda')}
                className="flex flex-col items-center gap-1.5 w-20 transition-all active:scale-95 group"
            >
                <div className={`p-3 rounded-xl transition-all duration-200 ${activeTab === 'beranda' ? 'bg-[#365594]/10 text-[#365594] scale-110' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
                    </svg>
                </div>
                <span className={`text-[11px] font-semibold transition-colors ${activeTab === 'beranda' ? 'text-[#365594]' : 'text-slate-500'}`}>
                    Beranda
                </span>
            </button>

            {/* Palapa Bot - Floating Action Button */}
            <button
                onClick={() => onTabChange('palapa')}
                className="relative -top-6 group transition-transform active:scale-95"
            >
                <div className={`w-[68px] h-[68px] rounded-full bg-gradient-to-br from-[#365594] to-[#2a4470] shadow-[0_10px_28px_rgba(54,85,148,0.35)] flex items-center justify-center transition-all duration-200 border-4 border-white ${activeTab === 'palapa' ? 'scale-110' : 'group-hover:scale-105'}`}>
                    <div className="w-[56px] h-[56px] rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="white"/>
                        </svg>
                    </div>
                </div>
                <span className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[11px] font-semibold whitespace-nowrap transition-colors ${activeTab === 'palapa' ? 'text-[#365594]' : 'text-slate-500'}`}>
                    Palapa
                </span>
            </button>

            {/* Koleksi */}
            <button
                onClick={() => onTabChange('koleksi')}
                className="flex flex-col items-center gap-1.5 w-20 transition-all active:scale-95 group"
            >
                <div className={`p-3 rounded-xl transition-all duration-200 ${activeTab === 'koleksi' ? 'bg-[#365594]/10 text-[#365594] scale-110' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor" opacity="0.5"/>
                        <path d="M17 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16H7v-5h5v5zm3 0v-5h5v5h-5z" fill="currentColor"/>
                    </svg>
                </div>
                <span className={`text-[11px] font-semibold transition-colors ${activeTab === 'koleksi' ? 'text-[#365594]' : 'text-slate-500'}`}>
                    Koleksi
                </span>
            </button>

        </nav>
    );
};
