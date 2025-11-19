'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Clock, Wallet, Edit2, Play, ChevronDown, Wifi, Accessibility, Bath } from 'lucide-react';

interface ItineraryViewProps {
    itinerary: any;
    onClose: () => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ itinerary, onClose }) => {
    const [expandedDescription, setExpandedDescription] = useState<Record<number, boolean>>({});

    if (!itinerary) return null;

    const firstDestination = itinerary.days?.[0]?.destinations?.[0];
    const firstImageUrl = firstDestination?.imageUrl || itinerary.geminiResponse?.imageUrl;

    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-40 bg-white flex flex-col pt-[80px] pb-[90px]"
        >
            {/* Top Image Section */}
            {firstImageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                    <img
                        src={firstImageUrl}
                        alt="destination"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Destination Header */}
            {firstDestination && (
                <div className="px-6 py-6 bg-white border-b border-slate-100">
                    <h1 className="text-2xl font-bold text-[#02131B] mb-2">{firstDestination.name}</h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                            <span className="text-lg font-bold text-[#606060]">4.8</span>
                            <span className="text-yellow-400">★</span>
                        </div>
                        <span className="text-xs text-[#606060]">(1355 Reviews)</span>
                    </div>

                    {/* Details Row */}
                    <div className="flex gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F2F8FF]">
                            <span className="text-xs text-[#3A544F] font-medium">📍 {firstDestination.category || 'Outdoor'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F2F8FF]">
                            <Clock size={14} className="text-[#3A544F]" />
                            <span className="text-xs text-[#3A544F] font-medium">{firstDestination.estimated_time || 2} Jam</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#F2F8FF]">
                            <Wallet size={14} className="text-[#3A544F]" />
                            <span className="text-xs text-[#3A544F] font-medium">Rp {firstDestination.estimated_cost?.toLocaleString?.('id-ID') || '350.000'}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {itinerary.days?.map((day: any, index: number) => (
                    <div key={index} className="relative pl-8 border-l-2 border-slate-200 last:border-l-0">
                        {/* Day Marker */}
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#365594] ring-4 ring-blue-50" />

                        <h3 className="text-lg font-bold text-slate-800 mb-4">Hari ke-{day.day}</h3>

                        <div className="space-y-4">
                            {day.destinations?.map((dest: any, dIndex: number) => (
                                <div key={dIndex} className="space-y-4">
                                    {/* Description Section */}
                                    <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                        <p className="text-sm text-[#3A544F] leading-relaxed mb-2">
                                            {expandedDescription[dIndex] ? dest.description : (dest.description?.substring(0, 120) + '...' || '')}
                                        </p>
                                        {dest.description?.length > 120 && (
                                            <button
                                                onClick={() => setExpandedDescription(prev => ({ ...prev, [dIndex]: !prev[dIndex] }))}
                                                className="flex items-center gap-2 text-sm font-bold text-[#3B69CC] hover:text-blue-800 transition-colors"
                                            >
                                                Read more <ChevronDown size={16} className={expandedDescription[dIndex] ? 'rotate-180' : ''} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Facilities Section */}
                                    {(dest.facilities || true) && (
                                        <div className="bg-white rounded-2xl p-5 border border-slate-100">
                                            <h4 className="text-sm font-bold text-[#232323] mb-4">Facilities</h4>
                                            <div className="flex gap-3 flex-wrap">
                                                {/* WiFi */}
                                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500">
                                                    <Wifi size={20} className="text-white" />
                                                    <span className="text-[10px] text-white font-medium">Public</span>
                                                </div>

                                                {/* Accessibility */}
                                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500">
                                                    <Accessibility size={20} className="text-white" />
                                                    <span className="text-[10px] text-white font-medium">Accessibility</span>
                                                </div>

                                                {/* Toilet */}
                                                <div className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-500">
                                                    <Bath size={20} className="text-white" />
                                                    <span className="text-[10px] text-white font-medium">Toilet</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="fixed bottom-20 left-0 right-0 px-6 py-3 bg-white border-t border-slate-100 space-y-2">
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => alert('Menyimpan lokasi - Coming soon')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-[#00B76E] font-semibold rounded-lg hover:bg-green-50 transition-colors text-sm"
                >
                    <span>🔖</span>
                    Simpan Lokasi
                </motion.button>

                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => alert('Edit itinerary - Coming soon')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#365594] text-[#365594] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        <Edit2 size={18} />
                        Sesuaikan
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => alert('Mulai perjalanan - Akan membuka Maps/GPS')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#365594] text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Play size={18} />
                        Mulai Perjalanan
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
