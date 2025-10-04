import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface SeatGridProps {
  seatBookings: {[key: string]: 'available' | 'booked' | 'locked' | 'syncing' | 'selected'};
  setSeatBookings: React.Dispatch<React.SetStateAction<{[key: string]: 'available' | 'booked' | 'locked' | 'syncing' | 'selected'}>>;
  addLog: (type: 'booking' | 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport', message: string, nodeId?: string) => void;
}

export const SeatGrid: React.FC<SeatGridProps> = ({ seatBookings, setSeatBookings, addLog }) => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const rows = 8;
  const seatsPerRow = 6;

  const getSeatStatus = (seatId: string) => {
    return seatBookings[seatId] || 'available';
  };

  const getSeatClassName = (status: string) => {
    switch (status) {
      case 'available':
        return 'seat seat-available';
      case 'booked':
        return 'seat seat-booked';
      case 'locked':
        return 'seat seat-locked';
      case 'syncing':
        return 'seat seat-syncing';
      case 'selected':
        return 'seat seat-selected';
      default:
        return 'seat seat-available';
    }
  };

  const handleSeatClick = useCallback((seatId: string) => {
    const status = getSeatStatus(seatId);
    
    if (status === 'booked' || status === 'locked') {
      toast({
        title: 'Seat Unavailable',
        description: `Seat ${seatId} is currently ${status}`,
        variant: 'destructive'
      });
      return;
    }

    if (selectedSeat === seatId) {
      // Deselect
      setSelectedSeat(null);
      setSeatBookings(prev => ({
        ...prev,
        [seatId]: 'available'
      }));
      addLog('booking', `Seat ${seatId} deselected`);
    } else {
      // Select new seat
      if (selectedSeat) {
        setSeatBookings(prev => ({
          ...prev,
          [selectedSeat]: 'available'
        }));
      }
      setSelectedSeat(seatId);
      setSeatBookings(prev => ({
        ...prev,
        [seatId]: 'selected'
      }));
      addLog('booking', `Seat ${seatId} selected for booking`);
    }
  }, [selectedSeat, setSeatBookings, addLog]);

  const confirmBooking = useCallback(() => {
    if (!selectedSeat) {
      toast({
        title: 'No Seat Selected',
        description: 'Please select a seat to book',
        variant: 'destructive'
      });
      return;
    }

    // Simulate booking process with mutual exclusion
    setSeatBookings(prev => ({
      ...prev,
      [selectedSeat]: 'locked'
    }));
    addLog('mutex', `Acquiring lock for seat ${selectedSeat}`);

    setTimeout(() => {
      setSeatBookings(prev => ({
        ...prev,
        [selectedSeat]: 'booked'
      }));
      addLog('booking', `Seat ${selectedSeat} successfully booked!`);
      toast({
        title: 'Booking Confirmed',
        description: `Seat ${selectedSeat} has been booked successfully`,
      });
      setSelectedSeat(null);
    }, 2000);
  }, [selectedSeat, setSeatBookings, addLog]);

  const generateSeatGrid = () => {
    const grid = [];
    for (let row = 1; row <= rows; row++) {
      const seatRow = [];
      for (let seat = 1; seat <= seatsPerRow; seat++) {
        const seatId = `${String.fromCharCode(64 + row)}${seat}`;
        const status = getSeatStatus(seatId);
        
        seatRow.push(
          <div
            key={seatId}
            className={getSeatClassName(status)}
            onClick={() => handleSeatClick(seatId)}
            title={`Seat ${seatId} - ${status}`}
          >
            <span className="text-xs font-medium text-white drop-shadow-sm">
              {seatId}
            </span>
          </div>
        );
      }
      
      grid.push(
        <div key={row} className="flex justify-center gap-2 mb-2">
          {seatRow.slice(0, 3)}
          <div className="w-8"></div> {/* Aisle */}
          {seatRow.slice(3)}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="space-y-4">
      {/* Screen */}
      <div className="w-full h-4 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full mb-8 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-primary">SCREEN</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-2">
        {generateSeatGrid()}
      </div>

      {/* Booking Controls */}
      {selectedSeat && (
        <div className="pt-4 border-t fade-in">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-primary">Seat {selectedSeat}</span>
            </p>
            <Button 
              onClick={confirmBooking}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              Confirm Booking
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};