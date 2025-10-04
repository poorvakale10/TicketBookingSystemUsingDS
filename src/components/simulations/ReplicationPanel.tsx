import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Server, Copy, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Replica {
  id: string;
  name: string;
  status: 'synced' | 'syncing' | 'outdated' | 'failed';
  lastSync: Date;
  version: number;
}

interface ReplicationPanelProps {
  isActive: boolean;
  addLog: (type: 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport' | 'booking', message: string, nodeId?: string) => void;
  seatBookings: {[key: string]: 'available' | 'booked' | 'locked' | 'syncing' | 'selected'};
  setSeatBookings: React.Dispatch<React.SetStateAction<{[key: string]: 'available' | 'booked' | 'locked' | 'syncing' | 'selected'}>>;
}

export const ReplicationPanel: React.FC<ReplicationPanelProps> = ({ 
  isActive, 
  addLog, 
  seatBookings, 
  setSeatBookings 
}) => {
  const [replicas, setReplicas] = useState<Replica[]>([
    { id: 'primary', name: 'Primary DB', status: 'synced', lastSync: new Date(), version: 100 },
    { id: 'replica-1', name: 'Replica US-East', status: 'synced', lastSync: new Date(), version: 100 },
    { id: 'replica-2', name: 'Replica EU-West', status: 'outdated', lastSync: new Date(Date.now() - 30000), version: 98 },
    { id: 'replica-3', name: 'Replica Asia-Pacific', status: 'synced', lastSync: new Date(), version: 100 },
  ]);
  const [isReplicating, setIsReplicating] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    if (isActive && !isReplicating) {
      startReplication();
    }
  }, [isActive]);

  const startReplication = async () => {
    if (isReplicating) return;
    
    setIsReplicating(true);
    setSyncProgress(0);
    addLog('replication', 'Starting replication process across all nodes');

    // Simulate a seat booking that needs to be replicated
    const seatToBook = 'B4';
    setSeatBookings(prev => ({ ...prev, [seatToBook]: 'syncing' }));
    addLog('replication', `New booking for seat ${seatToBook} - initiating replication`);

    // Mark replicas as syncing
    setReplicas(prev => prev.map(replica => 
      replica.id !== 'primary' ? { ...replica, status: 'syncing' } : replica
    ));

    // Simulate replication process
    for (let i = 1; i <= 4; i++) {
      setSyncProgress(i * 25);
      
      if (i === 1) {
        addLog('replication', 'Primary database updated with new booking', 'primary');
        setReplicas(prev => prev.map(replica => 
          replica.id === 'primary' ? { ...replica, version: replica.version + 1, lastSync: new Date() } : replica
        ));
      } else {
        const replicaId = `replica-${i - 1}`;
        const replica = replicas.find(r => r.id === replicaId);
        if (replica) {
          addLog('replication', `Syncing ${replica.name}...`, replicaId);
          
          // Simulate occasional replication delay or failure
          const delay = Math.random() * 1000 + 500;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (Math.random() > 0.1) { // 90% success rate
            setReplicas(prev => prev.map(r => 
              r.id === replicaId ? { 
                ...r, 
                status: 'synced', 
                version: prev.find(p => p.id === 'primary')?.version || 100,
                lastSync: new Date() 
              } : r
            ));
            addLog('replication', `${replica.name} synchronized successfully`, replicaId);
          } else {
            setReplicas(prev => prev.map(r => 
              r.id === replicaId ? { ...r, status: 'failed' } : r
            ));
            addLog('replication', `${replica.name} synchronization failed - retry needed`, replicaId);
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setSyncProgress(100);
    setSeatBookings(prev => ({ ...prev, [seatToBook]: 'booked' }));
    addLog('replication', 'Replication process completed - data consistency maintained');
    
    setTimeout(() => {
      setIsReplicating(false);
      setSyncProgress(0);
    }, 1000);
  };

  const retryFailedReplicas = async () => {
    const failedReplicas = replicas.filter(r => r.status === 'failed');
    if (failedReplicas.length === 0) return;

    addLog('replication', 'Retrying failed replica synchronizations');
    
    for (const replica of failedReplicas) {
      setReplicas(prev => prev.map(r => 
        r.id === replica.id ? { ...r, status: 'syncing' } : r
      ));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReplicas(prev => prev.map(r => 
        r.id === replica.id ? { 
          ...r, 
          status: 'synced', 
          version: prev.find(p => p.id === 'primary')?.version || 100,
          lastSync: new Date() 
        } : r
      ));
      
      addLog('replication', `${replica.name} retry successful`, replica.id);
    }
  };

  const getStatusIcon = (status: Replica['status']) => {
    switch (status) {
      case 'synced':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <Copy className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'outdated':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: Replica['status']) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-500 hover:bg-green-600">Synced</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Syncing</Badge>;
      case 'outdated':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Outdated</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const syncedCount = replicas.filter(r => r.status === 'synced').length;
  const failedCount = replicas.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={startReplication} 
          disabled={isReplicating}
          size="sm"
          className="flex-1"
        >
          <Copy className="w-4 h-4 mr-2" />
          {isReplicating ? 'Replicating...' : 'Simulate Replication'}
        </Button>
        {failedCount > 0 && (
          <Button onClick={retryFailedReplicas} variant="outline" size="sm">
            Retry Failed
          </Button>
        )}
      </div>

      {isReplicating && (
        <div className="space-y-2">
          <Progress value={syncProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Replication Progress: {syncProgress}%
          </p>
        </div>
      )}

      <div className="space-y-2">
        {replicas.map((replica) => (
          <div
            key={replica.id}
            className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(replica.status)}
              <div>
                <h4 className="text-sm font-medium">{replica.name}</h4>
                <p className="text-xs text-muted-foreground">
                  v{replica.version} • Last sync: {replica.lastSync.toLocaleTimeString()}
                </p>
              </div>
            </div>
            {getStatusBadge(replica.status)}
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-green-600">✓ Synced: {syncedCount}/{replicas.length}</span>
        {failedCount > 0 && (
          <span className="text-red-600">✗ Failed: {failedCount}</span>
        )}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">Strategy:</span> Master-Slave Replication</p>
        <p><span className="font-medium">Consistency:</span> Eventual consistency across all replicas</p>
      </div>
    </div>
  );
};