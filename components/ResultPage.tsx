'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Clock, DollarSign, Navigation, Star, ChevronDown, Wifi, AlertCircle, Accessibility, ParkingCircle, UtensilsCrossed, Camera } from 'lucide-react';
import { MapView } from '@/components/map/MapView';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Destination {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  category?: string;
  rating?: number;
  priceRange?: string;
  description?: string;
  descriptionClean?: string;
  imageUrl?: string;
  address?: string;
  facilities?: {
    wifi?: boolean;
    toilet?: boolean;
    accessibility?: boolean;
    parking?: boolean;
    restaurant?: boolean;
    photography?: boolean;
  };
  ticket_pricing?: {
    adult?: number;
    child?: number;
    student?: number;
  };
  operating_hours?: {
    open?: string;
    close?: string;
  };
}

interface ItineraryDay {
  day: number;
  date?: string;
  destinations: Destination[];
  activities?: string[];
}

interface ResultPageProps {
  itinerary: {
    days: ItineraryDay[];
    totalDistance?: number;
    estimatedTime?: number;
  };
  route?: any;
  destinations: Destination[];
  onBack: () => void;
  onStart: () => void;
}

export const ResultPage: React.FC<ResultPageProps> = ({
  itinerary,
  route,
  destinations,
  onBack,
  onStart
}) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const allDayDestinations = itinerary.days.flatMap(day => day.destinations);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-white flex flex-col"
    >
      {/* Map Background */}
      <div className="absolute inset-0">
        <MapView
          className="w-full h-full"
          center={[110.3695, -7.7956]}
          zoom={11}
          destinations={allDayDestinations}
          itineraryRoute={route}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Header - Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 p-6 flex items-center justify-between"
      >
        <button
          onClick={onBack}
          className="p-2 hover:bg-white/80 rounded-full transition-colors bg-white/60 backdrop-blur-sm"
        >
          <ChevronLeft size={24} className="text-slate-800" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800">Itinerary Kamu</h2>
          <p className="text-sm text-slate-600">{itinerary.days.length} hari</p>
        </div>

        <div className="w-10" />
      </motion.div>

      {/* Content - Itinerary Cards */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 z-20 flex flex-col">
        {/* Cards Container */}
        <div className="flex-1 overflow-hidden flex items-end">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full px-4 pb-4"
          >
            {/* Itinerary Days Scroll */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar">
                {itinerary.days.map((day, dayIndex) => (
                  <motion.div
                    key={dayIndex}
                    layout
                    className="snap-center flex-shrink-0 w-80"
                  >
                    <motion.div
                      layoutId={`card-${dayIndex}`}
                      onClick={() => setExpandedCard(expandedCard === dayIndex ? null : dayIndex)}
                      className={cn(
                        "bg-white rounded-3xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300",
                        expandedCard === dayIndex ? "ring-2 ring-blue-500" : "hover:shadow-xl"
                      )}
                    >
                      {/* Card Header */}
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900">Hari {day.day}</h3>
                            {day.date && <p className="text-sm text-slate-600">{day.date}</p>}
                          </div>
                          {expandedCard === dayIndex && (
                            <ChevronDown size={20} className="text-blue-500 transform rotate-180" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin size={16} />
                          <span className="font-medium">{day.destinations.length} destinasi</span>
                        </div>
                      </div>

                      {/* Destinations List */}
                      <div className={cn(
                        "p-6 space-y-4 overflow-y-auto",
                        expandedCard === dayIndex ? "max-h-96" : "max-h-48"
                      )}>
                        {day.destinations.map((dest, destIndex) => (
                          <motion.div
                            key={destIndex}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: destIndex * 0.1 }}
                            className="pb-4 border-b border-slate-100 last:border-0"
                          >
                            {/* Destination Info */}
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-slate-900 text-base">
                                    {destIndex + 1}. {dest.name}
                                  </h4>
                                  <p className="text-sm text-slate-600 mt-1">{dest.address || dest.category}</p>
                                </div>

                                {/* Rating */}
                                {dest.rating && (
                                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-semibold text-yellow-700">{dest.rating}</span>
                                  </div>
                                )}
                              </div>

                              {/* Description - Show only on expand */}
                              {expandedCard === dayIndex && dest.descriptionClean && (
                                <p className="text-sm text-slate-600 leading-relaxed mt-3 p-3 bg-slate-50 rounded-lg">
                                  {dest.descriptionClean.substring(0, 200)}...
                                </p>
                              )}

                              {/* Meta Info */}
                              <div className="flex flex-wrap gap-3 mt-3">
                                {dest.priceRange && (
                                  <div className="flex items-center gap-1 text-sm text-slate-700">
                                    <DollarSign size={14} />
                                    <span>{dest.priceRange}</span>
                                  </div>
                                )}
                                {dest.ticket_pricing?.adult && (
                                  <div className="flex items-center gap-1 text-sm text-slate-700">
                                    <DollarSign size={14} />
                                    <span>Rp {dest.ticket_pricing.adult.toLocaleString('id-ID')}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1 text-sm text-slate-700">
                                  <MapPin size={14} />
                                  <span>{dest.category || 'Destinasi'}</span>
                                </div>
                              </div>

                              {/* Facilities - Show only on expand */}
                              {expandedCard === dayIndex && dest.facilities && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                  <p className="text-xs font-semibold text-slate-700 mb-2 uppercase">Fasilitas</p>
                                  <div className="flex flex-wrap gap-2">
                                    {dest.facilities.wifi && (
                                      <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                        <Wifi size={12} />
                                        <span>WiFi</span>
                                      </div>
                                    )}
                                    {dest.facilities.toilet && (
                                      <div className="flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                                        <AlertCircle size={12} />
                                        <span>WC</span>
                                      </div>
                                    )}
                                    {dest.facilities.accessibility && (
                                      <div className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                                        <Accessibility size={12} />
                                        <span>Aksesibel</span>
                                      </div>
                                    )}
                                    {dest.facilities.parking && (
                                      <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs">
                                        <ParkingCircle size={12} />
                                        <span>Parkir</span>
                                      </div>
                                    )}
                                    {dest.facilities.restaurant && (
                                      <div className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs">
                                        <UtensilsCrossed size={12} />
                                        <span>Restoran</span>
                                      </div>
                                    )}
                                    {dest.facilities.photography && (
                                      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs">
                                        <Camera size={12} />
                                        <span>Foto</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-4">
                        {route && (
                          <div className="text-sm">
                            <p className="text-slate-600">Total Jarak</p>
                            <p className="font-bold text-slate-900">
                              {(route.routes?.[0]?.distance / 1000).toFixed(1)} km
                            </p>
                          </div>
                        )}
                        {route && (
                          <div className="text-sm">
                            <p className="text-slate-600">Durasi</p>
                            <p className="font-bold text-slate-900">
                              {Math.round(route.routes?.[0]?.duration / 60)} menit
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Scroll Indicator */}
              <div className="absolute bottom-0 right-0 text-xs text-slate-500 font-medium">
                Scroll →
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-6 bg-white border-t border-slate-200 flex gap-4"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1 border-2 border-slate-300 text-slate-800 font-semibold h-12 rounded-full"
          >
            Ubah
          </Button>
          <Button
            size="lg"
            onClick={onStart}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold h-12 rounded-full flex items-center justify-center gap-2"
          >
            <Navigation size={18} />
            Mulai
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};
