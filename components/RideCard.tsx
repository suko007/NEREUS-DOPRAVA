
import React, { useMemo, useState } from 'react';
import { UserRole, Ride, User } from '../types';
import {
  EditIcon, TrashIcon, CarIcon, CalendarIcon, LocationIcon, ClockIcon, UserIcon, MapIcon
} from './common/Icons';
import { MapModal } from './MapModal';
import { ConfirmationModal } from './common/ConfirmationModal';

interface RideCardProps {
    ride: Ride;
    users: User[];
    currentUser: User | null;
    isPast?: boolean;
    onEdit?: (ride: Ride) => void;
    onDelete?: (rideId: string) => void;
    onAddCar?: (rideId: string, driver: User) => void;
    onRemoveCar?: (rideId: string, driverId: string) => void;
    onBookSeat?: (rideId: string, carId: string, passenger: User) => void;
    onCancelBooking?: (rideId: string, passengerId: string) => void;
}

const isUserBookedOnRide = (ride: Ride, userId: string) => ride.cars.some(c => c.bookings.some(b => b.passengerId === userId));

const UserAvatar: React.FC<{user: User | undefined}> = ({ user }) => (
    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden mr-2 flex-shrink-0">
       {user?.profilePicture ? (
           <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover"/>
       ) : (
           <UserIcon className="w-4 h-4 text-slate-500"/>
       )}
   </div>
);

export const RideCard: React.FC<RideCardProps> = ({ 
    ride, users, currentUser, isPast, onEdit, onDelete,
    onAddCar, onRemoveCar, onBookSeat, onCancelBooking
}) => {
    const [isMapModalOpen, setMapModalOpen] = useState(false);
    const [bookingCarInfo, setBookingCarInfo] = useState<{ carId: string; driverName: string; } | null>(null);

    const totalSeats = useMemo(() => {
        return ride.cars.reduce((acc, rideCar) => {
            const driver = users.find(u => u.id === rideCar.driverId);
            return acc + (driver?.car?.seats || 0);
        }, 0);
    }, [ride.cars, users]);

    const totalBookings = useMemo(() => ride.cars.reduce((acc, car) => acc + car.bookings.length, 0), [ride.cars]);
    
    const handleBookingRequest = (carId: string, driverName: string) => {
        setBookingCarInfo({ carId, driverName });
    };

    const handleConfirmBooking = () => {
        if (onBookSeat && currentUser && bookingCarInfo) {
            onBookSeat(ride.id, bookingCarInfo.carId, currentUser);
        }
        setBookingCarInfo(null);
    };

    const handleCancelBookingConfirmation = () => {
        setBookingCarInfo(null);
    };

    return (
        <>
            <div className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${isPast ? 'opacity-75' : ''}`}>
                <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{ride.destination}</h3>
                        {currentUser?.role === UserRole.Admin && onEdit && onDelete && !isPast && (
                            <div className="flex space-x-2">
                                <button onClick={() => onEdit(ride)} className="text-blue-500 hover:text-blue-700"><EditIcon className="w-5 h-5"/></button>
                                <button onClick={() => onDelete(ride.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-3 text-slate-600">
                       <p className="flex items-center"><CalendarIcon className="w-5 h-5 mr-2 text-blue-500"/> {new Date(ride.date).toLocaleDateString('sk-SK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                       <p className="flex items-center"><ClockIcon className="w-5 h-5 mr-2 text-blue-500"/> {ride.time}</p>
                       <p className="flex items-center"><LocationIcon className="w-5 h-5 mr-2 text-blue-500"/> Miesto: {ride.meetingPlace}</p>
                    </div>

                    <div className="mt-6 border-t pt-4">
                        <h4 className="font-bold text-slate-700 mb-3">Autá a rezervácie:</h4>
                        {ride.cars.length === 0 ? (
                            <p className="text-slate-500 italic">Zatiaľ žiadne autá.</p>
                        ) : (
                            <div className="space-y-4">
                                {ride.cars.map(rideCar => {
                                    const driver = users.find(u => u.id === rideCar.driverId);
                                    if (!driver || !driver.car) return null;
                                    const freeSeats = driver.car.seats - rideCar.bookings.length;

                                    return (
                                        <div key={rideCar.carId} className="border p-3 rounded-md">
                                            <div className="font-semibold flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <UserAvatar user={driver} />
                                                    <div>
                                                        <span>{driver.name} (<CarIcon className="w-4 h-4 inline mr-1"/>{driver.car.type})</span>
                                                        {driver.mobile && <span className="text-xs text-slate-500 block">{driver.mobile}</span>}
                                                    </div>
                                                </div>
                                                <span className={`font-bold px-2 py-1 text-xs rounded-full ${freeSeats > 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                    Voľné: {freeSeats} / {driver.car.seats}
                                                </span>
                                            </div>
                                            {rideCar.bookings.length > 0 && (
                                                <ul className="text-sm mt-2 ml-2 space-y-1 text-slate-600">
                                                    {rideCar.bookings.map(b => {
                                                      const passenger = users.find(u => u.id === b.passengerId);
                                                      return (
                                                        <li key={b.passengerId} className="flex items-center">
                                                          <UserAvatar user={passenger} />
                                                          {b.passengerName}
                                                        </li>
                                                      )
                                                    })}
                                                </ul>
                                            )}
                                            {!isPast && currentUser?.role === UserRole.Passenger && onBookSeat && !isUserBookedOnRide(ride, currentUser.id) && freeSeats > 0 && (
                                                <button onClick={() => handleBookingRequest(rideCar.carId, driver.name)} className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-2 rounded-md transition-colors">
                                                    Rezervovať miesto
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 border-t space-y-3">
                    {/* Action buttons appear only if ride is not in the past */}
                    {!isPast && (
                        <>
                            {currentUser?.role === UserRole.Driver && currentUser.car && onAddCar && onRemoveCar && (
                                !ride.cars.some(c => c.driverId === currentUser.id) ? (
                                    <button onClick={() => onAddCar(ride.id, currentUser)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                        Pridať moje auto
                                    </button>
                                ) : (
                                    <button onClick={() => onRemoveCar(ride.id, currentUser.id)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                        Odstrániť moje auto
                                    </button>
                                )
                            )}
                            {currentUser?.role === UserRole.Passenger && onCancelBooking && isUserBookedOnRide(ride, currentUser.id) && (
                                <button onClick={() => onCancelBooking(ride.id, currentUser.id)} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Zrušiť rezerváciu
                                </button>
                            )}
                        </>
                    )}
                     
                    {/* Info bar at the bottom */}
                    <div className="flex justify-between items-center text-sm">
                        <button onClick={() => setMapModalOpen(true)} className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                            <MapIcon className="w-5 h-5" />
                            <span>Zobraziť na mape</span>
                        </button>
                         <div className={`font-semibold text-slate-600`}>
                             Celkom miest: {totalBookings} / {totalSeats}
                         </div>
                    </div>
                </div>
            </div>
            {isMapModalOpen && <MapModal ride={ride} currentUser={currentUser} onClose={() => setMapModalOpen(false)} />}
            {bookingCarInfo && (
                <ConfirmationModal
                    title="Potvrdenie rezervácie"
                    message={`Naozaj si chcete rezervovať miesto v aute šoféra ${bookingCarInfo.driverName}?`}
                    onConfirm={handleConfirmBooking}
                    onCancel={handleCancelBookingConfirmation}
                    confirmText="Áno, rezervovať"
                    cancelText="Zrušiť"
                />
            )}
        </>
    );
};