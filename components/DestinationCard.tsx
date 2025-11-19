'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, Star } from 'lucide-react';

interface DestinationCardProps {
    name: string;
    location: string;
    rating: number;
    image: string;
    price: string;
    category: string;
    onClick?: () => void;
}

export const DestinationCard: React.FC<DestinationCardProps> = ({
    name,
    location,
    rating,
    image,
    price,
    category,
    onClick
}) => {
    return (
        <Card
            className="min-w-[280px] w-[280px] p-3 bg-white/95 backdrop-blur-xl border-white/40 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
            onClick={onClick}
        >
            <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3">
                {/* Fallback image if next/image fails or for demo */}
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                <img
                    src={image}
                    alt={name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-bold text-orange-500 shadow-sm">
                    <Star size={12} fill="currentColor" />
                    {rating}
                </div>
                <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-medium text-white uppercase tracking-wider">
                    {category}
                </div>
            </div>

            <div className="px-1">
                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1 line-clamp-1">{name}</h3>
                <div className="flex items-center gap-1 text-slate-500 text-xs mb-3">
                    <MapPin size={12} />
                    <span className="truncate">{location}</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-400">Mulai dari</div>
                    <div className="font-bold text-[#365594]">{price}</div>
                </div>
            </div>
        </Card>
    );
};
