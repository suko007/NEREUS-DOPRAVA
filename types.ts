export enum UserRole {
  Admin = 'ADMIN',
  Driver = 'VODIČ',
  Passenger = 'CESTUJÚCI',
}

export interface Car {
  id: string;
  type: string;
  seats: number;
  driverId: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string;
  car?: Car;
  profilePicture?: string;
}

export interface Booking {
  passengerId: string;
  passengerName: string;
}

export interface RideCar {
  carId: string;
  driverId: string;
  bookings: Booking[];
}

export interface Ride {
  id: string;
  destination: string;
  date: string;
  time: string;
  meetingPlace: string;
  cars: RideCar[];
}