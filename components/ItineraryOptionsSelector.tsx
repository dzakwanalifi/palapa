'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mountain, Coffee, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ItineraryOption {
  id: string;
  theme: 'cultural' | 'balanced' | 'relaxed';
  title: string;
  description: string;
  highlights: string[];
  itineraryData: any;
}

interface ItineraryOptionsSelectorProps {
  options: ItineraryOption[];
  onSelect: (option: ItineraryOption) => void;
  onRegenerate: () => void;
}

export const ItineraryOptionsSelector: React.FC<ItineraryOptionsSelectorProps> = ({
  options,
  onSelect,
  onRegenerate
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'cultural':
        return <Mountain size={24} className="text-[#8B5CF6]" />;
      case 'balanced':
        return <Sparkles size={24} className="text-[#0070F0]" />;
      case 'relaxed':
        return <Coffee size={24} className="text-[#10B981]" />;
      default:
        return <Sparkles size={24} className="text-[#0070F0]" />;
    }
  };

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'cultural':
        return 'from-purple-500 to-purple-600';
      case 'balanced':
        return 'from-blue-500 to-blue-600';
      case 'relaxed':
        return 'from-green-500 to-green-600';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  const getThemeBorder = (theme: string) => {
    switch (theme) {
      case 'cultural':
        return 'border-purple-200';
      case 'balanced':
        return 'border-blue-200';
      case 'relaxed':
        return 'border-green-200';
      default:
        return 'border-blue-200';
    }
  };

  const handleSelect = (option: ItineraryOption) => {
    setSelectedId(option.id);
    setTimeout(() => {
      onSelect(option);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-[#1D1D1D]">Pilih Gaya Perjalanan Anda</h3>
        <p className="text-sm text-[#5F6265]">
          Kami menyiapkan {options.length} pilihan itinerary sesuai preferensi Anda
        </p>
      </div>

      {/* Options Grid */}
      <div className="space-y-4">
        {options.map((option) => (
          <motion.div
            key={option.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              relative bg-white rounded-3xl border-2 overflow-hidden cursor-pointer
              transition-all duration-300
              ${selectedId === option.id ? 'border-[#0070F0] shadow-lg' : `${getThemeBorder(option.theme)} hover:shadow-md`}
            `}
            onClick={() => handleSelect(option)}
          >
            {/* Gradient Header */}
            <div className={`h-20 bg-gradient-to-r ${getThemeColor(option.theme)} flex items-center justify-between px-6`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {getThemeIcon(option.theme)}
                </div>
                <div>
                  <h4 className="text-white font-bold text-base">{option.title}</h4>
                  <p className="text-white/80 text-xs">{option.theme.toUpperCase()}</p>
                </div>
              </div>
              <ChevronRight size={24} className="text-white/60" />
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#5F6265] leading-relaxed">
                {option.description}
              </p>

              {/* Highlights */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#72777A] uppercase tracking-wide">Highlights</p>
                <ul className="space-y-2">
                  {option.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#303437]">
                      <span className="text-[#0070F0] mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Selected Indicator */}
            <AnimatePresence>
              {selectedId === option.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#0070F0] flex items-center justify-center"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13.3337 4L6.00033 11.3333L2.66699 8"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Regenerate Button */}
      <Button
        onClick={onRegenerate}
        variant="outline"
        className="w-full h-12 rounded-full border-2 border-[#DFE0E0] bg-white text-[#303437] hover:bg-[#F2F4F5] font-semibold"
      >
        <Sparkles size={18} className="mr-2" />
        Generate Opsi Lainnya
      </Button>
    </motion.div>
  );
};
