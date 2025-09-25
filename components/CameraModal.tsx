import React, { useState, useRef, useEffect } from 'react';
import { CloseIcon } from './common/Icons';

interface CameraModalProps {
    onClose: () => void;
    onSave: (picture: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ onClose, onSave }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing camera: ", err);
                setError("Nepodarilo sa získať prístup ku kamere. Skontrolujte prosím povolenia vo vašom prehliadači.");
            }
        };

        startCamera();

        return () => {
            // Cleanup: stop the camera stream when component unmounts
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect
                context.translate(canvas.width, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleSave = () => {
        if (capturedImage) {
            onSave(capturedImage);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-lg"
            role="dialog" aria-modal="true" aria-labelledby="camera-modal-title"
        >
            <div className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-xl text-center p-6 relative aspect-video flex flex-col justify-between">
                 <header className="flex justify-between items-center absolute top-4 left-4 right-4">
                    <h2 id="camera-modal-title" className="text-lg font-bold text-white [text-shadow:_0_1px_2px_rgb(0_0_0_/_50%)]">
                        {capturedImage ? 'Náhľad fotky' : 'Vytvoriť fotku'}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="text-white/80 hover:text-white bg-black/30 rounded-full p-1"
                        aria-label="Zavrieť kameru"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg">
                    {error ? (
                        <p className="text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>
                    ) : (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline
                                className={`w-full h-full object-cover transform -scale-x-100 ${capturedImage ? 'hidden' : ''}`}
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            {capturedImage && (
                                <img src={capturedImage} alt="Captured preview" className="w-full h-full object-cover transform -scale-x-100" />
                            )}
                        </>
                    )}
                </div>

                <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-6 w-full">
                    {capturedImage ? (
                        <>
                             <button
                                onClick={handleRetake}
                                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                Zopakovať
                            </button>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                            >
                                Uložiť
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleTakePhoto}
                            className="w-16 h-16 rounded-full bg-white/90 hover:bg-white ring-4 ring-white/30 transition-all duration-200 focus:outline-none focus:ring-blue-500"
                            aria-label="Take Photo"
                            disabled={!!error}
                        />
                    )}
                </footer>
            </div>
        </div>
    );
};
