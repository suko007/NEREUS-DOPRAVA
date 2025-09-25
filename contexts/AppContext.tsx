import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, Ride, Car, RideCar, Booking } from '../types';

// Helper to get data from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper to set data to localStorage
const setToStorage = <T,>(key: string, value: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

// Define the shape of the context data
interface AppContextType {
    currentUser: User | null;
    users: User[];
    rides: Ride[];
    login: (name: string, password?: string) => boolean;
    logout: () => void;
    register: (name: string, role: UserRole, carType?: string, carSeats?: number) => boolean;
    createRide: (destination: string, date: string, time: string, meetingPlace: string) => void;
    updateRide: (rideId: string, destination: string, date: string, time: string, meetingPlace: string) => void;
    deleteRide: (rideId: string) => void;
    updateProfile: (userId: string, name: string, password?: string) => void;
    updateProfilePicture: (userId: string, picture: string) => void;
    addCarToRide: (rideId: string, driver: User) => void;
    removeCarFromRide: (rideId: string, driverId: string) => void;
    bookSeat: (rideId: string, carId: string, passenger: User) => void;
    cancelBooking: (rideId: string, passengerId: string) => void;
}

// Create the context
export const AppContext = createContext<AppContextType | null>(null);

// Create the provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>(() => getFromStorage('users', [
        { id: 'admin-user', name: 'admin', role: UserRole.Admin, password: 'password' }
    ]));
    const [rides, setRides] = useState<Ride[]>(() => getFromStorage('rides', []));
    const [currentUser, setCurrentUser] = useState<User | null>(() => getFromStorage('currentUser', null));
    
    // Persist state to localStorage whenever it changes
    useEffect(() => {
        setToStorage('users', users);
    }, [users]);
    
    useEffect(() => {
        setToStorage('rides', rides);
    }, [rides]);

    useEffect(() => {
        setToStorage('currentUser', currentUser);
    }, [currentUser]);

    const login = useCallback((name: string, password?: string): boolean => {
        const user = users.find(u => u.name.toLowerCase() === name.toLowerCase());
        if (!user) return false;

        if (user.role === UserRole.Admin) {
            if (user.password === password) {
                setCurrentUser(user);
                return true;
            }
            return false;
        }
        
        setCurrentUser(user);
        return true;
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
    }, []);

    const register = useCallback((name: string, role: UserRole, carType?: string, carSeats?: number): boolean => {
        if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
            return false; // User already exists
        }

        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            role,
        };

        if (role === UserRole.Driver && carType && carSeats) {
            const newCar: Car = {
                id: `car-${Date.now()}`,
                type: carType,
                seats: carSeats,
                driverId: newUser.id,
            };
            newUser.car = newCar;
        }

        setUsers(prevUsers => [...prevUsers, newUser]);
        setCurrentUser(newUser); // Automatically log in new user
        return true;
    }, [users]);

    const createRide = useCallback((destination: string, date: string, time: string, meetingPlace: string) => {
        const newRide: Ride = {
            id: `ride-${Date.now()}`,
            destination,
            date,
            time,
            meetingPlace,
            cars: [],
        };
        setRides(prevRides => [newRide, ...prevRides]);
    }, []);

    const updateRide = useCallback((rideId: string, destination: string, date: string, time: string, meetingPlace: string) => {
        setRides(prevRides => prevRides.map(ride => 
            ride.id === rideId ? { ...ride, destination, date, time, meetingPlace } : ride
        ));
    }, []);

    const deleteRide = useCallback((rideId: string) => {
        setRides(prevRides => prevRides.filter(ride => ride.id !== rideId));
    }, []);
    
    const updateProfile = useCallback((userId: string, name: string, password?: string) => {
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === userId) {
                const updatedUser: User = { ...user, name };
                if (password && user.role === UserRole.Admin) {
                    updatedUser.password = password;
                }
                if (currentUser?.id === userId) {
                    setCurrentUser(updatedUser);
                }
                return updatedUser;
            }
            return user;
        }));
    }, [currentUser]);

    const updateProfilePicture = useCallback((userId: string, picture: string) => {
        setUsers(prevUsers => prevUsers.map(user => {
            if (user.id === userId) {
                const updatedUser = { ...user, profilePicture: picture };
                if (currentUser?.id === userId) {
                    setCurrentUser(updatedUser);
                }
                return updatedUser;
            }
            return user;
        }));
    }, [currentUser]);

    const addCarToRide = useCallback((rideId: string, driver: User) => {
        if (!driver.car) return;
        setRides(prevRides => prevRides.map(ride => {
            if (ride.id === rideId && !ride.cars.some(c => c.driverId === driver.id)) {
                const newRideCar: RideCar = {
                    carId: driver.car!.id,
                    driverId: driver.id,
                    bookings: [],
                };
                return { ...ride, cars: [...ride.cars, newRideCar] };
            }
            return ride;
        }));
    }, []);

    const removeCarFromRide = useCallback((rideId: string, driverId: string) => {
        setRides(prevRides => prevRides.map(ride => {
            if (ride.id === rideId) {
                return { ...ride, cars: ride.cars.filter(c => c.driverId !== driverId) };
            }
            return ride;
        }));
    }, []);

    const bookSeat = useCallback((rideId: string, carId: string, passenger: User) => {
        setRides(prevRides => prevRides.map(ride => {
            if (ride.id === rideId) {
                // Prevent booking if already booked in any car for this ride
                const alreadyBooked = ride.cars.some(c => c.bookings.some(b => b.passengerId === passenger.id));
                if (alreadyBooked) return ride;

                const updatedCars = ride.cars.map(car => {
                    if (car.carId === carId) {
                        const driver = users.find(u => u.id === car.driverId);
                        if (driver && driver.car && car.bookings.length < driver.car.seats) {
                            const newBooking: Booking = {
                                passengerId: passenger.id,
                                passengerName: passenger.name,
                            };
                            return { ...car, bookings: [...car.bookings, newBooking] };
                        }
                    }
                    return car;
                });
                return { ...ride, cars: updatedCars };
            }
            return ride;
        }));
    }, [users]);
    
    const cancelBooking = useCallback((rideId: string, passengerId: string) => {
        setRides(prevRides => prevRides.map(ride => {
            if (ride.id === rideId) {
                const updatedCars = ride.cars.map(car => ({
                    ...car,
                    bookings: car.bookings.filter(b => b.passengerId !== passengerId),
                }));
                return { ...ride, cars: updatedCars };
            }
            return ride;
        }));
    }, []);

    // The value provided to consumers of the context.
    const contextValue: AppContextType = {
        currentUser,
        users,
        rides,
        login,
        logout,
        register,
        createRide,
        updateRide,
        deleteRide,
        updateProfile,
        updateProfilePicture,
        addCarToRide,
        removeCarFromRide,
        bookSeat,
        cancelBooking,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};