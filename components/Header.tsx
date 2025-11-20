'use client';

import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { SideMenu } from './SideMenu';
import { Logo } from './Logo';

interface HeaderProps {
    onMenuNavigate?: (page: string) => void;
    onMenuOpenChange?: (isOpen: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuNavigate, onMenuOpenChange }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuOpen = (open: boolean) => {
        setIsMenuOpen(open);
        onMenuOpenChange?.(open);
    };

    return (
        <>
            <header className="px-6 pt-6 pb-2 flex items-center justify-between pointer-events-auto">
                <Logo size="sm" showText={false} animated={true} />

                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all">
                        <Bell size={24} className="text-[#365594]" strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => handleMenuOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all"
                    >
                        <Menu size={24} className="text-[#365594]" strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => handleMenuOpen(false)}
                onNavigate={(page) => onMenuNavigate?.(page)}
            />
        </>
    );
};
