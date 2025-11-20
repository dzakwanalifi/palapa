'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { DestinationCard } from '@/components/DestinationCard';
import { UMKMService, DestinationService, LocalGuideService } from '@/lib/firestore';
import type { UMKM, Destination, LocalGuide } from '@/types';

interface GenericListPageProps {
    type: 'umkm' | 'heritage' | 'guides';
    onBack: () => void;
}

type ListItem = UMKM | Destination | LocalGuide;

export const GenericListPage: React.FC<GenericListPageProps> = ({ type, onBack }) => {
    const [items, setItems] = useState<ListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const config = {
        umkm: {
            title: 'UMKM Center',
            subtitle: 'Oleh-oleh dan Kerajinan Lokal',
            fetch: () => UMKMService.getAll(),
        },
        heritage: {
            title: 'Heritage & Budaya',
            subtitle: 'Situs Bersejarah dan Budaya',
            fetch: () => DestinationService.getCultural(),
        },
        guides: {
            title: 'Local Guide',
            subtitle: 'Pemandu Lokal Berpengalaman',
            fetch: () => LocalGuideService.getAll(),
        }
    }[type];

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await config.fetch();
                setItems(data);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [type]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItem = (item: ListItem, index: number) => {
        // Normalize data for display
        let displayData = {
            name: item.name,
            location: 'Indonesia',
            rating: 4.5,
            image: 'https://images.unsplash.com/photo-1555899434-94d1368d7dd6?q=80&w=1000&auto=format&fit=crop',
            price: 'Gratis',
            category: 'Umum'
        };

        if ('kotaKabupaten' in item) { // Destination
            displayData.location = item.kotaKabupaten || item.provinsi || 'Indonesia';
            displayData.rating = item.rating;
            displayData.image = item.imageUrl;
            displayData.price = item.priceRange;
            displayData.category = item.category;
        } else if ('verified' in item && !('pricePerDay' in item)) { // UMKM
            displayData.location = item.address;
            displayData.category = item.category;
            displayData.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`;
            displayData.price = 'Bervariasi';
        } else if ('pricePerDay' in item) { // LocalGuide
            const guide = item as LocalGuide;
            displayData.location = guide.location;
            displayData.rating = guide.rating;
            displayData.image = guide.imageUrl;
            displayData.price = `Rp ${guide.pricePerDay.toLocaleString()}/hari`;
            displayData.category = 'Local Guide';
        }

        return (
            <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
            >
                {type === 'guides' && 'languages' in item ? (
                    // Special card for guides
                    <Card className="p-4 flex gap-4 items-center hover:shadow-md transition-shadow cursor-pointer bg-white/80 backdrop-blur-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                            <img src={displayData.image} alt={displayData.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{displayData.name}</h3>
                            <p className="text-xs text-slate-500 mb-1 truncate">{displayData.location}</p>
                            <div className="flex gap-1 flex-wrap">
                                {(item as LocalGuide).languages?.map((lang: string) => (
                                    <span key={lang} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{lang}</span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="font-bold text-[#365594] text-sm">★ {displayData.rating}</div>
                            <p className="text-[10px] text-slate-400">/hari</p>
                        </div>
                    </Card>
                ) : (
                    <DestinationCard
                        name={displayData.name}
                        location={displayData.location}
                        rating={displayData.rating}
                        image={displayData.image}
                        price={displayData.price}
                        category={displayData.category}
                    />
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 z-40 bg-slate-50 flex flex-col"
        >
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 shadow-sm z-10">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-800" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{config.title}</h1>
                        <p className="text-xs text-slate-500">{config.subtitle}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Cari di ${config.title}...`}
                        className="pl-11 bg-slate-50 border-slate-200"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin w-8 h-8 border-4 border-[#365594] border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                        {filteredItems.map((item, index) => renderItem(item, index))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
