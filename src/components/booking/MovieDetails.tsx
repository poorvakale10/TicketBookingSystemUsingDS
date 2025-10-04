import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Clock, Calendar, MapPin } from 'lucide-react';
import { Movie } from '@/pages/Index';

interface MovieDetailsProps {
  movie: Movie;
  onShowtimeSelect: (movie: Movie, showtime: string) => void;
  onBack: () => void;
}

export const MovieDetails: React.FC<MovieDetailsProps> = ({ 
  movie, 
  onShowtimeSelect, 
  onBack 
}) => {
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Back Button */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="gap-2 hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Movies
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Poster */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden sticky top-32">
              <div className="aspect-[2/3]">
                <img
                  src={movie.image}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>

          {/* Movie Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold">{movie.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-lg font-semibold">{movie.rating}</span>
                  <span className="text-muted-foreground">/5</span>
                </div>
                
                <Badge variant="secondary" className="text-sm">
                  {movie.genre}
                </Badge>
                
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{movie.duration}</span>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                {movie.description}
              </p>
            </div>

            {/* Showtimes */}
            <Card className="p-6">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-semibold">Select Showtime</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>CinemaBook Theater - Downtown</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium">{today}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {movie.showtimes.map((showtime, index) => {
                        const isPrime = showtime.includes('PM') && 
                          (showtime.startsWith('6') || showtime.startsWith('7') || showtime.startsWith('8'));
                        
                        return (
                          <Button
                            key={index}
                            onClick={() => onShowtimeSelect(movie, showtime)}
                            variant="outline"
                            className="h-12 flex flex-col gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <span className="font-semibold">{showtime}</span>
                            <span className="text-xs">
                              ${isPrime ? (movie.price + 2).toFixed(2) : movie.price.toFixed(2)}
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Pricing Information</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Regular shows: ${movie.price.toFixed(2)}</p>
                    <p>• Prime time (6-8 PM): ${(movie.price + 2).toFixed(2)}</p>
                    <p>• All prices exclude booking fees</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Theater Features</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Dolby Atmos Sound System</li>
                  <li>• 4K Digital Projection</li>
                  <li>• Comfortable Reclining Seats</li>
                  <li>• Air Conditioning</li>
                  <li>• Concessions Available</li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Booking Policy</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Tickets are non-refundable</li>
                  <li>• Arrive 15 minutes before showtime</li>
                  <li>• ID required for rated movies</li>
                  <li>• No outside food allowed</li>
                  <li>• Mobile tickets accepted</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};