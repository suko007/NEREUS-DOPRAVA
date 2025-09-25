import React, { useState } from 'react';
import { User } from '../types';
import { CameraIcon, CloseIcon, UserIcon } from './common/Icons';
import { CameraModal } from './CameraModal';

interface ProfileModalProps {
    user: User;
    onClose: () => void;
    onSavePicture: (userId: string, picture: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onSavePicture }) => {
    const [isCameraOpen, setCameraOpen] = useState(false);

    const handleSave = (picture: string) => {
        onSavePicture(user.id, picture);
        setCameraOpen(false);
    };

    if (isCameraOpen) {
        return <CameraModal onClose={() => setCameraOpen(false)} onSave={handleSave} />;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800"
                    aria-label="Zavrieť profil"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>

                <div className="w-32 h-32 rounded-full mx-auto bg-slate-200 flex items-center justify-center overflow-hidden ring-4 ring-blue-500 ring-offset-4 mb-4">
                    {user.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover"/>
                    ) : (
                        <UserIcon className="w-20 h-20 text-slate-400"/>
                    )}
                </div>
                
                <h2 id="profile-modal-title" className="text-3xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-slate-500 mb-6">{user.role}</p>

                <button
                    onClick={() => setCameraOpen(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <CameraIcon className="w-5 h-5" />
                    <span>Zmeniť fotku</span>
                </button>
            </div>
        </div>
    );
};
