'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryFilter } from '@/components/CategoryFilter';
import { DestinationCard } from '@/components/DestinationCard';
import { Input } from '@/components/ui/input';

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
    destinations,
    searchQuery,
    onSearchChange,
    activeCategory,
    onCategoryChange,
    onMenuNavigate,
    showItinerary
}) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex flex-col pointer-events-none bg-gradient-to-b from-[#3B6ACE] via-[#2E5291] to-[#1E3568]"
            >
                {/* Header */}
                <div className="pointer-events-auto">
                    <Header onMenuNavigate={onMenuNavigate} />

                    {/* Search & Filter - Hide if itinerary is showing */}
                    <AnimatePresence>
                        {!showItinerary && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-6 pt-4 pb-6 space-y-6"
                            >
                                {/* Welcome Section */}
                                <div className="space-y-3 text-white">
                                    <p className="text-sm font-medium opacity-95">Hi Zahid 👋</p>
                                    <h2 className="text-2xl font-bold leading-tight">
                                        Selamat Datang di <span className="bg-gradient-to-r from-blue-100 to-cyan-200 bg-clip-text text-transparent">Palapa!</span>
                                    </h2>
                                </div>

                                {/* Search Bar */}
                                <div className="relative shadow-2xl shadow-blue-900/30 rounded-2xl overflow-hidden">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 z-10 pointer-events-none">
                                        <Search size={20} strokeWidth={2} />
                                    </div>
                                    <Input
                                        placeholder="Cari destinasi..."
                                        className="pl-12 h-14 bg-white text-slate-900 border-none text-base placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                    />
                                </div>

                                {/* Category Filter */}
                                <CategoryFilter
                                    activeCategory={activeCategory}
                                    onSelect={onCategoryChange}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1" />

                {/* Bottom Cards - Hide if itinerary is showing */}
                <AnimatePresence>
                    {!showItinerary && destinations.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="pointer-events-auto pb-[100px]"
                        >
                            <div className="pl-6 mb-4">
                                <h3 className="text-lg font-bold text-white">Rekomendasi Untukmu 🔥</h3>
                            </div>

                            <div className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar snap-x snap-mandatory">
                                {destinations.slice(0, 5).map((dest, index) => (
                                    <motion.div
                                        key={dest.id || index}
                                        className="snap-center"
                                    >
                                        <DestinationCard
                                            name={dest.name}
                                            location={dest.kotaKabupaten || dest.provinsi || 'Indonesia'}
                                            rating={dest.rating || 4.5}
                                            image={dest.imageUrl || 'https://images.unsplash.com/photo-1555899434-94d1368d7dd6?q=80&w=1000&auto=format&fit=crop'}
                                            price={dest.priceRange || 'Gratis'}
                                            category={dest.category || 'Wisata'}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
};
