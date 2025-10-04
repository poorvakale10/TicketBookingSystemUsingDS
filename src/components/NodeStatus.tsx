import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Wifi, WifiOff, RotateCw } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'syncing';
  lastHeartbeat: Date;
  load: number;
}

interface NodeStatusProps {
  addLog: (type: 'booking' | 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport', message: string, nodeId?: string) => void;
}

export const NodeStatus: React.FC<NodeStatusProps> = ({ addLog }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'node-1', name: 'Primary Server', status: 'online', lastHeartbeat: new Date(), load: 45 },
    { id: 'node-2', name: 'Replica Server A', status: 'online', lastHeartbeat: new Date(), load: 32 },
    { id: 'node-3', name: 'Replica Server B', status: 'online', lastHeartbeat: new Date(), load: 28 },
    { id: 'node-4', name: 'Load Balancer', status: 'syncing', lastHeartbeat: new Date(), load: 15 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prevNodes => 
        prevNodes.map(node => {
          // Simulate random status changes and load variations
          const random = Math.random();
          let newStatus = node.status;
          let newLoad = Math.max(10, Math.min(90, node.load + (Math.random() - 0.5) * 10));

          // Occasionally change status
          if (random < 0.05) { // 5% chance
            if (node.status === 'online') {
              newStatus = 'syncing';
              addLog('replication', `Node ${node.id} started synchronization`, node.id);
            } else if (node.status === 'syncing') {
              newStatus = 'online';
              addLog('replication', `Node ${node.id} synchronization completed`, node.id);
            }
          }

          return {
            ...node,
            status: newStatus,
            lastHeartbeat: new Date(),
            load: Math.round(newLoad)
          };
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [addLog]);

  const getStatusIcon = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'syncing':
        return <RotateCw className="w-4 h-4 animate-spin" />;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: Node['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="node-online">Online</Badge>;
      case 'offline':
        return <Badge className="node-offline">Offline</Badge>;
      case 'syncing':
        return <Badge className="node-syncing">Syncing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 30) return 'bg-green-500';
    if (load < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          Distributed Nodes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {getStatusIcon(node.status)}
              </div>
              <div>
                <h4 className="font-medium text-sm">{node.name}</h4>
                <p className="text-xs text-muted-foreground">{node.id}</p>
              </div>
            </div>
            
            <div className="text-right space-y-2">
              {getStatusBadge(node.status)}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Load:</span>
                <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${getLoadColor(node.load)}`}
                    style={{ width: `${node.load}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8">{node.load}%</span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total Nodes: {nodes.length}</span>
            <span>Online: {nodes.filter(n => n.status === 'online').length}</span>
            <span>Syncing: {nodes.filter(n => n.status === 'syncing').length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};