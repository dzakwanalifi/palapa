'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Mountain, Landmark, Utensils, Tent, ShoppingBag } from 'lucide-react';

const categories = [
    { id: 'all', name: 'Semua', icon: null },
    { id: 'alam', name: 'Alam', icon: Mountain },
    { id: 'budaya', name: 'Budaya', icon: Landmark },
    { id: 'kuliner', name: 'Kuliner', icon: Utensils },
    { id: 'petualangan', name: 'Petualangan', icon: Tent },
    { id: 'belanja', name: 'Belanja', icon: ShoppingBag },
];

interface CategoryFilterProps {
    activeCategory: string;
    onSelect: (id: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ activeCategory, onSelect }) => {
    return (
        <div className="w-full overflow-x-auto no-scrollbar py-2 pl-6 pr-6">
            <div className="flex gap-3">
                {categories.map((cat, index) => {
                    const Icon = cat.icon;
                    const isActive = activeCategory === cat.id;

                    return (
                        <motion.button
                            key={cat.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelect(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm border",
                                isActive
                                    ? "bg-white text-[#365594] border-white shadow-lg shadow-blue-900/20"
                                    : "bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20"
                            )}
                        >
                            {Icon && <Icon size={16} />}
                            {cat.name}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
