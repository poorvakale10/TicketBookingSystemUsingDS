import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Share2, Calendar, Clock, MapPin, Users, Mail, Phone, QrCode } from 'lucide-react';
import { BookingData } from '@/pages/Index';

interface BookingConfirmationProps {
  bookingData: BookingData;
  onNewBooking: () => void;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  bookingData,
  onNewBooking
}) => {
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    // Auto-scroll to top when component mounts
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 🔹 Send booking data to backend on confirmation
    fetch("http://localhost:4000/api/confirm-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingData),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Server response:", data.message);
      })
      .catch((err) => {
        console.error("❌ Error sending booking confirmation:", err);
      });
  }, [bookingData]);

  const movieDate = new Date();
  movieDate.setDate(movieDate.getDate() + (Math.random() > 0.5 ? 0 : 1)); // Today or tomorrow

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const generateQRCode = () => {
    // Use public QR service to encode only the bookingId; scanning reveals the ID
    const payload = bookingData.bookingId ?? '';
    const size = 200;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
  };

  const handleDownloadTicket = async () => {
    // Generate a professionally formatted PDF ticket with QR code
    try {
      const { PDFDocument, StandardFonts, rgb } = await import('https://cdn.skypack.dev/pdf-lib');

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4

      const { width, height } = page.getSize();
      const margin = 40;
      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Header bar
      page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: rgb(0.12, 0.45, 0.95) });
      page.drawText('CinemaBook - Digital Ticket', {
        x: margin,
        y: height - 50,
        size: 24,
        font: titleFont,
        color: rgb(1, 1, 1)
      });

      // Booking summary box
      const boxY = height - 160;
      page.drawRectangle({ x: margin, y: boxY - 100, width: width - margin * 2, height: 100, color: rgb(0.96, 0.98, 1) });
      page.drawText(`Movie: ${bookingData.movie.title}`, { x: margin + 14, y: boxY + 60, size: 14, font: textFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawText(`Genre: ${bookingData.movie.genre}`, { x: margin + 14, y: boxY + 40, size: 12, font: textFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(`Showtime: ${bookingData.showtime}`, { x: margin + 14, y: boxY + 20, size: 12, font: textFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(`Seats: ${bookingData.selectedSeats.join(', ')}`, { x: margin + 14, y: boxY, size: 12, font: textFont, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(`Total Paid: $${bookingData.totalAmount.toFixed(2)}`, { x: margin + 14, y: boxY - 20, size: 12, font: textFont, color: rgb(0.2, 0.2, 0.2) });
      if (bookingData.bookingId) {
        page.drawText(`Booking ID: ${bookingData.bookingId}`, { x: margin + 14, y: boxY - 40, size: 12, font: textFont, color: rgb(0.15, 0.15, 0.15) });
      }

      // QR code
      const qrUrl = generateQRCode();
      const qrPngBytes = await fetch(qrUrl).then(r => r.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrPngBytes);
      const qrDim = 150;
      page.drawImage(qrImage, { x: width - margin - qrDim, y: boxY - 20, width: qrDim, height: qrDim });
      page.drawText('Scan for Booking ID', { x: width - margin - qrDim, y: boxY - 40, size: 10, font: textFont, color: rgb(0.3, 0.3, 0.3) });

      // Footer
      page.drawText('Thank you for booking with CinemaBook. Please arrive 15 minutes early.', {
        x: margin,
        y: margin,
        size: 10,
        font: textFont,
        color: rgb(0.4, 0.4, 0.4)
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${bookingData.bookingId ?? 'booking'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF ticket:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Movie Ticket Booking',
      text: `I just booked tickets for ${bookingData.movie.title}! Booking ID: ${bookingData.bookingId}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`Check out my movie booking: ${shareData.text}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center space-y-6 mb-8">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-green-600">Booking Confirmed!</h1>
            <p className="text-xl text-muted-foreground">
              Your tickets have been successfully booked
            </p>
            <div className="flex items-center justify-center gap-2 text-lg">
              <span className="text-muted-foreground">Booking ID:</span>
              <Badge variant="outline" className="text-lg px-3 py-1 font-mono">
                {bookingData.bookingId}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
                <CardTitle className="text-2xl">Digital Ticket</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Movie Poster */}
                  <div className="space-y-4">
                    <img
                      src={bookingData.movie.image}
                      alt={bookingData.movie.title}
                      className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
                    />
                    {showQR && (
                      <div className="text-center">
                        <img
                          src={generateQRCode()}
                          alt="Ticket QR Code"
                          className="w-32 h-32 mx-auto border rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Show this QR code at the theater
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{bookingData.movie.title}</h2>
                      <Badge variant="secondary">{bookingData.movie.genre}</Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{formatDate(movieDate)}</p>
                          <p className="text-sm text-muted-foreground">Show Date</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">{bookingData.showtime}</p>
                          <p className="text-sm text-muted-foreground">Show Time</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium">CinemaBook Theater</p>
                          <p className="text-sm text-muted-foreground">Screen 1, Downtown</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-primary" />
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {bookingData.selectedSeats.map(seat => (
                              <Badge key={seat} variant="outline">{seat}</Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {bookingData.selectedSeats.length} Seat{bookingData.selectedSeats.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total Paid</span>
                        <span className="text-2xl font-bold text-green-600">
                          ${bookingData.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button onClick={handleDownloadTicket} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Ticket
                  </Button>
                  
                  <Button onClick={handleShare} variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share Booking
                  </Button>
                  
                  <Button 
                    onClick={() => setShowQR(!showQR)} 
                    variant="outline" 
                    className="gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    {showQR ? 'Hide QR Code' : 'Show QR Code'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Please arrive at least 15 minutes before showtime</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Carry a valid ID for verification</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Mobile tickets are accepted</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>No outside food or beverages allowed</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p>Tickets are non-refundable</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">+1 (555) 123-4567</p>
                    <p className="text-sm text-muted-foreground">Customer Support</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">support@cinemabook.com</p>
                    <p className="text-sm text-muted-foreground">Email Support</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={onNewBooking}
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              size="lg"
            >
              Book Another Movie
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
