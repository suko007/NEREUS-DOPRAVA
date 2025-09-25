import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { UserRole } from '../types';
import { LogoIcon } from './common/Icons';
import { RideCard } from './RideCard';


const LoginScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
    const [role, setRole] = useState<UserRole>(UserRole.Passenger);
    const [name, setName] = useState('');
    const [password, setPassword] = useState(''); // for admin
    const [carType, setCarType] = useState('');
    const [carSeats, setCarSeats] = useState(1);
    const [error, setError] = useState('');

    const context = useContext(AppContext);
    if (!context) return null;
    const { login, register, users, rides } = context;

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const success = login(name, password);
        if (!success) {
            setError('Nesprávne meno alebo heslo.');
        }
    };
    
    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (role === UserRole.Driver && (!carType || carSeats < 1)) {
            setError('Pre vodiča musíte zadať typ auta a počet miest.');
            return;
        }
        const success = register(name, role, carType, carSeats);
        if(!success) {
            setError('Používateľ s týmto menom už existuje.');
        }
    };

    const tabClasses = (tabName: 'login' | 'register') =>
        `w-full py-3 text-center font-semibold cursor-pointer transition-colors duration-300 rounded-t-lg ${
        activeTab === tabName
            ? 'bg-white text-blue-600'
            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
        }`;

    const roleButtonClasses = (r: UserRole) => 
        `px-4 py-2 rounded-md transition-colors duration-200 ${
        role === r ? 'bg-blue-600 text-white' : 'bg-slate-200 hover:bg-slate-300'
        }`;
        
    return (
        <div className="min-h-screen bg-black/25 p-4 sm:p-8">
            <div className="w-full max-w-md mx-auto">
                <div className="flex justify-center mb-6">
                    <LogoIcon className="w-24 h-24 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-center text-white mb-2 [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">Vitajte v Doprava na preteky</h1>
                <p className="text-center text-slate-200 mb-8 [text-shadow:_0_1px_2px_rgb(0_0_0_/_30%)]">Prihláste sa alebo si vytvorte nový účet.</p>

                <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="flex">
                        <button className={tabClasses('login')} onClick={() => {setActiveTab('login'); setError('')}}>Prihlásenie</button>
                        <button className={tabClasses('register')} onClick={() => {setActiveTab('register'); setError('')}}>Registrácia</button>
                    </div>

                    <div className="p-8">
                        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6 text-center" role="alert">{error}</div>}
                        
                        {activeTab === 'login' ? (
                            <form onSubmit={handleLogin}>
                                <div className="mb-4">
                                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="login-name">Meno</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} id="login-name" type="text" placeholder="Vaše meno (alebo 'admin')" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="login-password">Heslo <span className="font-normal text-slate-500">(pre admina: 'password')</span></label>
                                    <input value={password} onChange={(e) => setPassword(e.target.value)} id="login-password" type="password" placeholder="Heslo (len pre admina)" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Prihlásiť sa
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleRegister}>
                                <div className="mb-4">
                                    <p className="block text-slate-700 text-sm font-bold mb-2">Som:</p>
                                    <div className="flex space-x-2">
                                        <button type="button" onClick={() => setRole(UserRole.Passenger)} className={roleButtonClasses(UserRole.Passenger)}>Cestujúci</button>
                                        <button type="button" onClick={() => setRole(UserRole.Driver)} className={roleButtonClasses(UserRole.Driver)}>Vodič</button>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="register-name">Meno</label>
                                    <input value={name} onChange={(e) => setName(e.target.value)} id="register-name" type="text" placeholder="Vaše meno" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                {role === UserRole.Driver && (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="car-type">Typ auta</label>
                                            <input value={carType} onChange={(e) => setCarType(e.target.value)} id="car-type" type="text" placeholder="napr. Škoda Octavia" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                        </div>
                                        <div className="mb-6">
                                            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="car-seats">Počet voľných miest</label>
                                            <input value={carSeats} onChange={(e) => setCarSeats(Number(e.target.value))} id="car-seats" type="number" min="1" max="8" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                        </div>
                                    </>
                                )}
                                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-md transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    Vytvoriť profil
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {rides.length > 0 && (
                <div className="w-full max-w-7xl mx-auto mt-16">
                    <h2 className="text-3xl font-bold text-center text-white mb-8 [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">
                        Nadchádzajúce jazdy
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {rides.map(ride => (
                            <RideCard 
                                key={ride.id}
                                ride={ride}
                                users={users}
                                currentUser={null}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;