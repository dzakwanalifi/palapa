'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';

interface HomeViewProps {
    destinations: any[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    onMenuNavigate: (page: string) => void;
    showItinerary: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
    onMenuNavigate,
    showItinerary
}) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col pointer-events-none"
            >
                {/* Gradient Blur - Base layer */}
                <div className="pointer-events-none absolute top-0 left-0 right-0 h-32 z-10 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />

                {/* Header - Stacked on top of gradient */}
                <div className="pointer-events-auto absolute top-0 left-0 right-0 z-20">
                    <Header onMenuNavigate={onMenuNavigate} />
                </div>

                {/* Sapaan Section - Stacked on top of gradient */}
                <div className="pointer-events-none absolute top-16 left-0 right-0 px-6 z-20">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-1"
                    >
                        <p className="text-sm font-medium text-slate-700">Hi Traveler 👋</p>
                        <h2 className="text-lg font-bold text-slate-900">Mari jelajahi destinasi seru!</h2>
                    </motion.div>
                </div>

                {/* Rest is map background - pointer-events-none */}
                <div className="flex-1" />

                {/* Bottom Gradient Blur */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/50 via-white/20 to-transparent" />
            </motion.div>
        </AnimatePresence>
    );
};
