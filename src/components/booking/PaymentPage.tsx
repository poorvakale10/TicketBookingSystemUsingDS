import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Shield, Clock, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';
import { BookingData } from '@/pages/Index';
import { toast } from '@/hooks/use-toast';

interface PaymentPageProps {
  bookingData: BookingData;
  onPaymentSuccess: (bookingId: string) => void;
  onBack: () => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  bookingData,
  onPaymentSuccess,
  onBack
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    upiId: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (paymentMethod === 'card') {
      if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length !== 16) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }
      if (!formData.expiryDate || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Please enter expiry date in MM/YY format';
      }
      if (!formData.cvv || formData.cvv.length !== 3) {
        newErrors.cvv = 'Please enter a valid 3-digit CVV';
      }
      if (!formData.cardholderName.trim()) {
        newErrors.cardholderName = 'Please enter cardholder name';
      }
    } else {
      if (!formData.upiId || !formData.upiId.includes('@')) {
        newErrors.upiId = 'Please enter a valid UPI ID';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
    }

    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
      if (formattedValue.length > 5) formattedValue = formattedValue.slice(0, 5);
    }

    // Format CVV
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 3);
    }

    setFormData(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast({
        title: 'Please fix the errors',
        description: 'Check the form fields and try again',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 90% success rate simulation
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        const bookingId = `BK${Date.now().toString().slice(-8)}`;
        toast({
          title: 'Payment Successful!',
          description: `Your booking ${bookingId} has been confirmed`,
        });
        onPaymentSuccess(bookingId);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'There was an issue processing your payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            className="gap-2 hover:bg-muted"
            disabled={isProcessing}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Seat Selection
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-32">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">{bookingData.movie.title}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {bookingData.showtime}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      CinemaBook Theater - Screen 1
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selected Seats</Label>
                  <div className="flex flex-wrap gap-1">
                    {bookingData.selectedSeats.map(seat => (
                      <Badge key={seat} variant="secondary">{seat}</Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tickets ({bookingData.selectedSeats.length})</span>
                    <span>${(bookingData.totalAmount - 2.50).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Booking Fee</span>
                    <span>$2.50</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${bookingData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-green-600 font-medium">100% Secure Payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Select Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="h-12 gap-2"
                      disabled={isProcessing}
                    >
                      <CreditCard className="w-4 h-4" />
                      Credit/Debit Card
                    </Button>
                    <Button
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('upi')}
                      className="h-12 gap-2"
                      disabled={isProcessing}
                    >
                      📱 UPI
                    </Button>
                  </div>
                </div>

                {/* Payment Forms */}
                {paymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                        className={errors.cardNumber ? 'border-red-500' : ''}
                        disabled={isProcessing}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-sm">{errors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          className={errors.expiryDate ? 'border-red-500' : ''}
                          disabled={isProcessing}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-500 text-sm">{errors.expiryDate}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => handleInputChange('cvv', e.target.value)}
                          className={errors.cvv ? 'border-red-500' : ''}
                          disabled={isProcessing}
                        />
                        {errors.cvv && (
                          <p className="text-red-500 text-sm">{errors.cvv}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cardholderName">Cardholder Name</Label>
                      <Input
                        id="cardholderName"
                        placeholder="John Doe"
                        value={formData.cardholderName}
                        onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                        className={errors.cardholderName ? 'border-red-500' : ''}
                        disabled={isProcessing}
                      />
                      {errors.cardholderName && (
                        <p className="text-red-500 text-sm">{errors.cardholderName}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        placeholder="username@upi"
                        value={formData.upiId}
                        onChange={(e) => handleInputChange('upiId', e.target.value)}
                        className={errors.upiId ? 'border-red-500' : ''}
                        disabled={isProcessing}
                      />
                      {errors.upiId && (
                        <p className="text-red-500 text-sm">{errors.upiId}</p>
                      )}
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">
                        You will be redirected to your UPI app to complete the payment
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Button */}
                <Button 
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold"
                  size="lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    <>
                      Pay ${bookingData.totalAmount.toFixed(2)}
                    </>
                  )}
                </Button>

                {/* Security Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-green-800">Secure Payment</p>
                      <p className="text-xs text-green-700">
                        Your payment is protected by 256-bit SSL encryption. We never store your card details.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};