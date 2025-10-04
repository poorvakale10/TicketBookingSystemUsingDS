import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Send, CheckCircle, XCircle, RotateCw } from 'lucide-react';

interface RPCCall {
  id: string;
  method: string;
  from: string;
  to: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  params?: any;
  result?: any;
}

interface RPCSimulationProps {
  isActive: boolean;
  addLog: (type: 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport' | 'booking', message: string, nodeId?: string) => void;
  setSeatBookings: React.Dispatch<React.SetStateAction<{[key: string]: 'available' | 'booked' | 'locked' | 'syncing' | 'selected'}>>;
}

export const RPCSimulation: React.FC<RPCSimulationProps> = ({ isActive, addLog, setSeatBookings }) => {
  const [rpcCalls, setRpcCalls] = useState<RPCCall[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const nodes = ['Client', 'Gateway', 'BookingService', 'Database'];

  useEffect(() => {
    if (isActive && !isRunning) {
      simulateRPCChain();
    }
  }, [isActive]);

  const simulateRPCChain = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setRpcCalls([]);
    addLog('rpc', 'Starting RPC simulation for seat booking process');

    const seatId = 'A3';
    
    // Step 1: Client to Gateway
    const call1: RPCCall = {
      id: 'rpc-1',
      method: 'bookSeat',
      from: 'Client',
      to: 'Gateway',
      status: 'pending',
      params: { seatId, userId: 'user123' }
    };

    setRpcCalls([call1]);
    addLog('rpc', `Client requesting seat booking via RPC: bookSeat(${seatId})`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setRpcCalls(prev => prev.map(call => 
      call.id === 'rpc-1' ? { ...call, status: 'processing' as const } : call
    ));

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Gateway to BookingService
    const call2: RPCCall = {
      id: 'rpc-2',
      method: 'checkAvailability',
      from: 'Gateway',
      to: 'BookingService',
      status: 'pending',
      params: { seatId }
    };

    setRpcCalls(prev => [
      ...prev.map(call => call.id === 'rpc-1' ? { ...call, status: 'success' as const } : call),
      call2
    ]);
    addLog('rpc', 'Gateway forwarding request to BookingService');

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: BookingService to Database
    const call3: RPCCall = {
      id: 'rpc-3',
      method: 'updateSeatStatus',
      from: 'BookingService',
      to: 'Database',
      status: 'pending',
      params: { seatId, status: 'booked' }
    };

    setRpcCalls(prev => [
      ...prev,
      { ...call2, status: 'success' as const, result: { available: true } },
      call3
    ]);
    addLog('rpc', 'BookingService checking seat availability in database');

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update seat visually
    setSeatBookings(prev => ({
      ...prev,
      [seatId]: 'syncing'
    }));

    setRpcCalls(prev => [
      ...prev.slice(0, -1),
      { ...call3, status: 'success' as const, result: { updated: true } }
    ]);
    addLog('rpc', 'Database updated - seat booking confirmed');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setSeatBookings(prev => ({
      ...prev,
      [seatId]: 'booked'
    }));

    addLog('rpc', 'RPC simulation completed successfully - seat booked!');
    
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const getStatusIcon = (status: RPCCall['status']) => {
    switch (status) {
      case 'pending':
        return <Send className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <RotateCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Send className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: RPCCall['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={simulateRPCChain} 
        disabled={isRunning}
        size="sm"
        className="w-full"
      >
        {isRunning ? (
          <>
            <RotateCw className="w-4 h-4 mr-2 animate-spin" />
            Running RPC Chain...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Simulate RPC Calls
          </>
        )}
      </Button>

      {rpcCalls.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Active RPC Calls:</h4>
          
          {rpcCalls.map((call, index) => (
            <div
              key={call.id}
              className="p-3 border rounded-lg bg-card space-y-2 fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(call.status)}
                  <span className="text-sm font-medium">{call.method}()</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {call.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{call.from}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{call.to}</span>
              </div>

              {call.params && (
                <div className="text-xs bg-muted/50 p-2 rounded">
                  <span className="font-medium">Params:</span> {JSON.stringify(call.params)}
                </div>
              )}

              {call.result && (
                <div className="text-xs bg-green-50 p-2 rounded border border-green-200">
                  <span className="font-medium">Result:</span> {JSON.stringify(call.result)}
                </div>
              )}

              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-500 ${getStatusColor(call.status)}`}
                  style={{ 
                    width: call.status === 'success' ? '100%' : 
                           call.status === 'processing' ? '60%' : 
                           call.status === 'pending' ? '20%' : '0%' 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">RPC Chain:</span> Client → Gateway → Service → Database</p>
        <p><span className="font-medium">Methods:</span> bookSeat(), checkAvailability(), updateSeatStatus()</p>
      </div>
    </div>
  );
};