'use client';

import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { SideMenu } from './SideMenu';
import { Logo } from './Logo';

interface HeaderProps {
    onMenuNavigate?: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuNavigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <header className="px-6 pt-6 pb-2 flex items-center justify-between pointer-events-auto">
                <Logo size="sm" showText={true} animated={true} />

                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all">
                        <Bell size={20} />
                    </button>
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </header>

            <SideMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onNavigate={(page) => onMenuNavigate?.(page)}
            />
        </>
    );
};
