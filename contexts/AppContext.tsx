import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, Ride, Car, RideCar, Booking } from '../types';

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
    getFirestore, collection, onSnapshot, addDoc, doc, 
    updateDoc, deleteDoc, query, where, getDocs 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";


// --- FIREBASE SETUP ---
// IMPORTANT: Replace with your project's actual Firebase configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  apiKey: "AIzaSyBTT2YIy1xyuBAgab29rsuYvIrla05_XRc",
  authDomain: "nereus-2.firebaseapp.com",
  projectId: "nereus-2",
  storageBucket: "nereus-2.firebasestorage.app",
  messagingSenderId: "277352318271",
  appId: "1:277352318271:web:20c695b8996b6414557f8a"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// --- END FIREBASE SETUP ---


// Helper to get/set the current user session from localStorage
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

const setToStorage = <T,>(key: string, value: T) => {
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

interface AppContextType {
    currentUser: User | null;
    users: User[];
    rides: Ride[];
    isLoading: boolean;
    login: (name: string, password?: string) => Promise<boolean>;
    logout: () => void;
    register: (name: string, role: UserRole, password: string, email: string, mobile: string, carType?: string, carSeats?: number) => Promise<boolean>;
    createRide: (destination: string, date: string, time: string, meetingPlace: string) => Promise<void>;
    updateRide: (rideId: string, destination: string, date: string, time: string, meetingPlace: string) => Promise<void>;
    deleteRide: (rideId: string) => Promise<void>;
    updateProfile: (userId: string, name: string, email: string, mobile: string, password?: string) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    updateProfilePicture: (userId: string, picture: string) => Promise<void>;
    addCarToRide: (rideId: string, driver: User) => Promise<void>;
    removeCarFromRide: (rideId: string, driverId: string) => Promise<void>;
    bookSeat: (rideId: string, carId: string, passenger: User) => Promise<void>;
    cancelBooking: (rideId: string, passengerId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [rides, setRides] = useState<Ride[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(() => getFromStorage('currentUser', null));
    
    // Persist session to localStorage
    useEffect(() => {
        setToStorage('currentUser', currentUser);
    }, [currentUser]);

    // Set up real-time listeners for Firebase data
    useEffect(() => {
        setIsLoading(true);

        const usersCollectionRef = collection(db, "users");
        const ridesCollectionRef = collection(db, "rides");

        // Set up listeners
        const unsubUsers = onSnapshot(usersCollectionRef, (snapshot) => {
            if (snapshot.empty) {
                // If no users exist, seed the database with an admin user.
                addDoc(usersCollectionRef, { 
                    name: 'admin', 
                    role: UserRole.Admin, 
                    password: 'password',
                    email: 'admin@example.com',
                    mobile: '000000000',
                    id: 'admin-user' // Temp ID, will be overwritten by firestore
                });
            }
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
            setUsers(usersData);
        });

        const unsubRides = onSnapshot(ridesCollectionRef, (snapshot) => {
            const ridesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ride));
            setRides(ridesData);
            // Consider the app loaded once the main ride data is available.
            setIsLoading(false);
        });

        // Cleanup listeners on component unmount
        return () => {
            unsubUsers();
            unsubRides();
        };
    }, []);

    // Effect to keep the currentUser object in sync with the live user list from Firestore.
    useEffect(() => {
        if (currentUser) {
            const updatedUserInDb = users.find(u => u.id === currentUser.id);
            if (!updatedUserInDb) {
                // User was deleted remotely, log them out.
                setCurrentUser(null);
            } else if (JSON.stringify(updatedUserInDb) !== JSON.stringify(currentUser)) {
                // User data was changed remotely, sync the session.
                setCurrentUser(updatedUserInDb);
            }
        }
    }, [users, currentUser]);

    const logout = () => {
        setCurrentUser(null);
    };

    const login = async (name: string, password?: string): Promise<boolean> => {
        const q = query(collection(db, "users"), where("name", "==", name), where("password", "==", password));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return false;
        } else {
            const userDoc = querySnapshot.docs[0];
            const user = { ...userDoc.data(), id: userDoc.id } as User;
            setCurrentUser(user);
            return true;
        }
    };
    
    const register = async (name: string, role: UserRole, password: string, email: string, mobile: string, carType?: string, carSeats?: number): Promise<boolean> => {
        const q = query(collection(db, "users"), where("name", "==", name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return false; // User already exists
        }

        const newUser: Omit<User, 'id'> = { name, role, password, email, mobile };
        if (role === UserRole.Driver && carType && carSeats) {
             const tempCarId = `car-${Date.now()}`;
             newUser.car = { id: tempCarId, type: carType, seats: carSeats, driverId: '' }; // driverId is set below
        }

        const docRef = await addDoc(collection(db, "users"), newUser);
        const createdUser: User = { ...newUser, id: docRef.id };
        if(createdUser.car) createdUser.car.driverId = docRef.id;

        setCurrentUser(createdUser);
        return true;
    };

    const createRide = async (destination: string, date: string, time: string, meetingPlace: string) => {
        const newRide: Omit<Ride, 'id'> = { destination, date, time, meetingPlace, cars: [] };
        await addDoc(collection(db, "rides"), newRide);
    };

    const updateRide = async (rideId: string, destination: string, date: string, time: string, meetingPlace: string) => {
        const rideRef = doc(db, 'rides', rideId);
        await updateDoc(rideRef, { destination, date, time, meetingPlace });
    };

    const deleteRide = async (rideId: string) => {
        await deleteDoc(doc(db, 'rides', rideId));
    };

    const updateProfile = async (userId: string, name: string, email: string, mobile: string, password?: string) => {
        const userRef = doc(db, 'users', userId);
        const updateData: { name: string; email: string; mobile: string; password?: string } = { name, email, mobile };
        if (password && currentUser?.role === UserRole.Admin) {
            updateData.password = password;
        }
        await updateDoc(userRef, updateData);
    };

    const deleteUser = async (userId: string) => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete || userToDelete.role === UserRole.Admin) return;

        // Clean up user's data from rides
        if (userToDelete.role === UserRole.Driver) {
            // Remove the driver's car from all rides
            const ridesToUpdate = rides.filter(ride => ride.cars.some(car => car.driverId === userId));
            for (const ride of ridesToUpdate) {
                const updatedCars = ride.cars.filter(car => car.driverId !== userId);
                await updateDoc(doc(db, 'rides', ride.id), { cars: updatedCars });
            }
        } else if (userToDelete.role === UserRole.Passenger) {
            // Remove the passenger's bookings from all rides
            const ridesToUpdate = rides.filter(ride => ride.cars.some(car => car.bookings.some(b => b.passengerId === userId)));
            for (const ride of ridesToUpdate) {
                const updatedCars = ride.cars.map(car => ({
                    ...car,
                    bookings: car.bookings.filter(b => b.passengerId !== userId)
                }));
                await updateDoc(doc(db, 'rides', ride.id), { cars: updatedCars });
            }
        }

        // Finally, delete the user document
        await deleteDoc(doc(db, 'users', userId));
    };
    
    const updateProfilePicture = async (userId: string, picture: string) => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { profilePicture: picture });
    };

    const addCarToRide = async (rideId: string, driver: User) => {
        if (!driver.car) return;
        const ride = rides.find(r => r.id === rideId);
        if (ride && !ride.cars.some(c => c.driverId === driver.id)) {
            const newRideCar: RideCar = { carId: driver.car.id, driverId: driver.id, bookings: [] };
            const updatedCars = [...ride.cars, newRideCar];
            await updateDoc(doc(db, 'rides', rideId), { cars: updatedCars });
        }
    };

    const removeCarFromRide = async (rideId: string, driverId: string) => {
        const ride = rides.find(r => r.id === rideId);
        if (ride) {
            const updatedCars = ride.cars.filter(c => c.driverId !== driverId);
            await updateDoc(doc(db, 'rides', rideId), { cars: updatedCars });
        }
    };

    const bookSeat = async (rideId: string, carId: string, passenger: User) => {
        const ride = rides.find(r => r.id === rideId);
        if (!ride) return;

        const alreadyBooked = ride.cars.some(c => c.bookings.some(b => b.passengerId === passenger.id));
        if (alreadyBooked) return;

        const updatedCars = ride.cars.map(car => {
            if (car.carId === carId) {
                const driver = users.find(u => u.id === car.driverId);
                if (driver?.car && car.bookings.length < driver.car.seats) {
                    const newBooking: Booking = { passengerId: passenger.id, passengerName: passenger.name };
                    return { ...car, bookings: [...car.bookings, newBooking] };
                }
            }
            return car;
        });

        await updateDoc(doc(db, 'rides', rideId), { cars: updatedCars });
    };

    const cancelBooking = async (rideId: string, passengerId: string) => {
        const ride = rides.find(r => r.id === rideId);
        if (ride) {
            const updatedCars = ride.cars.map(car => ({
                ...car,
                bookings: car.bookings.filter(b => b.passengerId !== passengerId),
            }));
            await updateDoc(doc(db, 'rides', rideId), { cars: updatedCars });
        }
    };
    
    const contextValue: AppContextType = {
        currentUser,
        users,
        rides,
        isLoading,
        login,
        logout,
        register,
        createRide,
        updateRide,
        deleteRide,
        updateProfile,
        deleteUser,
        updateProfilePicture,
        addCarToRide,
        removeCarFromRide,
        bookSeat,
        cancelBooking,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};