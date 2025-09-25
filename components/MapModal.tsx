import React from 'react';
import { Ride, User, UserRole } from '../types';
import { MapPinIcon, CarIcon, UserIcon } from './common/Icons';

interface MapModalProps {
  ride: Ride;
  currentUser: User | null;
  onClose: () => void;
}

export const MapModal: React.FC<MapModalProps> = ({ ride, currentUser, onClose }) => {
  const isDriverOnRide = currentUser?.role === UserRole.Driver && ride.cars.some(c => c.driverId === currentUser.id);

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
    >
      <div 
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <header className="p-4 border-b flex justify-between items-center">
          <h2 id="map-modal-title" className="text-xl font-bold text-slate-800">Mapa pre: {ride.destination}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-800 text-2xl font-bold leading-none"
            aria-label="Zavrieť mapu"
          >&times;</button>
        </header>
        <div className="flex-grow flex flex-col md:flex-row">
          <main className="w-full md:w-2/3 h-full bg-slate-200 relative overflow-hidden">
            {/* Simulated Map Background */}
            <div className="absolute inset-0 bg-grid-slate-300 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))]"></div>
            <svg className="absolute inset-0 w-full h-full text-slate-300/80" width="100%" height="100%">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Route for Driver */}
            {isDriverOnRide && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Dashed line from Your Location to Meeting Place */}
                  <path d="M 15 25 Q 20 50, 35 50" strokeDasharray="4" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
              </svg>
            )}

            {/* Locations */}
            <div className="absolute top-[20%] left-[10%] transform -translate-x-1/2 -translate-y-1/2">
                {isDriverOnRide && <LocationMarker label="Vaša poloha" icon={<CarIcon className="w-5 h-5"/>} color="bg-blue-500" />}
            </div>
            <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
                <LocationMarker label={ride.meetingPlace} icon={<UserIcon className="w-5 h-5"/>} color="bg-green-500" />
            </div>
            <div className="absolute top-1/3 right-[15%] transform -translate-x-1/2 -translate-y-1/2">
                 <LocationMarker label={ride.destination} icon={<MapPinIcon className="w-5 h-5"/>} color="bg-red-500" />
            </div>
          </main>
          <aside className="w-full md:w-1/3 p-6 bg-slate-50 border-l overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Legenda</h3>
            <ul className="space-y-4">
              {isDriverOnRide && (
                  <li>
                    <div className="flex items-center">
                      <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-3 text-white">
                        <CarIcon className="w-5 h-5"/>
                      </span>
                      <div>
                        <p className="font-semibold">Vaša poloha</p>
                        <p className="text-sm text-slate-500">Štartovací bod pre vodiča</p>
                      </div>
                    </div>
                  </li>
              )}
               <li>
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-3 text-white">
                    <UserIcon className="w-5 h-5"/>
                  </span>
                  <div>
                    <p className="font-semibold">Miesto stretnutia</p>
                    <p className="text-sm text-slate-500">{ride.meetingPlace}</p>
                  </div>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center mr-3 text-white">
                    <MapPinIcon className="w-5 h-5"/>
                  </span>
                  <div>
                    <p className="font-semibold">Cieľ</p>
                    <p className="text-sm text-slate-500">{ride.destination}</p>
                  </div>
                </div>
              </li>
              {isDriverOnRide && (
                <li>
                  <div className="flex items-center">
                    <svg className="w-8 h-8 mr-3" viewBox="0 0 32 32">
                        <path d="M 4 4 L 28 28" strokeDasharray="4" stroke="#3b82f6" strokeWidth="2" fill="none"/>
                    </svg>
                    <div>
                      <p className="font-semibold">Trasa pre vodiča</p>
                      <p className="text-sm text-slate-500">Cesta na miesto stretnutia</p>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
};

const LocationMarker: React.FC<{label: string, icon: React.ReactNode, color: string}> = ({label, icon, color}) => (
    <div className="flex flex-col items-center group cursor-pointer">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div className="mt-2 bg-white/80 text-slate-800 text-xs font-bold px-2 py-1 rounded-md shadow-sm backdrop-blur-sm whitespace-nowrap">
            {label}
        </div>
    </div>
);
