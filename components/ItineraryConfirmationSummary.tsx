'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Wallet, Heart, Edit2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TripData {
  destination?: string;
  duration?: number;
  budget?: number;
  preferences?: string[];
  transport?: string;
}

interface ItineraryConfirmationSummaryProps {
  tripData: TripData;
  onEdit: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ItineraryConfirmationSummary: React.FC<ItineraryConfirmationSummaryProps> = ({
  tripData,
  onEdit,
  onConfirm,
  isLoading = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-[#DFE0E0] shadow-lg p-6 space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-[#1D1D1D]">Konfirmasi Rencana Perjalanan</h3>
        <p className="text-sm text-[#5F6265]">
          Periksa detail perjalanan Anda sebelum kami buatkan itinerary
        </p>
      </div>

      {/* Trip Details Grid */}
      <div className="space-y-4">
        {/* Destination */}
        {tripData.destination && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin size={20} className="text-[#0070F0]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-[#72777A] uppercase tracking-wide">Destinasi</p>
              <p className="text-base font-semibold text-[#1D1D1D] mt-1">{tripData.destination}</p>
            </div>
          </div>
        )}

        {/* Duration */}
        {tripData.duration && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-[#10B981]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-[#72777A] uppercase tracking-wide">Durasi</p>
              <p className="text-base font-semibold text-[#1D1D1D] mt-1">{tripData.duration} Hari</p>
            </div>
          </div>
        )}

        {/* Budget */}
        {tripData.budget && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
              <Wallet size={20} className="text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-[#72777A] uppercase tracking-wide">Budget</p>
              <p className="text-base font-semibold text-[#1D1D1D] mt-1">
                Rp {tripData.budget?.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        )}

        {/* Preferences */}
        {tripData.preferences && tripData.preferences.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-[#EC4899]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-[#72777A] uppercase tracking-wide">Preferensi</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {tripData.preferences.map((pref, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#F2F4F5] text-[#303437] text-xs font-medium rounded-full"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transport Mode */}
        {tripData.transport && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#8B5CF6]">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-[#72777A] uppercase tracking-wide">Transportasi</p>
              <p className="text-base font-semibold text-[#1D1D1D] mt-1">{tripData.transport}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={onEdit}
          variant="outline"
          className="flex-1 h-12 rounded-full border-2 border-[#DFE0E0] bg-white text-[#303437] hover:bg-[#F2F4F5] font-semibold"
        >
          <Edit2 size={18} className="mr-2" />
          Edit
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 h-12 rounded-full bg-[#0070F0] hover:bg-[#0060D0] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center overflow-hidden"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="whitespace-nowrap">Membuat...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="flex-shrink-0" />
              <span className="whitespace-nowrap">Buat Itinerary</span>
            </div>
          )}
        </Button>
      </div>
    </motion.div>
  );
};
