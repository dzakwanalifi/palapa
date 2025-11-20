'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Plus, Clock, MapPin, DollarSign, Info, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Activity {
  id: string;
  name: string;
  time: string;
  duration: string;
  cost: number;
  location: string;
  rationale?: string;
  openingHours?: string;
  tips?: string;
}

interface DayPlan {
  day: number;
  activities: Activity[];
}

interface ItineraryPreviewEditorProps {
  itineraryData: any;
  onSave: (editedData: any) => void;
  onCancel: () => void;
}

export const ItineraryPreviewEditor: React.FC<ItineraryPreviewEditorProps> = ({
  itineraryData,
  onSave,
  onCancel
}) => {
  const [days, setDays] = useState<DayPlan[]>(() => {
    // Convert itineraryData to editable format
    return itineraryData.days?.map((day: any, idx: number) => ({
      day: idx + 1,
      activities: day.destinations?.map((dest: any, actIdx: number) => ({
        id: `${idx}-${actIdx}`,
        name: dest.name || 'Aktivitas',
        time: '09:00',
        duration: '2 jam',
        cost: dest.estimatedCost || 0,
        location: dest.location || dest.provinsi || '',
        rationale: dest.rationale || '',
        openingHours: dest.openingHours || '08:00 - 17:00',
        tips: dest.tips || ''
      })) || []
    })) || [];
  });

  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  const handleDeleteActivity = (dayIdx: number, activityId: string) => {
    setDays(prev => {
      const newDays = [...prev];
      newDays[dayIdx].activities = newDays[dayIdx].activities.filter(a => a.id !== activityId);
      return newDays;
    });
  };

  const handleEditActivity = (dayIdx: number, activityId: string, field: string, value: any) => {
    setDays(prev => {
      const newDays = [...prev];
      const activity = newDays[dayIdx].activities.find(a => a.id === activityId);
      if (activity) {
        (activity as any)[field] = value;
      }
      return newDays;
    });
  };

  const handleSave = () => {
    // Convert back to itinerary format
    const editedItinerary = {
      ...itineraryData,
      days: days.map(day => ({
        day: day.day,
        destinations: day.activities.map(activity => ({
          name: activity.name,
          location: activity.location,
          estimatedCost: activity.cost,
          rationale: activity.rationale,
          openingHours: activity.openingHours,
          tips: activity.tips
        }))
      }))
    };
    onSave(editedItinerary);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-[#DFE0E0]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1D1D1D]">Edit Itinerary</h2>
            <p className="text-xs text-[#5F6265] mt-1">Sesuaikan rencana perjalanan Anda</p>
          </div>
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100"
          >
            <X size={24} className="text-[#72777A]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {days.map((day, dayIdx) => (
          <div key={day.day} className="space-y-4">
            {/* Day Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0070F0] flex items-center justify-center">
                <span className="text-white font-bold text-sm">D{day.day}</span>
              </div>
              <h3 className="text-lg font-bold text-[#1D1D1D]">Hari {day.day}</h3>
            </div>

            {/* Activities */}
            <div className="space-y-3">
              {day.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-2xl border-2 border-[#DFE0E0] overflow-hidden"
                >
                  {/* Activity Header */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex-1">
                      {editingActivity === activity.id ? (
                        <Input
                          value={activity.name}
                          onChange={(e) => handleEditActivity(dayIdx, activity.id, 'name', e.target.value)}
                          className="font-semibold text-[#1D1D1D] mb-2"
                        />
                      ) : (
                        <h4 className="font-semibold text-[#1D1D1D] mb-2">{activity.name}</h4>
                      )}

                      <div className="flex flex-wrap gap-3 text-xs text-[#5F6265]">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{activity.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          <span>{activity.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} />
                          <span>Rp {activity.cost.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (editingActivity === activity.id) {
                            setEditingActivity(null);
                          } else {
                            setEditingActivity(activity.id);
                          }
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-50"
                      >
                        {editingActivity === activity.id ? (
                          <Save size={16} className="text-[#0070F0]" />
                        ) : (
                          <Edit2 size={16} className="text-[#0070F0]" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(dayIdx, activity.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50"
                      >
                        <Trash2 size={16} className="text-[#EF4444]" />
                      </button>
                      <button
                        onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50"
                      >
                        <Info size={16} className="text-[#72777A]" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedActivity === activity.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#DFE0E0] bg-[#F9FAFB] p-4 space-y-3"
                    >
                      {/* Rationale */}
                      {activity.rationale && (
                        <div>
                          <p className="text-xs font-semibold text-[#72777A] uppercase tracking-wide mb-1">
                            Mengapa Kami Rekomendasikan
                          </p>
                          <p className="text-sm text-[#303437]">{activity.rationale}</p>
                        </div>
                      )}

                      {/* Opening Hours */}
                      {activity.openingHours && (
                        <div>
                          <p className="text-xs font-semibold text-[#72777A] uppercase tracking-wide mb-1">
                            Jam Operasional
                          </p>
                          <p className="text-sm text-[#303437]">{activity.openingHours}</p>
                        </div>
                      )}

                      {/* Tips */}
                      {activity.tips && (
                        <div>
                          <p className="text-xs font-semibold text-[#72777A] uppercase tracking-wide mb-1">
                            Tips
                          </p>
                          <p className="text-sm text-[#303437]">{activity.tips}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-white border-t border-[#DFE0E0] space-y-3">
        <Button
          onClick={handleSave}
          className="w-full h-12 rounded-full bg-[#0070F0] hover:bg-[#0060D0] text-white font-semibold"
        >
          <Save size={18} className="mr-2" />
          Simpan & Lanjutkan
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full h-12 rounded-full border-2 border-[#DFE0E0] bg-white text-[#303437] hover:bg-[#F2F4F5] font-semibold"
        >
          Batalkan
        </Button>
      </div>
    </motion.div>
  );
};
