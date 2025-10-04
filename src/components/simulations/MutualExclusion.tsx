import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Unlock, User, Timer, AlertCircle } from 'lucide-react';

interface Process {
  id: string;
  name: string;
  status: 'waiting' | 'requesting' | 'in-critical' | 'completed' | 'blocked';
  requestTime: number;
  priority: number;
}

interface MutualExclusionProps {
  isActive: boolean;
  addLog: (type: 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport' | 'booking', message: string, nodeId?: string) => void;
  setSeatBookings: React.Dispatch<React.SetStateAction<{[key: string]: 'available' | 'booked' | 'locked' | 'syncing' | 'selected'}>>;
}

export const MutualExclusion: React.FC<MutualExclusionProps> = ({ isActive, addLog, setSeatBookings }) => {
  const [processes, setProcesses] = useState<Process[]>([
    { id: 'user-1', name: 'User Alice', status: 'waiting', requestTime: 0, priority: 1 },
    { id: 'user-2', name: 'User Bob', status: 'waiting', requestTime: 0, priority: 2 },
    { id: 'user-3', name: 'User Carol', status: 'waiting', requestTime: 0, priority: 3 },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentHolder, setCurrentHolder] = useState<string | null>(null);
  const [criticalResource, setCriticalResource] = useState<string>('C2');
  const [algorithm, setAlgorithm] = useState<'ricart-agrawala' | 'token-ring'>('ricart-agrawala');

  useEffect(() => {
    if (isActive && !isRunning) {
      simulateMutualExclusion();
    }
  }, [isActive]);

  const simulateMutualExclusion = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    addLog('mutex', `Starting mutual exclusion simulation using ${algorithm} algorithm`);
    
    // Reset processes
    setProcesses(prev => prev.map(p => ({ ...p, status: 'waiting' })));
    setCurrentHolder(null);

    // Simulate concurrent requests for the same seat
    addLog('mutex', `Multiple users requesting seat ${criticalResource} simultaneously`);
    setSeatBookings(prev => ({ ...prev, [criticalResource]: 'locked' }));

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (algorithm === 'ricart-agrawala') {
      await simulateRicartAgrawala();
    } else {
      await simulateTokenRing();
    }

    setIsRunning(false);
  };

  const simulateRicartAgrawala = async () => {
    addLog('mutex', 'Ricart-Agrawala: All processes requesting critical section');
    
    // All processes request at the same time
    const requestTime = Date.now();
    setProcesses(prev => prev.map(p => ({ 
      ...p, 
      status: 'requesting', 
      requestTime: requestTime + Math.random() * 100 
    })));

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Process with earliest timestamp gets access first
    const sortedByTime = [...processes].sort((a, b) => a.requestTime - b.requestTime);
    
    for (const process of sortedByTime) {
      // Request permission from all other processes
      addLog('mutex', `${process.name} requesting permission from all other processes`, process.id);
      setProcesses(prev => prev.map(p => 
        p.id === process.id ? { ...p, status: 'requesting' } : 
        p.status === 'requesting' ? { ...p, status: 'blocked' } : p
      ));

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Enter critical section
      addLog('mutex', `${process.name} received all permissions - entering critical section`, process.id);
      setProcesses(prev => prev.map(p => 
        p.id === process.id ? { ...p, status: 'in-critical' } : p
      ));
      setCurrentHolder(process.id);

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Exit critical section
      addLog('mutex', `${process.name} completed booking - releasing critical section`, process.id);
      setProcesses(prev => prev.map(p => 
        p.id === process.id ? { ...p, status: 'completed' } : 
        p.status === 'blocked' ? { ...p, status: 'requesting' } : p
      ));
      setCurrentHolder(null);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSeatBookings(prev => ({ ...prev, [criticalResource]: 'booked' }));
    addLog('mutex', 'Ricart-Agrawala completed - seat booked by first requester');
  };

  const simulateTokenRing = async () => {
    addLog('mutex', 'Token Ring: Passing token around the ring');
    
    for (let i = 0; i < processes.length; i++) {
      const process = processes[i];
      
      // Token arrives at process
      addLog('mutex', `Token arrived at ${process.name}`, process.id);
      setProcesses(prev => prev.map(p => 
        p.id === process.id ? { ...p, status: 'in-critical' } : { ...p, status: 'waiting' }
      ));
      setCurrentHolder(process.id);

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (i === 0) { // First process books the seat
        addLog('mutex', `${process.name} books the seat and releases token`, process.id);
        setSeatBookings(prev => ({ ...prev, [criticalResource]: 'booked' }));
        setProcesses(prev => prev.map(p => 
          p.id === process.id ? { ...p, status: 'completed' } : p
        ));
      } else {
        addLog('mutex', `${process.name} finds seat already booked - passing token`, process.id);
        setProcesses(prev => prev.map(p => 
          p.id === process.id ? { ...p, status: 'completed' } : p
        ));
      }

      setCurrentHolder(null);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    addLog('mutex', 'Token Ring completed - mutual exclusion maintained');
  };

  const getStatusIcon = (status: Process['status']) => {
    switch (status) {
      case 'waiting':
        return <Timer className="w-4 h-4 text-gray-500" />;
      case 'requesting':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'in-critical':
        return <Lock className="w-4 h-4 text-red-500" />;
      case 'completed':
        return <Unlock className="w-4 h-4 text-green-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: Process['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="outline">Waiting</Badge>;
      case 'requesting':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Requesting</Badge>;
      case 'in-critical':
        return <Badge className="bg-red-500 hover:bg-red-600">In Critical Section</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case 'blocked':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Blocked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={simulateMutualExclusion} 
          disabled={isRunning}
          size="sm"
          className="flex-1"
        >
          <Lock className="w-4 h-4 mr-2" />
          {isRunning ? 'Running...' : 'Simulate Mutex'}
        </Button>
        <Button 
          onClick={() => setAlgorithm(algorithm === 'ricart-agrawala' ? 'token-ring' : 'ricart-agrawala')}
          variant="outline"
          size="sm"
          disabled={isRunning}
        >
          Switch Algorithm
        </Button>
      </div>

      <div className="text-center p-2 bg-muted rounded-lg">
        <p className="text-sm font-medium">
          Algorithm: <span className="text-primary">{algorithm === 'ricart-agrawala' ? 'Ricart-Agrawala' : 'Token Ring'}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Critical Resource: Seat {criticalResource}
        </p>
      </div>

      <div className="space-y-2">
        {processes.map((process) => (
          <div
            key={process.id}
            className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
              currentHolder === process.id ? 'bg-red-50 border-red-200' : 'bg-card'
            }`}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(process.status)}
              <div>
                <h4 className="text-sm font-medium">{process.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Priority: {process.priority}
                  {process.requestTime > 0 && ` • Request time: ${process.requestTime}`}
                </p>
              </div>
            </div>
            {getStatusBadge(process.status)}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">Goal:</span> Ensure only one user can book a seat at a time</p>
        <p><span className="font-medium">Current:</span> {algorithm === 'ricart-agrawala' ? 'Permission-based approach' : 'Token-passing approach'}</p>
      </div>
    </div>
  );
};