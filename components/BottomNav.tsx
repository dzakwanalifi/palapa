'use client';

import React from 'react';
import { Home, Bookmark } from 'lucide-react';
import Image from 'next/image';

interface BottomNavProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="w-full h-[110px] bg-gradient-to-t from-white to-white shadow-[13px_4px_45px_rgba(0,0,0,0.05)] px-7 pt-4 pb-3 flex items-end justify-center gap-[60px] flex-shrink-0 relative z-50">

            {/* Beranda */}
            <button
                onClick={() => onTabChange('beranda')}
                className="flex flex-col items-center gap-[14px] w-[65px] transition-all active:scale-95 pb-4"
            >
                <div className="w-[28px] h-[28px] flex items-center justify-center">
                    <Home size={28} className={`transition-colors ${activeTab === 'beranda' ? 'text-[#365594]' : 'text-[#929398]'}`} fill="currentColor" strokeWidth={0} />
                </div>
                <span className={`text-[12px] font-bold text-center transition-colors ${activeTab === 'beranda' ? 'text-[#365594]' : 'text-[#929398]'}`}>
                    Beranda
                </span>
            </button>

            {/* Palapa Bot - Center */}
            <button
                onClick={() => onTabChange('palapa')}
                className="flex flex-col items-center gap-[6px] w-[85px] transition-all active:scale-95 pb-4"
            >
                <div className="w-[85px] h-[84px] rounded-full bg-gradient-to-br from-white to-white flex items-center justify-center shadow-[0_3.67px_18.35px_rgba(185,177,255,0.5)]">
                    <Image
                        src="/figma-assets/logo-budaya-go-19f67d.png"
                        alt="Budaya GO"
                        width={48}
                        height={48}
                        priority
                        style={{ width: 'auto', height: 'auto' }}
                        className="object-contain"
                    />
                </div>
                <span className={`text-[12px] font-bold text-center transition-colors ${activeTab === 'palapa' ? 'text-[#365594]' : 'text-[#929398]'}`}>
                    Palapabot
                </span>
            </button>

            {/* Koleksi */}
            <button
                onClick={() => onTabChange('koleksi')}
                className="flex flex-col items-center gap-[14px] w-[65px] transition-all active:scale-95 pb-4"
            >
                <div className="w-[28px] h-[28px] flex items-center justify-center">
                    <Bookmark size={28} className={`transition-colors ${activeTab === 'koleksi' ? 'text-[#365594]' : 'text-[#929398]'}`} fill="currentColor" strokeWidth={0} />
                </div>
                <span className={`text-[12px] font-bold text-center transition-colors ${activeTab === 'koleksi' ? 'text-[#365594]' : 'text-[#929398]'}`}>
                    Koleksi
                </span>
            </button>

        </nav>
    );
};
