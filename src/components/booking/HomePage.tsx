import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Clock, Search, Filter } from 'lucide-react';
import { Movie } from '@/pages/Index';

interface HomePageProps {
  onMovieSelect: (movie: Movie) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onMovieSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');

  // Sample movie data
  const movies: Movie[] = [
    {
      id: '1',
      title: 'Avatar: The Way of Water',
      genre: 'Action',
      duration: '3h 12m',
      rating: 4.2,
      image: '/images/avatar.jpg',
      description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora.',
      showtimes: ['10:00 AM', '2:00 PM', '6:00 PM', '9:30 PM'],
      price: 12.99
    },
    {
      id: '2',
      title: 'Top Gun: Maverick',
      genre: 'Action',
      duration: '2h 17m',
      rating: 4.5,
      image: '/images/topgunmaverick.jpg',
      description: 'After thirty years, Maverick is still pushing the envelope as a top naval aviator.',
      showtimes: ['11:30 AM', '3:15 PM', '7:00 PM', '10:15 PM'],
      price: 11.99
    },
    {
      id: '3',
      title: 'The Batman',
      genre: 'Action',
      duration: '2h 56m',
      rating: 4.1,
      image: '/images/batman.jpg',
      description: 'Batman ventures into Gotham City\'s underworld when a sadistic killer leaves behind a trail.',
      showtimes: ['1:00 PM', '4:30 PM', '8:00 PM'],
      price: 13.99
    },
    {
      id: '4',
      title: 'Dune',
      genre: 'Sci-Fi',
      duration: '2h 35m',
      rating: 4.3,
      image: '/images/dune.jpg',
      description: 'Paul Atreides leads nomadic tribes in a war against the enemies of his family.',
      showtimes: ['12:30 PM', '4:00 PM', '7:30 PM', '10:45 PM'],
      price: 12.99
    },
    {
      id: '5',
      title: 'Spider-Man: No Way Home',
      genre: 'Action',
      duration: '2h 28m',
      rating: 4.4,
      image: '/images/spiderman.jpg',
      description: 'Spider-Man seeks help from Doctor Strange to restore his secret identity.',
      showtimes: ['11:00 AM', '2:30 PM', '6:15 PM', '9:45 PM'],
      price: 13.99
    },
    {
      id: '6',
      title: 'The French Dispatch',
      genre: 'Comedy',
      duration: '1h 47m',
      rating: 3.8,
      image: '/images/thefrenchdispatch.jpg',
      description: 'A love letter to journalists set in an outpost of an American newspaper.',
      showtimes: ['1:15 PM', '4:45 PM', '8:30 PM'],
      price: 10.99
    }
  ];

  const genres = ['all', 'Action', 'Sci-Fi', 'Comedy', 'Drama'];

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || movie.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Book Your Perfect Movie Experience
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the latest blockbusters and indie gems. Reserve your seats with just a few clicks.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <div className="flex gap-2 flex-wrap">
              {genres.map(genre => (
                <Button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Movies Grid */}
      <section className="px-4 pb-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Now Showing</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map(movie => (
              <Card 
                key={movie.id} 
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                onClick={() => onMovieSelect(movie)}
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={movie.image}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-medium">{movie.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{movie.genre}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {movie.duration}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold text-primary">
                      ${movie.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {movie.showtimes.length} shows today
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredMovies.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No movies found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};