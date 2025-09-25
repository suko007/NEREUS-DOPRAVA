
import React, { useContext, useState, FormEvent } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UserRole, Ride, User } from '../types';
import {
  LogoutIcon, PlusIcon, UserIcon
} from './common/Icons';
import { RideCard } from './RideCard';
import { ProfileModal } from './ProfileModal';
import { ConfirmationModal } from './common/ConfirmationModal';

// Inlined RideModal component for creating/editing rides
const RideModal: React.FC<{
  ride: Ride | null;
  onClose: () => void;
  onSave: (rideData: { destination: string; date: string; time: string; meetingPlace: string }) => void;
}> = ({ ride, onClose, onSave }) => {
  const [destination, setDestination] = useState(ride?.destination || '');
  const [date, setDate] = useState(ride?.date || '');
  const [time, setTime] = useState(ride?.time || '');
  const [meetingPlace, setMeetingPlace] = useState(ride?.meetingPlace || '');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ destination, date, time, meetingPlace });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{ride ? 'Upraviť jazdu' : 'Vytvoriť novú jazdu'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="destination" className="block text-sm font-medium text-slate-700">Cieľ</label>
                <input type="text" id="destination" value={destination} onChange={e => setDestination(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-700">Dátum</label>
                <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-slate-700">Čas</label>
                <input type="time" id="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
              <div>
                <label htmlFor="meetingPlace" className="block text-sm font-medium text-slate-700">Miesto stretnutia</label>
                <input type="text" id="meetingPlace" value={meetingPlace} onChange={e => setMeetingPlace(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 px-4 rounded-md transition-colors">Zrušiť</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">{ride ? 'Uložiť zmeny' : 'Vytvoriť jazdu'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


const Dashboard: React.FC = () => {
    const context = useContext(AppContext);
    const [isRideModalOpen, setRideModalOpen] = useState(false);
    const [isProfileModalOpen, setProfileModalOpen] = useState(false);
    const [editingRide, setEditingRide] = useState<Ride | null>(null);
    const [rideIdToDelete, setRideIdToDelete] = useState<string | null>(null);

    if (!context || !context.currentUser) {
        return <div className="flex items-center justify-center h-screen">Načítava sa...</div>;
    }
    
    const { 
        currentUser, users, rides, logout, createRide, updateRide, deleteRide, 
        addCarToRide, removeCarFromRide, bookSeat, cancelBooking, updateProfilePicture
    } = context;
    
    const now = new Date();
    const upcomingRides = rides
        .filter(ride => new Date(`${ride.date}T${ride.time || '00:00'}`) >= now)
        .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());
    const pastRides = rides
        .filter(ride => new Date(`${ride.date}T${ride.time || '00:00'}`) < now)
        .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());


    // Ride Modal Handlers
    const handleOpenCreateRideModal = () => {
        setEditingRide(null);
        setRideModalOpen(true);
    };

    const handleOpenEditRideModal = (ride: Ride) => {
        setEditingRide(ride);
        setRideModalOpen(true);
    };
    
    const handleCloseRideModal = () => {
        setRideModalOpen(false);
        setEditingRide(null);
    };

    const handleSaveRide = (rideData: { destination: string; date: string; time: string; meetingPlace: string }) => {
        if (editingRide) {
            updateRide(editingRide.id, rideData.destination, rideData.date, rideData.time, rideData.meetingPlace);
        } else {
            createRide(rideData.destination, rideData.date, rideData.time, rideData.meetingPlace);
        }
        handleCloseRideModal();
    };

    const handleDeleteRide = (rideId: string) => {
        setRideIdToDelete(rideId);
    };
    
    const handleConfirmDelete = () => {
      if (rideIdToDelete) {
        deleteRide(rideIdToDelete);
        setRideIdToDelete(null);
      }
    };

    const handleCancelDelete = () => {
      setRideIdToDelete(null);
    };

    const rideForDeletion = rideIdToDelete ? rides.find(r => r.id === rideIdToDelete) : null;
    
    // UI components
    const Header = () => (
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-blue-600">Doprava na preteky</h1>
                <p className="text-slate-600 text-sm md:text-base">Vitaj, {currentUser.name} ({currentUser.role})</p>
            </div>
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => setProfileModalOpen(true)}
                    className="flex items-center space-x-2 group"
                    aria-label="Otvoriť profil"
                >
                    <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:ring-2 group-hover:ring-blue-500 group-hover:ring-offset-2 transition-all duration-200 flex items-center justify-center overflow-hidden">
                        {currentUser.profilePicture ? (
                            <img src={currentUser.profilePicture} alt={currentUser.name} className="w-full h-full object-cover"/>
                        ) : (
                            <UserIcon className="w-6 h-6 text-slate-500"/>
                        )}
                    </div>
                </button>
                 <button
                    onClick={logout}
                    className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="hidden md:inline">Odhlásiť sa</span>
                </button>
            </div>
        </header>
    );

    const UserAvatar: React.FC<{user: User}> = ({ user }) => (
         <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden mr-3 flex-shrink-0">
            {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover"/>
            ) : (
                <UserIcon className="w-6 h-6 text-slate-500"/>
            )}
        </div>
    );
    
    const AdminDashboard = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Nadchádzajúce jazdy</h2>
                <button onClick={handleOpenCreateRideModal} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-transform duration-200 hover:scale-105">
                    <PlusIcon className="w-5 h-5"/>
                    <span>Vytvoriť novú jazdu</span>
                </button>
            </div>
            {upcomingRides.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {upcomingRides.map(ride => (
                        <RideCard
                            key={ride.id}
                            ride={ride}
                            users={users}
                            currentUser={currentUser}
                            onEdit={handleOpenEditRideModal}
                            onDelete={handleDeleteRide}
                            onAddCar={addCarToRide}
                            onRemoveCar={removeCarFromRide}
                            onBookSeat={bookSeat}
                            onCancelBooking={cancelBooking}
                        />
                    ))}
                </div>
            ) : (
                <p>Zatiaľ nie sú naplánované žiadne jazdy.</p>
            )}

            {pastRides.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-3xl font-bold mb-6">Uskutočnené jazdy</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {pastRides.map(ride => (
                            <RideCard
                                key={ride.id}
                                ride={ride}
                                users={users}
                                currentUser={currentUser}
                                isPast={true}
                                // Pass handlers so card doesn't crash, but actions will be disabled inside
                                onAddCar={addCarToRide}
                                onRemoveCar={removeCarFromRide}
                                onBookSeat={bookSeat}
                                onCancelBooking={cancelBooking}
                            />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6">Používatelia</h2>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <ul className="divide-y divide-slate-200">
                        {users.map(user => (
                            <li key={user.id} className="p-4 flex justify-between items-center">
                                <div className="flex items-center">
                                    <UserAvatar user={user} />
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.role}{user.role === UserRole.Driver && ` - ${user.car?.type}`}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {user.role === UserRole.Driver && <p className="text-sm text-slate-500">{user.car?.seats} miest</p>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
    
    const UserDashboard = () => (
         <div>
            <h2 className="text-3xl font-bold mb-6">Nadchádzajúce jazdy</h2>
             {upcomingRides.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {upcomingRides.map(ride => (
                        <RideCard
                            key={ride.id}
                            ride={ride}
                            users={users}
                            currentUser={currentUser}
                            onAddCar={addCarToRide}
                            onRemoveCar={removeCarFromRide}
                            onBookSeat={bookSeat}
                            onCancelBooking={cancelBooking}
                        />
                    ))}
                </div>
             ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700">Žiadne nadchádzajúce jazdy</h3>
                    <p className="text-slate-500 mt-2">Momentálne nie sú naplánované žiadne jazdy. Skúste to neskôr.</p>
                </div>
             )}
        </div>
    );

    return (
        <div className="bg-slate-100 min-h-screen">
            <Header />
            <main className="p-4 md:p-8">
                {currentUser.role === UserRole.Admin ? <AdminDashboard /> : <UserDashboard />}
            </main>
            {isRideModalOpen && <RideModal ride={editingRide} onClose={handleCloseRideModal} onSave={handleSaveRide} />}
            {isProfileModalOpen && <ProfileModal user={currentUser} onClose={() => setProfileModalOpen(false)} onSavePicture={updateProfilePicture} />}
            {rideForDeletion && (
                <ConfirmationModal
                    title="Potvrdiť zmazanie jazdy"
                    message={`Naozaj chcete natrvalo zmazať jazdu do "${rideForDeletion.destination}"? Táto akcia je nezvratná.`}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    confirmText="Áno, zmazať"
                    cancelText="Zrušiť"
                />
            )}
        </div>
    );
};

export default Dashboard;
