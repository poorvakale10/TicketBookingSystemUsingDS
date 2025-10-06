import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Users, MapPin } from 'lucide-react';
import { Movie } from '@/pages/Index';
import { toast } from '@/hooks/use-toast';

interface SeatSelectionProps {
  movie: Movie;
  showtime: string;
  onSeatSelection: (seats: string[], totalAmount: number) => void;
  onBack: () => void;
}

interface SeatState {
  [seatId: string]: 'available' | 'booked' | 'selected' | 'locked';
}

interface SeatLockRecord {
  by: string; // session id
  expiresAt: number; // epoch ms
}

export const SeatSelection: React.FC<SeatSelectionProps> = ({ 
  movie, 
  showtime, 
  onSeatSelection, 
  onBack 
}) => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatStates, setSeatStates] = useState<SeatState>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'server';
    const existing = window.sessionStorage.getItem('seatSessionId');
    if (existing) return existing;
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.sessionStorage.setItem('seatSessionId', id);
    return id;
  });
  const lockDurationMs = 10 * 60 * 1000; // 10 minutes

  // Generate theater layout
  const rows = 10;
  const seatsPerRow = 12;
  const aisleAfterSeat = 6;

  // Initialize seat states
  useEffect(() => {
    const initializeSeats = () => {
      const seats: SeatState = {};
      const storageKey = `bookedSeats:${movie.id}:${showtime}`;
      const lockKey = `lockedSeats:${movie.id}:${showtime}`;

      // Build full seat map
      for (let row = 1; row <= rows; row++) {
        for (let seat = 1; seat <= seatsPerRow; seat++) {
          const seatId = `${String.fromCharCode(64 + row)}${seat}`;
          seats[seatId] = 'available';
        }
      }

      // Try to load persisted booked seats for this movie+showtime
      try {
        const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
        if (persisted) {
          const bookedList: string[] = JSON.parse(persisted);
          for (const seatId of bookedList) {
            if (seats[seatId] !== undefined) {
              seats[seatId] = 'booked';
            }
          }
        } else {
          // First-time: generate a stable initial layout, then persist booked seats
          const initiallyBooked: string[] = [];
          for (let row = 1; row <= rows; row++) {
            for (let seat = 1; seat <= seatsPerRow; seat++) {
              const seatId = `${String.fromCharCode(64 + row)}${seat}`;
              const isBooked = Math.random() < 0.15;
              if (isBooked) {
                seats[seatId] = 'booked';
                initiallyBooked.push(seatId);
              }
            }
          }
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(storageKey, JSON.stringify(initiallyBooked));
          }
        }

        // Apply current valid locks
        if (typeof window !== 'undefined') {
          const rawLocks = window.localStorage.getItem(lockKey);
          if (rawLocks) {
            const now = Date.now();
            const lockMap: Record<string, SeatLockRecord> = JSON.parse(rawLocks);
            let mutated = false;
            for (const [seatId, lock] of Object.entries(lockMap)) {
              if (lock.expiresAt <= now) {
                delete lockMap[seatId];
                mutated = true;
              } else if (seats[seatId] === 'available') {
                seats[seatId] = 'locked';
              }
            }
            if (mutated) {
              window.localStorage.setItem(lockKey, JSON.stringify(lockMap));
            }
          }
        }
      } catch (err) {
        // If anything goes wrong, fall back to all available (non-critical)
      }

      setSeatStates(seats);
      setIsLoading(false);
    };

    // Simulate loading time
    setTimeout(initializeSeats, 800);
  }, [movie.id, showtime]);

  // Listen for lock updates from other tabs and periodically clear expired locks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lockKey = `lockedSeats:${movie.id}:${showtime}`;

    const refreshFromLocks = () => {
      const now = Date.now();
      const nextStates: SeatState = { ...seatStates };
      // Start by resetting any previously locked seats (but keep booked and selected)
      for (const [seatId, state] of Object.entries(nextStates)) {
        if (state === 'locked') nextStates[seatId] = 'available';
      }
      const rawLocks = window.localStorage.getItem(lockKey);
      if (rawLocks) {
        const lockMap: Record<string, SeatLockRecord> = JSON.parse(rawLocks);
        let mutated = false;
        for (const [seatId, lock] of Object.entries(lockMap)) {
          if (lock.expiresAt <= now) {
            delete lockMap[seatId];
            mutated = true;
          } else if (nextStates[seatId] === 'available') {
            // Do not override booked or selected
            nextStates[seatId] = 'locked';
          }
        }
        if (mutated) {
          window.localStorage.setItem(lockKey, JSON.stringify(lockMap));
        }
      }
      setSeatStates(nextStates);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === lockKey) {
        refreshFromLocks();
      }
    };
    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(refreshFromLocks, 5000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
    };
  }, [movie.id, showtime, seatStates]);

  const handleSeatClick = (seatId: string) => {
    if (seatStates[seatId] === 'booked' || seatStates[seatId] === 'locked') {
      toast({
        title: 'Seat Unavailable',
        description: `Seat ${seatId} is already booked`,
        variant: 'destructive'
      });
      return;
    }

    if (selectedSeats.includes(seatId)) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(id => id !== seatId));
      setSeatStates(prev => ({ ...prev, [seatId]: 'available' }));
      // Release lock
      try {
        const lockKey = `lockedSeats:${movie.id}:${showtime}`;
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(lockKey) : null;
        const map: Record<string, SeatLockRecord> = raw ? JSON.parse(raw) : {};
        if (map[seatId] && map[seatId].by === sessionId) {
          delete map[seatId];
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(lockKey, JSON.stringify(map));
          }
        }
      } catch {}
    } else {
      // Select seat (max 8 seats)
      if (selectedSeats.length >= 8) {
        toast({
          title: 'Maximum Seats',
          description: 'You can select maximum 8 seats per booking',
          variant: 'destructive'
        });
        return;
      }
      
      setSelectedSeats(prev => [...prev, seatId]);
      setSeatStates(prev => ({ ...prev, [seatId]: 'selected' }));
      // Acquire lock
      try {
        const lockKey = `lockedSeats:${movie.id}:${showtime}`;
        const raw = typeof window !== 'undefined' ? window.localStorage.getItem(lockKey) : null;
        const map: Record<string, SeatLockRecord> = raw ? JSON.parse(raw) : {};
        const now = Date.now();
        map[seatId] = { by: sessionId, expiresAt: now + lockDurationMs };
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(lockKey, JSON.stringify(map));
        }
      } catch {}
    }
  };

  const getSeatClassName = (seatId: string) => {
    const state = seatStates[seatId];
    const baseClass = "w-8 h-8 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-medium";
    
    switch (state) {
      case 'available':
        return `${baseClass} bg-green-500 hover:bg-green-600 text-white hover:scale-110`;
      case 'booked':
        return `${baseClass} bg-red-500 text-white cursor-not-allowed opacity-80`;
      case 'locked':
        return `${baseClass} bg-amber-500 text-white cursor-not-allowed opacity-80`;
      case 'selected':
        return `${baseClass} bg-purple-500 text-white scale-110 shadow-lg`;
      default:
        return `${baseClass} bg-gray-300`;
    }
  };

  const isPrimeTime = showtime.includes('PM') && 
    (showtime.startsWith('6') || showtime.startsWith('7') || showtime.startsWith('8'));
  
  const seatPrice = isPrimeTime ? movie.price + 2 : movie.price;
  const totalAmount = selectedSeats.length * seatPrice;
  const bookingFee = selectedSeats.length > 0 ? 2.50 : 0;
  const grandTotal = totalAmount + bookingFee;

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: 'No Seats Selected',
        description: 'Please select at least one seat',
        variant: 'destructive'
      });
      return;
    }
    
    onSeatSelection(selectedSeats, grandTotal);
  };

  // Release all locks held by this session for this movie+showtime
  const releaseAllLocks = () => {
    try {
      const lockKey = `lockedSeats:${movie.id}:${showtime}`;
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(lockKey) : null;
      if (!raw) return;
      const map: Record<string, SeatLockRecord> = JSON.parse(raw);
      let changed = false;
      for (const seatId of Object.keys(map)) {
        if (map[seatId].by === sessionId) {
          delete map[seatId];
          changed = true;
        }
      }
      if (changed && typeof window !== 'undefined') {
        window.localStorage.setItem(lockKey, JSON.stringify(map));
      }
    } catch {}
  };

  // On unmount (e.g., navigating back), release locks. When proceeding to payment,
  // the next page will handle converting to booked or releasing on cancel.
  useEffect(() => {
    return () => {
      // If the user still has selections here, release them when leaving the page
      releaseAllLocks();
    };
  }, []);

  const generateSeatRow = (rowNumber: number) => {
    const seats = [];
    const rowLetter = String.fromCharCode(64 + rowNumber);
    
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatId = `${rowLetter}${seat}`;
      
      seats.push(
        <div
          key={seatId}
          className={getSeatClassName(seatId)}
          onClick={() => handleSeatClick(seatId)}
          title={`Seat ${seatId} - ${seatStates[seatId]}`}
        >
          {seat}
        </div>
      );
      
      // Add aisle space
      if (seat === aisleAfterSeat) {
        seats.push(<div key={`aisle-${rowNumber}`} className="w-4"></div>);
      }
    }
    
    return (
      <div key={rowNumber} className="flex items-center gap-2 justify-center">
        <div className="w-6 text-center text-sm font-medium text-muted-foreground">
          {rowLetter}
        </div>
        <div className="flex gap-1">
          {seats}
        </div>
        <div className="w-6 text-center text-sm font-medium text-muted-foreground">
          {rowLetter}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading theater layout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={onBack} 
              variant="ghost" 
              className="gap-2 hover:bg-muted"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <div className="text-center space-y-1">
              <h1 className="font-semibold">{movie.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {showtime}
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Screen 1
                </div>
              </div>
            </div>
            
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Screen */}
        <div className="text-center space-y-4">
          <div className="w-full max-w-2xl mx-auto h-6 bg-gradient-to-r from-primary/20 via-primary/60 to-primary/20 rounded-full relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">SCREEN</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">All eyes this way please</p>
        </div>

        {/* Seat Map */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Premium Rows (A-C) */}
            <div className="space-y-2">
              <div className="text-center">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Premium - ${(seatPrice + 3).toFixed(2)}
                </Badge>
              </div>
              {[1, 2, 3].map(row => generateSeatRow(row))}
            </div>

            <div className="py-2"></div>

            {/* Regular Rows (D-J) */}
            <div className="space-y-2">
              <div className="text-center">
                <Badge variant="outline">
                  Regular - ${seatPrice.toFixed(2)}
                </Badge>
              </div>
              {[4, 5, 6, 7, 8, 9, 10].map(row => generateSeatRow(row))}
            </div>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm">Booked</span>
          </div>
        </div>

        {/* Booking Summary */}
        {selectedSeats.length > 0 && (
          <Card className="sticky bottom-4 bg-background/95 backdrop-blur border-2 border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Booking Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Selected Seats:</span>
                {selectedSeats.map(seatId => (
                  <Badge key={seatId} variant="secondary">
                    {seatId}
                  </Badge>
                ))}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{selectedSeats.length} × ${seatPrice.toFixed(2)}</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Booking Fee</span>
                  <span>${bookingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total</span>
                  <span>${grandTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <Button 
                onClick={handleProceed}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                size="lg"
              >
                Proceed to Payment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};