'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MapPin, Clock, DollarSign, Navigation, Star, Heart, Share2, Calendar } from 'lucide-react';
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
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);

  const allDayDestinations = itinerary.days.flatMap(day => day.destinations);

  const handleStartJourney = () => {
    setIsStarted(true);
  };

  // Journey Started View
  if (isStarted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-40 bg-white flex flex-col"
      >
        {/* Map with locations */}
        <div className="flex-1 relative">
          <MapView
            className="w-full h-full"
            center={[110.3695, -7.7956]}
            zoom={11}
            destinations={allDayDestinations}
            itineraryRoute={route}
          />

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsStarted(false)}
                className="p-2 bg-white rounded-full shadow-lg"
              >
                <ChevronLeft size={24} className="text-slate-800" />
              </button>
              <div className="bg-white px-4 py-2 rounded-full shadow-lg">
                <p className="text-sm font-bold">Day {itinerary.days[0]?.day}</p>
              </div>
              <button className="p-2 bg-white rounded-full shadow-lg">
                <Share2 size={20} className="text-slate-800" />
              </button>
            </div>
          </div>

          {/* Bottom Location Cards - Expandable */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl">
            <div className="p-6 space-y-4 max-h-[45vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {/* Current Location Header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">Your Route</h3>
                <span className="text-xs text-slate-600">{allDayDestinations.length} locations</span>
              </div>

              {/* Location List */}
              {allDayDestinations.map((dest, index) => (
                <motion.div
                  key={index}
                  layout
                  className="bg-slate-50 rounded-2xl overflow-hidden"
                >
                  {/* Location Header - Always Visible */}
                  <div
                    onClick={() => setExpandedLocation(expandedLocation === index ? null : index)}
                    className="p-4 cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm">{dest.name}</h4>
                      <p className="text-xs text-slate-600 truncate">{dest.address || dest.category}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {dest.rating && (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold text-slate-700">{dest.rating}</span>
                          </div>
                        )}
                        {dest.ticket_pricing?.adult && (
                          <span className="text-xs text-slate-600">
                            • Rp {dest.ticket_pricing.adult.toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                      <Navigation size={18} className="text-blue-500" />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedLocation === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* Description */}
                          {dest.descriptionClean && (
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {dest.descriptionClean.substring(0, 150)}...
                            </p>
                          )}

                          {/* Operating Hours */}
                          {dest.operating_hours && (
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Clock size={14} />
                              <span>
                                {dest.operating_hours.open || '08:00'} - {dest.operating_hours.close || '17:00'}
                              </span>
                            </div>
                          )}

                          {/* View Details Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDestination(dest);
                            }}
                            className="w-full py-2 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Popup */}
        <AnimatePresence>
          {selectedDestination && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDestination(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto"
              >
                {/* Image Header */}
                <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
                  {selectedDestination.imageUrl && (
                    <img
                      src={selectedDestination.imageUrl}
                      alt={selectedDestination.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => setSelectedDestination(null)}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedDestination.name}</h2>
                    {selectedDestination.address && (
                      <p className="text-sm text-slate-600 flex items-start gap-2">
                        <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                        <span>{selectedDestination.address}</span>
                      </p>
                    )}
                  </div>

                  {(selectedDestination.descriptionClean || selectedDestination.description) && (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedDestination.descriptionClean || selectedDestination.description}
                    </p>
                  )}

                  {selectedDestination.ticket_pricing && (
                    <div className="bg-blue-50 rounded-2xl p-4">
                      <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <DollarSign size={18} className="text-blue-600" />
                        Ticket Price
                      </h3>
                      <div className="space-y-1 text-sm">
                        {selectedDestination.ticket_pricing.adult && (
                          <div className="flex justify-between">
                            <span className="text-slate-700">Adult</span>
                            <span className="font-semibold">Rp {selectedDestination.ticket_pricing.adult.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${selectedDestination.latitude},${selectedDestination.longitude}`,
                        '_blank'
                      );
                    }}
                    className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full"
                  >
                    <Navigation size={18} className="mr-2" />
                    Open in Maps
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Result View - Clean Figma Design
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-gradient-to-b from-slate-50 to-white flex flex-col"
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-800" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Your Itinerary</h1>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Heart size={22} className="text-slate-600" />
          </button>
        </div>

        {/* Trip Info Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{itinerary.days.length} Days Trip</h2>
              <p className="text-sm text-slate-600">Yogyakarta Cultural Journey</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Calendar size={28} className="text-white" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <p className="text-xs text-slate-600">Places</p>
              <p className="text-lg font-bold text-slate-900">
                {itinerary.days.reduce((acc, day) => acc + day.destinations.length, 0)}
              </p>
            </div>

            {route && (
              <>
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Navigation size={18} className="text-green-600" />
                  </div>
                  <p className="text-xs text-slate-600">Distance</p>
                  <p className="text-lg font-bold text-slate-900">
                    {(route.routes?.[0]?.distance / 1000).toFixed(1)} km
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock size={18} className="text-orange-600" />
                  </div>
                  <p className="text-xs text-slate-600">Duration</p>
                  <p className="text-lg font-bold text-slate-900">
                    {Math.round(route.routes?.[0]?.duration / 60)} min
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Day Cards - Horizontal Scroll */}
      <div className="flex-1 px-6 pb-6 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Daily Plan</h3>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {itinerary.days.map((day, dayIndex) => (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: dayIndex * 0.1 }}
              className="flex-shrink-0 w-[320px]"
            >
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-full">
                {/* Day Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white">
                  <h4 className="text-lg font-bold">Day {day.day}</h4>
                  {day.date && <p className="text-sm opacity-90">{day.date}</p>}
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <MapPin size={14} />
                    <span>{day.destinations.length} destinations</span>
                  </div>
                </div>

                {/* Destinations */}
                <div className="p-5 space-y-3 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                  {day.destinations.map((dest, destIndex) => (
                    <div
                      key={destIndex}
                      onClick={() => setSelectedDestination(dest)}
                      className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {destIndex + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-900 text-sm">{dest.name}</h5>
                        <p className="text-xs text-slate-600 truncate">{dest.category}</p>
                        {dest.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold text-slate-700">{dest.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-white border-t border-slate-100">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 h-14 rounded-2xl border-2 border-slate-200 text-slate-800 font-semibold hover:bg-slate-50"
          >
            Edit Plan
          </Button>
          <Button
            onClick={handleStartJourney}
            className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/30"
          >
            <Navigation size={20} className="mr-2" />
            Start Journey
          </Button>
        </div>
      </div>

      {/* Detail Popup - Same as journey view */}
      <AnimatePresence>
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDestination(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {/* Image Header */}
              <div className="relative h-56 bg-gradient-to-br from-blue-400 to-blue-600">
                {selectedDestination.imageUrl ? (
                  <>
                    <img
                      src={selectedDestination.imageUrl}
                      alt={selectedDestination.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin size={64} className="text-white/30" />
                  </div>
                )}

                <button
                  onClick={() => setSelectedDestination(null)}
                  className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {selectedDestination.rating && (
                  <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white px-3 py-2 rounded-full shadow-lg">
                    <Star size={18} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-base font-bold text-slate-900">{selectedDestination.rating}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedDestination.name}
                  </h2>
                  {selectedDestination.address && (
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{selectedDestination.address}</span>
                    </p>
                  )}
                </div>

                {/* Category Badge */}
                {selectedDestination.category && (
                  <div className="inline-flex px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {selectedDestination.category}
                  </div>
                )}

                {/* Operating Hours */}
                {selectedDestination.operating_hours && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-slate-900">
                      <Clock size={18} />
                      <span className="font-semibold">Opening Hours</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">
                      {selectedDestination.operating_hours.open || '08:00'} - {selectedDestination.operating_hours.close || '17:00'}
                    </p>
                  </div>
                )}

                {/* Description */}
                {(selectedDestination.descriptionClean || selectedDestination.description) && (
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">About</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedDestination.descriptionClean || selectedDestination.description}
                    </p>
                  </div>
                )}

                {/* Ticket Pricing */}
                {selectedDestination.ticket_pricing && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <DollarSign size={20} className="text-blue-600" />
                      Ticket Price
                    </h3>
                    <div className="space-y-2">
                      {selectedDestination.ticket_pricing.adult && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Adult</span>
                          <span className="text-lg font-bold text-slate-900">
                            Rp {selectedDestination.ticket_pricing.adult.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      {selectedDestination.ticket_pricing.child && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Children</span>
                          <span className="text-lg font-bold text-slate-900">
                            Rp {selectedDestination.ticket_pricing.child.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      {selectedDestination.ticket_pricing.student && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-700">Student</span>
                          <span className="text-lg font-bold text-slate-900">
                            Rp {selectedDestination.ticket_pricing.student.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDestination(null)}
                    className="flex-1 h-12 rounded-2xl border-2 border-slate-200 font-semibold"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${selectedDestination.latitude},${selectedDestination.longitude}`,
                        '_blank'
                      );
                    }}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                  >
                    <Navigation size={18} className="mr-2" />
                    Navigate
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
