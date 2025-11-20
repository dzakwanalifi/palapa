'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateTripPlan, saveItinerary } from '@/app/actions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'options';
  options?: string[];
}

interface TripData {
  destination?: string;
  duration?: number;
  budget?: number;
  transport?: string;
  preferences?: string[];
}

interface PalapaBotChatProps {
  onBack: () => void;
  onItineraryGenerated: (itinerary: any) => void;
}

export const PalapaBotChat: React.FC<PalapaBotChatProps> = ({ onBack, onItineraryGenerated }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Halo! 👋 Saya Palapa, asisten perjalanan virtualmu. Mau liburan ke mana kita hari ini?',
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'destination' | 'duration' | 'budget' | 'transport' | 'preferences' | 'generating'>('destination');
  const [tripData, setTripData] = useState<TripData>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    await processStep(text);
  };

  const processStep = async (input: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));

    let nextMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
    let nextStep = step;

    switch (step) {
      case 'destination':
        setTripData(prev => ({ ...prev, destination: input }));
        nextMessage.content = `Oke, ${input} adalah pilihan yang bagus! 🌴 Berapa hari rencananya kamu mau liburan di sana?`;
        nextStep = 'duration';
        break;

      case 'duration':
        const days = parseInt(input.replace(/\D/g, '')) || 3;
        setTripData(prev => ({ ...prev, duration: days }));
        nextMessage.content = `Siap, ${days} hari! ⏱️ Kira-kira berapa budget yang kamu siapkan? (Contoh: 5000000)`;
        nextStep = 'budget';
        break;

      case 'budget':
        const budget = parseInt(input.replace(/\D/g, '')) || 1000000;
        setTripData(prev => ({ ...prev, budget }));
        nextMessage.content = 'Bagus! 💰 Kamu lebih suka naik apa selama di sana?';
        nextMessage.options = ['🚗 Mobil Pribadi', '🚌 Transportasi Umum', '🏍️ Sewa Motor', '🚶 Jalan Kaki'];
        nextMessage.type = 'options';
        nextStep = 'transport';
        break;

      case 'transport':
        setTripData(prev => ({ ...prev, transport: input }));
        nextMessage.content = 'Sempurna! Terakhir, ada preferensi khusus?';
        nextMessage.options = ['🌿 Alam & Pemandangan', '🏛️ Budaya & Sejarah', '🍜 Kuliner', '🛍️ Belanja', '✨ Campur Saja'];
        nextMessage.type = 'options';
        nextStep = 'preferences';
        break;

      case 'preferences':
        setTripData(prev => ({ ...prev, preferences: [input] }));
        nextMessage.content = '✨ Terima kasih! Tunggu sebentar ya, Palapa sedang menyusun itinerary terbaik buat kamu...';
        nextStep = 'generating';
        setMessages(prev => [...prev, nextMessage]);

        generateItinerary({ ...tripData, preferences: [input] });
        return;
    }

    setStep(nextStep);
    setMessages(prev => [...prev, nextMessage]);
    setIsLoading(false);
  };

  const generateItinerary = async (finalData: TripData) => {
    try {
      const request: any = {
        budget: finalData.budget || 1000000,
        duration_days: finalData.duration || 3,
        preferred_categories: finalData.preferences || ['general'],
        provinsi: finalData.destination || 'Indonesia',
      };

      if (finalData.transport) {
        request.transport_mode = finalData.transport;
      }

      const result = await generateTripPlan(request);

      if (result.success && result.data) {
        const saveResult = await saveItinerary(result.data);

        const doneMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '🎉 Itinerary kamu sudah siap! Silakan cek peta dan detail di bawah ini.',
          type: 'text'
        };
        setMessages(prev => [...prev, doneMsg]);
        onItineraryGenerated(result.data);

        if (!saveResult.success) {
          console.warn('Failed to save itinerary:', saveResult.error);
        }
      } else {
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '😓 Maaf, ada kendala saat menyusun itinerary. Bisa kita coba lagi?',
          type: 'text'
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-slate-800" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Palapa Assistant</h3>
            <p className="text-xs text-green-600 font-medium">🟢 Always Active</p>
          </div>
        </div>

        <div className="w-10" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-2xl",
              msg.role === 'user' && "ml-auto flex-row-reverse"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user'
                ? "bg-blue-500"
                : "bg-slate-100"
            )}>
              {msg.role === 'user' ? (
                <span className="text-white font-bold text-sm">U</span>
              ) : (
                <Bot size={20} className="text-slate-700" />
              )}
            </div>

            {/* Message Content */}
            <div className="space-y-3">
              <div className={cn(
                "px-5 py-4 rounded-3xl text-base leading-relaxed shadow-sm",
                msg.role === 'user'
                  ? "bg-blue-500 text-white rounded-tr-none"
                  : "bg-slate-100 text-slate-900 rounded-tl-none"
              )}>
                {msg.content}
              </div>

              {/* Options */}
              {msg.type === 'options' && msg.options && (
                <div className="flex flex-wrap gap-2 pl-14">
                  {msg.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSendMessage(opt)}
                      disabled={isLoading}
                      className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-800 text-sm font-medium rounded-full hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-2xl"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot size={20} className="text-slate-700" />
            </div>
            <div className="px-5 py-4 rounded-3xl rounded-tl-none bg-slate-100">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-200">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Ketik pesan..."
            disabled={isLoading || step === 'generating'}
            className="flex-1 px-5 py-3 border-2 border-slate-300 rounded-full focus:border-blue-500 focus:ring-0"
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim() || step === 'generating'}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
