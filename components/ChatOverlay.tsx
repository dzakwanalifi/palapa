'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateTripPlan, saveItinerary } from '@/app/actions';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'text' | 'options' | 'itinerary';
    options?: string[];
}

interface TripData {
    destination?: string;
    duration?: number;
    budget?: number;
    transport?: string;
    preferences?: string[];
}

interface ChatOverlayProps {
    onItineraryGenerated: (itinerary: any) => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ onItineraryGenerated }) => {
    const [isOpen, setIsOpen] = useState(true); // Start open for onboarding
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Halo! Saya Palapa, asisten perjalanan virtualmu. Mau liburan ke mana kita hari ini?',
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

        // Add user message
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        // Process based on current step
        await processStep(text);
    };

    const processStep = async (input: string) => {
        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        let nextMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
        let nextStep = step;

        switch (step) {
            case 'destination':
                setTripData(prev => ({ ...prev, destination: input }));
                nextMessage.content = `Oke, ${input} adalah pilihan yang bagus! Berapa hari rencananya kamu mau liburan di sana?`;
                nextStep = 'duration';
                break;

            case 'duration':
                const days = parseInt(input.replace(/\D/g, '')) || 3; // Default to 3 if parse fails
                setTripData(prev => ({ ...prev, duration: days }));
                nextMessage.content = `Siap, ${days} hari. Kira-kira berapa budget yang kamu siapkan untuk perjalanan ini? (Contoh: 5000000)`;
                nextStep = 'budget';
                break;

            case 'budget':
                const budget = parseInt(input.replace(/\D/g, '')) || 1000000;
                setTripData(prev => ({ ...prev, budget }));
                nextMessage.content = 'Oke. Kamu lebih suka naik apa selama di sana?';
                nextMessage.options = ['Mobil Pribadi', 'Transportasi Umum', 'Sewa Motor', 'Jalan Kaki'];
                nextMessage.type = 'options';
                nextStep = 'transport';
                break;

            case 'transport':
                setTripData(prev => ({ ...prev, transport: input }));
                nextMessage.content = 'Terakhir, ada preferensi khusus? Misal suka alam, budaya, atau kuliner?';
                nextMessage.options = ['Alam & Pemandangan', 'Budaya & Sejarah', 'Kuliner', 'Belanja', 'Campur Saja'];
                nextMessage.type = 'options';
                nextStep = 'preferences';
                break;

            case 'preferences':
                setTripData(prev => ({ ...prev, preferences: [input] }));
                nextMessage.content = 'Terima kasih! Tunggu sebentar ya, Palapa sedang menyusun itinerary terbaik buat kamu...';
                nextStep = 'generating';
                setMessages(prev => [...prev, nextMessage]);

                // Trigger Generation
                generateItinerary({ ...tripData, preferences: [input] });
                return; // Exit here to handle generation async
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
                // Save itinerary to Firebase
                const saveResult = await saveItinerary(result.data);

                const doneMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Hore! Itinerary kamu sudah siap. Silakan cek peta dan detail di bawah ini. (Disimpan ke Koleksi Saya)',
                    type: 'text'
                };
                setMessages(prev => [...prev, doneMsg]);
                onItineraryGenerated(result.data);
                setIsOpen(false); // Minimize chat after generation

                if (!saveResult.success) {
                    console.warn('Failed to save itinerary to Firebase:', saveResult.error);
                }
            } else {
                const errorMsg: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: 'Maaf, ada kendala saat menyusun itinerary. Bisa kita coba lagi?',
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
        <>
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-[#365594] rounded-full shadow-xl flex items-center justify-center text-white hover:bg-[#2a447a] transition-colors"
                    >
                        <Bot size={28} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        className="fixed inset-x-0 bottom-0 z-50 md:right-6 md:left-auto md:bottom-24 md:w-[400px] h-[80vh] md:h-[600px] bg-white md:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="p-4 bg-[#365594] text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Bot size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold">Palapa Assistant</h3>
                                    <p className="text-xs text-blue-100">Online • Siap membantu</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                        msg.role === 'user' ? "bg-slate-200" : "bg-[#365594]"
                                    )}>
                                        {msg.role === 'user' ? <User size={16} className="text-slate-600" /> : <Bot size={16} className="text-white" />}
                                    </div>

                                    <div className="space-y-2">
                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm shadow-sm",
                                            msg.role === 'user'
                                                ? "bg-[#365594] text-white rounded-tr-none"
                                                : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                                        )}>
                                            {msg.content}
                                        </div>

                                        {/* Options Buttons */}
                                        {msg.type === 'options' && msg.options && (
                                            <div className="flex flex-wrap gap-2">
                                                {msg.options.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => handleSendMessage(opt)}
                                                        className="px-3 py-2 bg-[#F5F3C0] border border-[#F5F3C0] text-[#1A1A1A] text-xs font-semibold rounded-2xl hover:bg-yellow-200 transition-colors"
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
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 bg-[#365594] rounded-full flex items-center justify-center">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                                        <Loader2 size={16} className="animate-spin text-[#365594]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                                    placeholder="Ketik pesan..."
                                    className="flex-1"
                                    disabled={isLoading || step === 'generating'}
                                />
                                <Button
                                    onClick={() => handleSendMessage(inputValue)}
                                    disabled={isLoading || !inputValue.trim() || step === 'generating'}
                                    size="icon"
                                    className="bg-[#365594]"
                                >
                                    <Send size={18} />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
