import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Send, ArrowRight, Play } from 'lucide-react';

interface Event {
  id: string;
  nodeId: string;
  type: 'local' | 'send' | 'receive';
  timestamp: number;
  message?: string;
  targetNode?: string;
  globalTime: number;
}

interface Node {
  id: string;
  name: string;
  clock: number;
  color: string;
}

interface LamportClocksProps {
  isActive: boolean;
  addLog: (type: 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport' | 'booking', message: string, nodeId?: string) => void;
}

export const LamportClocks: React.FC<LamportClocksProps> = ({ isActive, addLog }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'A', name: 'Booking Service A', clock: 0, color: 'bg-blue-500' },
    { id: 'B', name: 'Booking Service B', clock: 0, color: 'bg-green-500' },
    { id: 'C', name: 'Database Service', clock: 0, color: 'bg-purple-500' },
  ]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isActive && !isRunning) {
      simulateLamportClocks();
    }
  }, [isActive]);

  const simulateLamportClocks = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setEvents([]);
    setCurrentStep(0);
    
    // Reset clocks
    setNodes(prev => prev.map(node => ({ ...node, clock: 0 })));
    addLog('lamport', 'Starting Lamport Clock simulation for event ordering');

    const simulationEvents = [
      { nodeId: 'A', type: 'local', message: 'User requests seat A1', delay: 1000 },
      { nodeId: 'A', type: 'send', targetNode: 'C', message: 'Check seat availability', delay: 1500 },
      { nodeId: 'B', type: 'local', message: 'User requests seat A1', delay: 500 },
      { nodeId: 'C', type: 'receive', fromNode: 'A', message: 'Received availability check', delay: 1000 },
      { nodeId: 'B', type: 'send', targetNode: 'C', message: 'Check seat availability', delay: 1000 },
      { nodeId: 'C', type: 'local', message: 'Process availability requests', delay: 800 },
      { nodeId: 'C', type: 'send', targetNode: 'A', message: 'Seat available - reserve?', delay: 1200 },
      { nodeId: 'C', type: 'receive', fromNode: 'B', message: 'Received availability check', delay: 500 },
      { nodeId: 'A', type: 'receive', fromNode: 'C', message: 'Confirmed seat reservation', delay: 1000 },
      { nodeId: 'C', type: 'send', targetNode: 'B', message: 'Seat already reserved', delay: 800 },
      { nodeId: 'B', type: 'receive', fromNode: 'C', message: 'Seat unavailable', delay: 600 },
    ];

    for (let i = 0; i < simulationEvents.length; i++) {
      const simEvent = simulationEvents[i];
      setCurrentStep(i + 1);
      
      await new Promise(resolve => setTimeout(resolve, simEvent.delay));
      
      // Update clocks based on Lamport Clock rules
      setNodes(prev => prev.map(node => {
        if (node.id === simEvent.nodeId) {
          // Increment own clock for any event
          const newClock = node.clock + 1;
          
          const event: Event = {
            id: `event-${Date.now()}-${Math.random()}`,
            nodeId: simEvent.nodeId,
            type: simEvent.type as 'local' | 'send' | 'receive',
            timestamp: newClock,
            message: simEvent.message,
            targetNode: simEvent.targetNode,
            globalTime: Date.now()
          };
          
          setEvents(prev => [...prev, event]);
          
          addLog('lamport', 
            `${node.name} (Clock: ${newClock}): ${simEvent.message}`, 
            simEvent.nodeId
          );
          
          return { ...node, clock: newClock };
        } else if (simEvent.type === 'receive' && 'fromNode' in simEvent && simEvent.fromNode === node.id) {
          // For the sender in a receive event, find the timestamp from the send event
          return node;
        } else if (simEvent.type === 'send' && simEvent.targetNode === node.id) {
          // Target node will handle this in the corresponding receive event
          return node;
        }
        return node;
      }));
      
      // Special handling for receive events - update receiver's clock
      if (simEvent.type === 'receive' && 'fromNode' in simEvent) {
        setTimeout(() => {
          setNodes(prev => prev.map(node => {
            if (node.id === simEvent.nodeId) {
              // Receiver updates clock to max(own_clock, message_timestamp) + 1
              const senderNode = prev.find(n => n.id === (simEvent as any).fromNode);
              const newClock = Math.max(node.clock, senderNode?.clock || 0) + 1;
              
              addLog('lamport', 
                `${node.name} updated clock to ${newClock} after receiving message`, 
                simEvent.nodeId
              );
              
              return { ...node, clock: newClock };
            }
            return node;
          }));
        }, 200);
      }
    }

    addLog('lamport', 'Lamport Clock simulation completed - all events properly ordered');
    
    setTimeout(() => {
      setIsRunning(false);
      setCurrentStep(0);
    }, 2000);
  };

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'local':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'send':
        return <Send className="w-4 h-4 text-green-500" />;
      case 'receive':
        return <ArrowRight className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    // Sort by timestamp first, then by node ID for ties
    if (a.timestamp === b.timestamp) {
      return a.nodeId.localeCompare(b.nodeId);
    }
    return a.timestamp - b.timestamp;
  });

  return (
    <div className="space-y-4">
      <Button 
        onClick={simulateLamportClocks} 
        disabled={isRunning}
        size="sm"
        className="w-full"
      >
        <Play className="w-4 h-4 mr-2" />
        {isRunning ? `Running... (${currentStep}/11)` : 'Simulate Lamport Clocks'}
      </Button>

      {/* Node Clocks */}
      <div className="grid grid-cols-3 gap-2">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-3 rounded-lg border bg-card text-center"
          >
            <div className={`w-8 h-8 ${node.color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
              {node.id}
            </div>
            <p className="text-xs font-medium">{node.name}</p>
            <Badge variant="outline" className="mt-1">
              Clock: {node.clock}
            </Badge>
          </div>
        ))}
      </div>

      {/* Event Timeline */}
      {events.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <h4 className="text-sm font-medium">Event Timeline (Ordered by Lamport Timestamps):</h4>
          {sortedEvents.map((event, index) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-2 border rounded-lg bg-card fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Badge variant="outline" className="text-xs min-w-[2rem]">
                {event.timestamp}
              </Badge>
              {getEventIcon(event.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">Node {event.nodeId}:</span> {event.message}
                </p>
                {event.targetNode && (
                  <p className="text-xs text-muted-foreground">
                    → Node {event.targetNode}
                  </p>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className={`text-xs ${
                  event.type === 'local' ? 'bg-blue-100' :
                  event.type === 'send' ? 'bg-green-100' : 'bg-purple-100'
                }`}
              >
                {event.type}
              </Badge>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p><span className="font-medium">Rule 1:</span> Increment clock before each event</p>
        <p><span className="font-medium">Rule 2:</span> Send timestamp with messages</p>
        <p><span className="font-medium">Rule 3:</span> On receive: clock = max(own_clock, msg_timestamp) + 1</p>
      </div>
    </div>
  );
};