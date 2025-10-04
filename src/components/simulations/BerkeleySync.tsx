import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Pause } from 'lucide-react';

interface Node {
  id: string;
  time: number;
  offset: number;
}

interface BerkeleySyncProps {
  isActive: boolean;
  addLog: (type: 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport' | 'booking', message: string, nodeId?: string) => void;
}

export const BerkeleySync: React.FC<BerkeleySyncProps> = ({ isActive, addLog }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'Master', time: 12.0, offset: 0 },
    { id: 'Node-A', time: 12.3, offset: 0.3 },
    { id: 'Node-B', time: 11.7, offset: -0.3 },
    { id: 'Node-C', time: 12.1, offset: 0.1 },
  ]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    if (isActive && !isSyncing) {
      runSync();
    }
  }, [isActive]);

  const runSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    setSyncProgress(0);
    addLog('berkeley', 'Berkeley Time Synchronization started', 'Master');

    // 🔹 notify backend that Berkeley sync started
    sendToBackend('Berkeley Sync started');

    // Step 1: Master requests time
    setSyncProgress(25);
    addLog('berkeley', 'Master requesting time from all slave nodes');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Calculate average offset
    const totalOffset = nodes.reduce((sum, node) => sum + node.offset, 0);
    const avgOffset = totalOffset / nodes.length;
    setSyncProgress(50);
    addLog('berkeley', `Calculated average offset: ${avgOffset.toFixed(2)}s`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Send adjustment
    setSyncProgress(75);
    const adjustedNodes = nodes.map(node => {
      const adjustment = avgOffset - node.offset;
      addLog('berkeley', `Sending adjustment ${adjustment.toFixed(2)}s to ${node.id}`, node.id);
      return {
        ...node,
        time: node.time + adjustment,
        offset: 0
      };
    });

    setNodes(adjustedNodes);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSyncProgress(100);
    addLog('berkeley', 'All nodes synchronized successfully!');
    sendToBackend('Berkeley Sync completed - All nodes synchronized');

    setTimeout(() => {
      setIsSyncing(false);
      setSyncProgress(0);
    }, 1000);
  };

  const resetClocks = () => {
    setNodes([
      { id: 'Master', time: 12.0, offset: 0 },
      { id: 'Node-A', time: 12.0 + Math.random() * 0.6 - 0.3, offset: Math.random() * 0.6 - 0.3 },
      { id: 'Node-B', time: 12.0 + Math.random() * 0.6 - 0.3, offset: Math.random() * 0.6 - 0.3 },
      { id: 'Node-C', time: 12.0 + Math.random() * 0.6 - 0.3, offset: Math.random() * 0.6 - 0.3 },
    ]);
    addLog('berkeley', 'Clock synchronization reset - nodes have random drift');
    sendToBackend('Berkeley Sync reset - nodes drifted again');
  };

  // 🔹 helper to send sync events to backend
  const sendToBackend = (message: string) => {
    fetch("http://localhost:4000/api/berkeley-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, timestamp: new Date().toISOString() })
    }).catch(err => console.error("❌ Backend error:", err));
  };

  const getNodeColor = (node: Node) => {
    if (node.id === 'Master') return 'bg-primary text-primary-foreground';
    if (Math.abs(node.offset) < 0.1) return 'bg-green-500 text-white';
    if (Math.abs(node.offset) < 0.2) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={runSync} 
          disabled={isSyncing}
          size="sm"
          className="flex-1"
        >
          {isSyncing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isSyncing ? 'Syncing...' : 'Run Sync'}
        </Button>
        <Button onClick={resetClocks} variant="outline" size="sm">
          Reset
        </Button>
      </div>

      {isSyncing && (
        <div className="space-y-2">
          <Progress value={syncProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Synchronization Progress: {syncProgress}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{node.id}</span>
              <Badge className={getNodeColor(node)} variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {node.time.toFixed(1)}s
              </Badge>
            </div>
            {node.offset !== 0 && (
              <div className="text-xs text-muted-foreground">
                Offset: {node.offset > 0 ? '+' : ''}{node.offset.toFixed(2)}s
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">Algorithm:</span> Berkeley Time Synchronization</p>
        <p><span className="font-medium">Master:</span> Collects time from all nodes, calculates average</p>
        <p><span className="font-medium">Slaves:</span> Adjust their clocks based on master's instruction</p>
      </div>
    </div>
  );
};
