'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface ProfilePageProps {
    onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
    const { user, signOut } = useAuth();

    const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
    const avatarName = user?.displayName || 'User';
    const email = user?.email || 'user@example.com';
    const phoneNumber = '+62 812 3456 7890'; // Would come from Firestore UserProfile
    const city = 'Yogyakarta, Indonesia'; // Would come from Firestore UserProfile

    const handleSignOut = async () => {
        try {
            await signOut();
            onBack();
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute inset-0 z-40 bg-slate-50 flex flex-col"
        >
            {/* Header */}
            <div className="bg-white px-6 pt-6 pb-4 shadow-sm z-10 flex items-center gap-4">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                    <ArrowLeft size={24} className="text-slate-800" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">Profil Saya</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 overflow-hidden border-4 border-white shadow-lg">
                        <img
                            src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=365594&color=fff&size=128`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">{displayName}</h2>
                    <p className="text-slate-500">Travel Enthusiast</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900">Informasi Pribadi</h3>
                        <Button variant="ghost" size="sm" className="text-[#365594]">
                            <Edit size={16} className="mr-2" /> Edit
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#365594]">
                                <User size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Nama Lengkap</p>
                                <p className="font-medium text-slate-900">{displayName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#365594]">
                                <Mail size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Email</p>
                                <p className="font-medium text-slate-900">{email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#365594]">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Nomor Telepon</p>
                                <p className="font-medium text-slate-900">{phoneNumber}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#365594]">
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Domisili</p>
                                <p className="font-medium text-slate-900">{city}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSignOut}
                    className="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                    variant="outline"
                >
                    <LogOut size={16} className="mr-2" />
                    Keluar Akun
                </Button>
            </div>
        </motion.div>
    );
};
