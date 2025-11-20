'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ItineraryService } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import type { Itinerary } from '@/types';

interface CollectionsPageProps {
    onBack: () => void;
    onSelectItinerary: (itinerary: any) => void;
}

export const CollectionsPage: React.FC<CollectionsPageProps> = ({ onBack, onSelectItinerary }) => {
    const { userId, loading: authLoading } = useAuth();
    const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadItineraries = async () => {
            try {
                setLoading(true);
                if (!userId) {
                    setError('Silakan login untuk melihat koleksi');
                    return;
                }
                const itineraries = await ItineraryService.getByUserId(userId);
                setSavedItineraries(itineraries);
            } catch (err) {
                console.error('Error loading itineraries:', err);
                setError('Gagal memuat koleksi');
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) {
            loadItineraries();
        }
    }, [userId, authLoading]);

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 z-40 bg-slate-50 flex flex-col"
        >
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-800" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Koleksi Saya</h1>
                        <p className="text-xs text-slate-500">Rencana perjalanan tersimpan</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin w-8 h-8 border-4 border-[#365594] border-t-transparent rounded-full" />
                    </div>
                ) : error ? (
                    <div className="flex justify-center py-10">
                        <p className="text-slate-500">{error}</p>
                    </div>
                ) : savedItineraries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Bookmark size={48} className="text-slate-300 mb-4" />
                        <p className="text-slate-500 text-center">Belum ada rencana perjalanan tersimpan</p>
                        <p className="text-xs text-slate-400 mt-2">Generate itinerary baru dari Palapa Bot</p>
                    </div>
                ) : (
                    savedItineraries.map((item) => (
                        <div
                            key={item.id}
                            className="flex gap-4 p-4 bg-white rounded-2xl border border-[#DFE0E0] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onSelectItinerary(item)}
                        >
                            {/* Image Thumbnail */}
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-300 to-blue-500 flex-shrink-0 overflow-hidden">
                                {item.geminiResponse?.imageUrl ? (
                                    <img src={item.geminiResponse.imageUrl} alt={item.id} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Map size={24} className="text-white/60" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="font-medium text-sm text-[#1D1D1D]">
                                        {item.destinations?.[0]?.name || 'Perjalanan'}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-[#5F6265]">
                                        <span>{item.destinations?.[0]?.category || 'Wisata'}</span>
                                        <span className="w-1 h-1 rounded-full bg-[#CDCFD0]" />
                                        <span>Rp {item.totalBudget?.toLocaleString?.('id-ID') || '0'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Days Badge */}
                            <div className="flex-shrink-0 text-right">
                                <p className="font-semibold text-sm text-[#006BE5]">{item.durationDays} Hari</p>
                                <p className="text-xs text-[#5F6265] mt-0.5">
                                    {item.destinations?.length || 0} Destinasi
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};
