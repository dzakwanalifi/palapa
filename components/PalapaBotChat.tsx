'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { generateMultipleItineraryOptions, saveItinerary } from '@/app/actions';
import { ItineraryConfirmationSummary } from '@/components/ItineraryConfirmationSummary';
import { ItineraryOptionsSelector } from '@/components/ItineraryOptionsSelector';
import { ItineraryPreviewEditor } from '@/components/ItineraryPreviewEditor';

// API call to LangChain agent with Google Maps Grounding
async function chatWithLangChainAgent(
  message: string,
  conversationHistory: any[],
  tripData: any,
  userLocation?: { latitude: number; longitude: number },
  threadId?: string
): Promise<{
  reply: string;
  tripData?: any;
  shouldGenerateItinerary?: boolean;
  sources?: any[];
  options?: Array<{ label: string; value: string }>;
  isComplete?: boolean;
}> {
  try {
    const response = await fetch('/api/chat-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationHistory,
        tripData,
        userLocation,
        threadId
      })
    });

    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return {
      reply: data.reply || 'Maaf, ada masalah dengan server.',
      tripData: data.tripData,
      shouldGenerateItinerary: data.shouldGenerateItinerary,
      sources: data.sources,
      options: data.options,
      isComplete: data.isComplete
    };
  } catch (error) {
    console.error('LangChain agent error:', error);
    return {
      reply: 'Maaf, ada masalah menghubungi server.',
      shouldGenerateItinerary: false
    };
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ title: string; url: string }>;
  options?: Array<{ label: string; value: string }>;
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
      content: 'Halo! 👋 Saya Palapa, asisten perjalanan virtualmu. Ada yang bisa kubantu? Tanya sesuatu atau kita mulai rencanakan liburan impianmu!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tripData, setTripData] = useState<any>({});
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Thread ID for memory persistence
  const [threadId] = useState(() => `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // New state for enhanced UX flow
  const [flowState, setFlowState] = useState<'chat' | 'confirm' | 'options' | 'preview'>('chat');
  const [itineraryOptions, setItineraryOptions] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any>(null);

  // Get user location on mount (if permission granted)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location permission denied:', error);
          // Location is optional, continue without it
        }
      );
    }
  }, []);

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

    // Convert messages to conversation history format for API
    const conversationHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const result = await chatWithLangChainAgent(text, conversationHistory, tripData, userLocation, threadId);

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.reply,
        sources: result.sources,
        options: result.options
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Update trip data if new information was extracted
      if (result.tripData) {
        setTripData(result.tripData);
      }

      // If isComplete from LangGraph agent, trigger generation flow
      if (result.isComplete && result.tripData?.destination) {
        // Check if we have enough information
        const hasRequiredInfo = result.tripData.destination && result.tripData.duration && result.tripData.budget;

        if (hasRequiredInfo) {
          // Show confirmation summary
          setFlowState('confirm');
          const confirmMsg: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: 'Sempurna! Saya sudah mendapatkan informasi yang diperlukan. Silakan periksa detail di bawah ini:'
          };
          setMessages(prev => [...prev, confirmMsg]);
        } else {
          // Ask follow-up questions for missing information
          const followUpMsg = generateFollowUpQuestion(result.tripData);
          const assistantFollowUp: Message = {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: followUpMsg
          };
          setMessages(prev => [...prev, assistantFollowUp]);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, ada kesalahan. Coba lagi ya!'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate follow-up questions for missing information
  const generateFollowUpQuestion = (currentData: any): string => {
    if (!currentData.destination) {
      return 'Ke mana kamu ingin pergi? Bisa sebutkan provinsi atau kota tujuanmu?';
    }
    if (!currentData.duration) {
      return 'Berapa hari kamu berencana untuk perjalanan ini?';
    }
    if (!currentData.budget) {
      return 'Berapa budget yang kamu siapkan untuk perjalanan ini?';
    }
    if (!currentData.preferences || currentData.preferences.length === 0) {
      return 'Apa yang paling kamu minati? (misal: budaya, kuliner, alam, sejarah)';
    }
    return 'Apakah ada preferensi lain yang ingin kamu tambahkan?';
  };

  const generateMultipleOptions = async (finalData: any) => {
    try {
      setIsLoading(true);

      console.log('[generateMultipleOptions] Input data:', finalData);

      const request: any = {
        budget: finalData.budget || 1000000,
        duration_days: finalData.duration || 3,
        preferred_categories: finalData.preferences || ['general'],
        provinsi: finalData.destination || 'Indonesia',
      };

      if (finalData.transport) {
        request.transport_mode = finalData.transport;
      }

      console.log('[generateMultipleOptions] API request:', request);

      const result = await generateMultipleItineraryOptions(request);

      console.log('[generateMultipleOptions] API result:', result);

      if (result.success && result.data) {
        setItineraryOptions(result.data);
        setFlowState('options');

        const optionsMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '✨ Saya sudah menyiapkan 3 pilihan itinerary untuk Anda! Pilih yang paling cocok dengan gaya perjalanan Anda:'
        };
        setMessages(prev => [...prev, optionsMsg]);
      } else {
        console.error('[generateMultipleOptions] Generation failed:', result.error);
        const errorMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `😓 Maaf, ada kendala saat menyusun itinerary${result.error ? ': ' + result.error : ''}. Bisa kita coba lagi?`
        };
        setMessages(prev => [...prev, errorMsg]);
        setFlowState('chat');
      }
    } catch (e) {
      console.error('[generateMultipleOptions] Exception:', e);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '😓 Maaf, terjadi kesalahan teknis. Bisa kita coba lagi?'
      };
      setMessages(prev => [...prev, errorMsg]);
      setFlowState('chat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmItinerary = () => {
    generateMultipleOptions(tripData);
  };

  const handleEditTripData = () => {
    setFlowState('chat');
    const editMsg: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: 'Baik, silakan beritahu saya apa yang ingin Anda ubah dari rencana perjalanan Anda.'
    };
    setMessages(prev => [...prev, editMsg]);
  };

  const handleSelectOption = (option: any) => {
    setSelectedOption(option);
    setFlowState('preview');
  };

  const handleRegenerateOptions = () => {
    generateMultipleOptions(tripData);
  };

  const handleSaveItinerary = async (editedData: any) => {
    try {
      // Get userId from localStorage
      const storedUser = localStorage.getItem('palapa_user');
      const userId = storedUser || 'demo-user';

      const saveResult = await saveItinerary(editedData, userId);

      const doneMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '🎉 Itinerary kamu sudah siap dan tersimpan! Silakan cek peta dan detail.'
      };
      setMessages(prev => [...prev, doneMsg]);

      setFlowState('chat');
      onItineraryGenerated(editedData);

      if (!saveResult.success) {
        console.warn('Failed to save itinerary:', saveResult.error);
      }
    } catch (e) {
      console.error('Error saving itinerary:', e);
    }
  };

  const handleCancelPreview = () => {
    setFlowState('options');
    setSelectedOption(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-white flex flex-col"
    >
      {/* Top Nav Bar - Clean White Header from Figma */}
      <div className="flex items-center justify-between px-6 pt-4 pb-4 bg-white">
        {/* Left Content */}
        <div className="flex items-center gap-6">
          {/* Back Button - Circle with border */}
          <button
            onClick={onBack}
            className="w-11 h-11 rounded-full border border-[#E3E5E5] flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={24} className="text-[#72777A]" />
          </button>

          {/* Palapa Bot Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-white">
              <Image
                src="/figma-assets/logo-budaya-go-19f67d.png"
                alt="PalapaBot"
                width={24}
                height={29}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-[#202325] leading-tight">PalapaBot</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#7DDE86]" />
                <span className="text-xs font-medium text-[#72777A] leading-tight">Always active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - More Button */}
        <button className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="1" fill="#72777A"/>
            <circle cx="12" cy="6" r="1" fill="#72777A"/>
            <circle cx="12" cy="18" r="1" fill="#72777A"/>
          </svg>
        </button>
      </div>

      {/* Preview Editor (Full Screen Overlay) */}
      <AnimatePresence>
        {flowState === 'preview' && selectedOption && (
          <ItineraryPreviewEditor
            itineraryData={selectedOption.itineraryData}
            onSave={handleSaveItinerary}
            onCancel={handleCancelPreview}
          />
        )}
      </AnimatePresence>

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
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user'
                ? "bg-[#0070F0] text-white"
                : "bg-white"
            )}>
              {msg.role === 'user' ? (
                <span className="font-bold text-xs">U</span>
              ) : (
                <Image
                  src="/figma-assets/logo-budaya-go-19f67d.png"
                  alt="Palapa"
                  width={18}
                  height={22}
                  className="object-contain"
                />
              )}
            </div>

            {/* Message Content */}
            <div className="space-y-3">
              <div className={cn(
                "px-4 py-4 text-base leading-6 max-w-xs",
                msg.role === 'user'
                  ? "bg-[#0070F0] text-white rounded-3xl rounded-br-md"
                  : "bg-[#F2F4F5] text-[#303437] rounded-3xl rounded-bl-none"
              )}>
                {msg.content}
              </div>

              {/* Citations/Sources from Google Maps/Search Grounding */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="pl-4 space-y-1">
                  <p className="text-xs text-slate-500 font-semibold">Sumber:</p>
                  {msg.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline block"
                    >
                      [{idx + 1}] {source.title}
                    </a>
                  ))}
                </div>
              )}

              {/* Quick Reply Buttons */}
              {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
                <div className="pl-4 mt-3 flex flex-wrap gap-2">
                  {msg.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(option.value)}
                      disabled={isLoading}
                      className={cn(
                        "px-4 py-2 rounded-full border-2 border-[#0070F0] text-[#0070F0]",
                        "hover:bg-[#0070F0] hover:text-white transition-colors",
                        "font-medium text-sm",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {option.label}
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
            className="flex gap-2 max-w-2xl"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              <Image
                src="/figma-assets/logo-budaya-go-19f67d.png"
                alt="Palapa"
                width={18}
                height={22}
                className="object-contain"
              />
            </div>
            <div className="px-4 py-4 rounded-3xl rounded-bl-none bg-[#F2F4F5]">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-[#72777A] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#72777A] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-[#72777A] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />

        {/* Confirmation Summary */}
        {flowState === 'confirm' && (
          <ItineraryConfirmationSummary
            tripData={tripData}
            onEdit={handleEditTripData}
            onConfirm={handleConfirmItinerary}
            isLoading={isLoading}
          />
        )}

        {/* Options Selector */}
        {flowState === 'options' && itineraryOptions.length > 0 && (
          <ItineraryOptionsSelector
            options={itineraryOptions}
            onSelect={handleSelectOption}
            onRegenerate={handleRegenerateOptions}
          />
        )}
      </div>

      {/* Input Area - Figma Style - Hide when not in chat mode */}
      {flowState === 'chat' && (
      <div className="px-6 py-8 bg-white rounded-tl-[48px]">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-4 px-5 py-2.5 border-[1.5px] border-[#979C9E] rounded-full bg-white">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
              placeholder="Type a message..."
              disabled={isLoading}
              className="flex-1 border-0 p-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#72777A]"
            />
            <button className="flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C10.0222 2 8.08879 2.58649 6.4443 3.68532C4.79981 4.78416 3.51809 6.3459 2.76121 8.17317C2.00433 10.0004 1.8063 12.0111 2.19215 13.9509C2.578 15.8907 3.53041 17.6725 4.92894 19.0711C6.32746 20.4696 8.10929 21.422 10.0491 21.8079C11.9889 22.1937 13.9996 21.9957 15.8268 21.2388C17.6541 20.4819 19.2159 19.2002 20.3147 17.5557C21.4135 15.9112 22 13.9778 22 12C22 9.34784 20.9464 6.8043 19.0711 4.92893C17.1957 3.05357 14.6522 2 12 2Z" stroke="#72777A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16M8 12H16" stroke="#72777A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="flex-shrink-0 w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center disabled:opacity-50 transition-opacity"
          >
            <Send size={20} className="text-[#0070F0]" />
          </button>
        </div>
      </div>
      )}
    </motion.div>
  );
};
