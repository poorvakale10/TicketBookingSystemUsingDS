import React, { useState, useEffect } from 'react';
import { HomePage } from '@/components/booking/HomePage';
import { MovieDetails } from '@/components/booking/MovieDetails';
import { SeatSelection } from '@/components/booking/SeatSelection';
import { PaymentPage } from '@/components/booking/PaymentPage';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { LoginModal } from '@/components/booking/LoginModal';
import { Header } from '@/components/booking/Header';
import { DistributedSystemsManager } from '@/lib/distributed-systems';

// Background distributed systems initialization
const dsManager = new DistributedSystemsManager();

export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: string;
  rating: number;
  image: string;
  description: string;
  showtimes: string[];
  price: number;
}

export interface BookingData {
  movie: Movie;
  showtime: string;
  selectedSeats: string[];
  totalAmount: number;
  bookingId?: string;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'movie-details' | 'seat-selection' | 'payment' | 'confirmation'>('home');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<string>('');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  // Initialize distributed systems on mount
  useEffect(() => {
    dsManager.initialize();
  }, []);

  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentPage('movie-details');
  };

  const handleShowtimeSelect = (movie: Movie, showtime: string) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setSelectedMovie(movie);
    setSelectedShowtime(showtime);
    setCurrentPage('seat-selection');
  };

  const handleSeatSelection = (seats: string[], totalAmount: number) => {
    if (!selectedMovie) return;
    
    const booking: BookingData = {
      movie: selectedMovie,
      showtime: selectedShowtime,
      selectedSeats: seats,
      totalAmount
    };
    setBookingData(booking);
    setCurrentPage('payment');
  };

  const handlePaymentSuccess = (bookingId: string) => {
    if (bookingData) {
      // Convert locks to booked seats on success (clear locks owned by anyone for these seats)
      try {
        const lockKey = `lockedSeats:${bookingData.movie.id}:${bookingData.showtime}`;
        const rawLocks = typeof window !== 'undefined' ? window.localStorage.getItem(lockKey) : null;
        if (rawLocks) {
          const map: Record<string, { by: string; expiresAt: number }> = JSON.parse(rawLocks);
          let changed = false;
          for (const s of bookingData.selectedSeats) {
            if (map[s]) { delete map[s]; changed = true; }
          }
          if (changed && typeof window !== 'undefined') {
            window.localStorage.setItem(lockKey, JSON.stringify(map));
          }
        }
      } catch {}

      // Persist booked seats for this movie+showtime so SeatSelection remains consistent
      try {
        const storageKey = `bookedSeats:${bookingData.movie.id}:${bookingData.showtime}`;
        const existing = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        const existingList: string[] = existing ? JSON.parse(existing) : [];
        const merged = Array.from(new Set([...existingList, ...bookingData.selectedSeats]));
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, JSON.stringify(merged));
        }
      } catch (err) {
        // Non-blocking: ignore persistence errors
      }

      setBookingData({
        ...bookingData,
        bookingId
      });
      setCurrentPage('confirmation');
      
      // Trigger distributed systems operations in background
      dsManager.processBooking(bookingData.selectedSeats, bookingData.movie.id);
    }
  };

  const handleLogin = (name: string) => {
    setIsLoggedIn(true);
    setUserName(name);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setCurrentPage('home');
  };

  const navigateHome = () => {
    setCurrentPage('home');
    setSelectedMovie(null);
    setSelectedShowtime('');
    setBookingData(null);
  };

  const navigateBack = () => {
    switch (currentPage) {
      case 'movie-details':
        setCurrentPage('home');
        break;
      case 'seat-selection':
        setCurrentPage('movie-details');
        break;
      case 'payment':
        setCurrentPage('seat-selection');
        break;
      case 'confirmation':
        setCurrentPage('home');
        setBookingData(null);
        break;
      default:
        setCurrentPage('home');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isLoggedIn={isLoggedIn}
        userName={userName}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onHomeClick={navigateHome}
      />

      <main className="pt-16">
        {currentPage === 'home' && (
          <HomePage onMovieSelect={handleMovieSelect} />
        )}
        
        {currentPage === 'movie-details' && selectedMovie && (
          <MovieDetails 
            movie={selectedMovie} 
            onShowtimeSelect={handleShowtimeSelect}
            onBack={navigateBack}
          />
        )}
        
        {currentPage === 'seat-selection' && selectedMovie && (
          <SeatSelection 
            movie={selectedMovie}
            showtime={selectedShowtime}
            onSeatSelection={handleSeatSelection}
            onBack={navigateBack}
          />
        )}
        
        {currentPage === 'payment' && bookingData && (
          <PaymentPage 
            bookingData={bookingData}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={navigateBack}
          />
        )}
        
        {currentPage === 'confirmation' && bookingData && (
          <BookingConfirmation 
            bookingData={bookingData}
            onNewBooking={navigateHome}
          />
        )}
      </main>

      {showLoginModal && (
        <LoginModal 
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
};

export default Index;