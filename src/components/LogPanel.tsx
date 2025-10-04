import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Clock, Server, Shuffle, Lock, Timer, Ticket } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'berkeley' | 'rpc' | 'replication' | 'mutex' | 'lamport' | 'booking';
  message: string;
  nodeId?: string;
}

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'berkeley':
        return <Clock className="w-4 h-4" />;
      case 'rpc':
        return <Shuffle className="w-4 h-4" />;
      case 'replication':
        return <Server className="w-4 h-4" />;
      case 'mutex':
        return <Lock className="w-4 h-4" />;
      case 'lamport':
        return <Timer className="w-4 h-4" />;
      case 'booking':
        return <Ticket className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getLogBadgeVariant = (type: LogEntry['type']) => {
    switch (type) {
      case 'berkeley':
        return 'default';
      case 'rpc':
        return 'secondary';
      case 'replication':
        return 'outline';
      case 'mutex':
        return 'destructive';
      case 'lamport':
        return 'default';
      case 'booking':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getLogBorderColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'berkeley':
        return 'border-l-blue-500';
      case 'rpc':
        return 'border-l-green-500';
      case 'replication':
        return 'border-l-purple-500';
      case 'mutex':
        return 'border-l-red-500';
      case 'lamport':
        return 'border-l-yellow-500';
      case 'booking':
        return 'border-l-primary';
      default:
        return 'border-l-gray-500';
    }
  };

  return (
    <Card className="dashboard-card h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Event Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80 px-6">
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Activity className="w-8 h-8 mx-auto opacity-50" />
                <p>No events logged yet</p>
                <p className="text-sm">Start a simulation to see events</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`log-entry border-l-4 ${getLogBorderColor(log.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLogBadgeVariant(log.type)} className="text-xs">
                          {log.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {log.timestamp}
                        </span>
                        {log.nodeId && (
                          <Badge variant="outline" className="text-xs">
                            {log.nodeId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed">{log.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};