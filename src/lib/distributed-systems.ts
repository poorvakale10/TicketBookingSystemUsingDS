// Background Distributed Systems Manager
// Handles all DS concepts silently without UI exposure

interface ServerNode {
  id: string;
  clock: number;
  seatStates: { [seatId: string]: 'available' | 'booked' | 'locked' };
  lastSync: number;
}

interface LamportEvent {
  timestamp: number;
  nodeId: string;
  event: string;
  seatId: string;
}

export class DistributedSystemsManager {
  private nodes: ServerNode[] = [];
  private lamportClock = 0;
  private eventLog: LamportEvent[] = [];
  private mutexQueue: { seatId: string; nodeId: string; timestamp: number }[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeNodes();
  }

  private initializeNodes() {
    // Create 3 distributed server nodes
    this.nodes = [
      { id: 'primary', clock: 0, seatStates: {}, lastSync: Date.now() },
      { id: 'replica-1', clock: 0, seatStates: {}, lastSync: Date.now() },
      { id: 'replica-2', clock: 0, seatStates: {}, lastSync: Date.now() }
    ];
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Berkeley Time Synchronization
    await this.berkeleyTimeSync();
    
    // Initialize seat states across all nodes
    this.initializeSeatStates();
    
    this.isInitialized = true;
  }

  // Berkeley Time Synchronization (hidden background process)
  private async berkeleyTimeSync() {
    // Simulate clock drift
    this.nodes.forEach(node => {
      node.clock = Date.now() + Math.random() * 1000 - 500; // ±500ms drift
    });

    // Master (primary) collects times and calculates average
    const masterNode = this.nodes[0];
    const totalOffset = this.nodes.reduce((sum, node) => sum + (node.clock - Date.now()), 0);
    const avgOffset = totalOffset / this.nodes.length;

    // Synchronize all clocks
    this.nodes.forEach(node => {
      const adjustment = avgOffset - (node.clock - Date.now());
      node.clock = Date.now() + avgOffset;
      node.lastSync = Date.now();
    });
  }

  private initializeSeatStates() {
    // Initialize all seats as available across all nodes
    const seats = this.generateSeatIds();
    this.nodes.forEach(node => {
      seats.forEach(seatId => {
        node.seatStates[seatId] = 'available';
      });
    });
  }

  private generateSeatIds(): string[] {
    const seats: string[] = [];
    for (let row = 1; row <= 10; row++) {
      for (let seat = 1; seat <= 12; seat++) {
        seats.push(`${String.fromCharCode(64 + row)}${seat}`);
      }
    }
    return seats;
  }

  // Lamport Clocks for event ordering
  private createLamportEvent(nodeId: string, event: string, seatId: string): LamportEvent {
    this.lamportClock++;
    const lamportEvent: LamportEvent = {
      timestamp: this.lamportClock,
      nodeId,
      event,
      seatId
    };
    this.eventLog.push(lamportEvent);
    return lamportEvent;
  }

  // Mutual Exclusion using Ricart-Agrawala algorithm
  private async requestSeatLock(seatId: string, nodeId: string): Promise<boolean> {
    const timestamp = this.lamportClock + 1;
    
    // Add to mutex queue
    this.mutexQueue.push({ seatId, nodeId, timestamp });
    
    // Sort queue by timestamp (Ricart-Agrawala ordering)
    this.mutexQueue.sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        return a.nodeId.localeCompare(b.nodeId);
      }
      return a.timestamp - b.timestamp;
    });

    // Check if this request is at the front of the queue
    const frontRequest = this.mutexQueue[0];
    return frontRequest.seatId === seatId && frontRequest.nodeId === nodeId;
  }

  private releaseSeatLock(seatId: string, nodeId: string) {
    this.mutexQueue = this.mutexQueue.filter(
      req => !(req.seatId === seatId && req.nodeId === nodeId)
    );
  }

  // RPC simulation for booking operations
  private async simulateRPC(operation: string, params: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    switch (operation) {
      case 'checkSeatAvailability':
        return this.checkSeatAvailability(params.seatId);
      case 'bookSeat':
        return this.bookSeatInternal(params.seatId, params.userId);
      case 'updateSeatState':
        return this.updateSeatState(params.seatId, params.state);
      default:
        throw new Error(`Unknown RPC operation: ${operation}`);
    }
  }

  private checkSeatAvailability(seatId: string): boolean {
    const primaryNode = this.nodes[0];
    return primaryNode.seatStates[seatId] === 'available';
  }

  private async bookSeatInternal(seatId: string, userId: string): Promise<boolean> {
    const primaryNode = this.nodes[0];
    
    // Acquire mutex lock
    const hasLock = await this.requestSeatLock(seatId, primaryNode.id);
    if (!hasLock) return false;

    try {
      // Check availability under lock
      if (primaryNode.seatStates[seatId] !== 'available') {
        return false;
      }

      // Book the seat
      primaryNode.seatStates[seatId] = 'booked';
      
      // Create Lamport event
      this.createLamportEvent(primaryNode.id, 'seat_booked', seatId);
      
      // Replicate to other nodes
      await this.replicateSeatState(seatId, 'booked');
      
      return true;
    } finally {
      // Release mutex lock
      this.releaseSeatLock(seatId, primaryNode.id);
    }
  }

  private updateSeatState(seatId: string, state: 'available' | 'booked' | 'locked'): boolean {
    const primaryNode = this.nodes[0];
    primaryNode.seatStates[seatId] = state;
    return true;
  }

  // Replication across nodes
  private async replicateSeatState(seatId: string, state: 'available' | 'booked' | 'locked') {
    const replicationPromises = this.nodes.slice(1).map(async (node, index) => {
      // Simulate replication delay
      await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 80));
      
      // 95% success rate for replication
      if (Math.random() > 0.05) {
        node.seatStates[seatId] = state;
        node.lastSync = Date.now();
        this.createLamportEvent(node.id, 'replicated_seat_state', seatId);
      }
    });

    await Promise.all(replicationPromises);
  }

  // Public interface for booking processing
  async processBooking(seatIds: string[], movieId: string): Promise<boolean> {
    // Ensure Berkeley sync before processing
    await this.berkeleyTimeSync();

    const results = await Promise.all(
      seatIds.map(async seatId => {
        // RPC call to book seat
        try {
          const result = await this.simulateRPC('bookSeat', { 
            seatId, 
            userId: 'current_user' 
          });
          return result;
        } catch (error) {
          return false;
        }
      })
    );

    return results.every(result => result === true);
  }

  // Get system status (for potential debugging)
  getSystemStatus() {
    return {
      nodes: this.nodes.length,
      syncedNodes: this.nodes.filter(n => Date.now() - n.lastSync < 5000).length,
      totalEvents: this.eventLog.length,
      queuedRequests: this.mutexQueue.length,
      lastSync: Math.max(...this.nodes.map(n => n.lastSync))
    };
  }

  // Check if seats are available (public interface)
  async checkSeatsAvailability(seatIds: string[]): Promise<{ [seatId: string]: boolean }> {
    const results: { [seatId: string]: boolean } = {};
    
    for (const seatId of seatIds) {
      try {
        results[seatId] = await this.simulateRPC('checkSeatAvailability', { seatId });
      } catch (error) {
        results[seatId] = false;
      }
    }

    return results;
  }
}