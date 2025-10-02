'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/lib/socket-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TestEvent {
  id: string;
  type: string;
  action: string;
  timestamp: string;
  data: any;
}

export function WebSocketTest() {
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [testUserId] = useState('test_user_' + Math.random().toString(36).substr(2, 9));
  const [testRole] = useState('CLIENT');

  const { connected, connecting, error, reconnect, isPolling } = useSocket({
    userId: testUserId,
    role: testRole,
    enablePolling: true,
    pollingInterval: 30000,
    onBookingUpdate: handleBookingUpdate,
    onPaymentUpdate: handlePaymentUpdate,
    onNotification: handleNotification
  });

  function handleBookingUpdate(event: any) {
    console.log('📱 Booking update received:', event);
    
    const newEvent: TestEvent = {
      id: Date.now().toString(),
      type: 'booking',
      action: event.action,
      timestamp: new Date().toLocaleTimeString(),
      data: event.data
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 9)]); // Keep last 10 events
    
    toast.success(`🎉 Booking ${event.action}!`, {
      duration: 3000,
      position: 'top-center'
    });
  }

  function handlePaymentUpdate(event: any) {
    console.log('💰 Payment update received:', event);
    
    const newEvent: TestEvent = {
      id: Date.now().toString(),
      type: 'payment',
      action: event.action,
      timestamp: new Date().toLocaleTimeString(),
      data: event.data
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    
    toast.success(`💰 Payment ${event.action}!`, {
      duration: 3000,
      position: 'top-center'
    });
  }

  function handleNotification(event: any) {
    console.log('🔔 Notification received:', event);
    
    const newEvent: TestEvent = {
      id: Date.now().toString(),
      type: 'notification',
      action: event.action,
      timestamp: new Date().toLocaleTimeString(),
      data: event.data
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
    
    toast.success(`🔔 ${event.data?.title || 'New notification'}`, {
      duration: 3000,
      position: 'top-center'
    });
  }

  const testBroadcast = async () => {
    try {
      const response = await fetch('/api/socket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: {
            type: 'booking',
            action: 'accepted'
          },
          data: {
            id: 'test_booking_123',
            bookingId: 'test_booking_123',
            status: 'CONFIRMED',
            service: { name: 'Test Service' }
          },
          targetUsers: [testUserId]
        })
      });

      if (response.ok) {
        toast.success('📡 Test event sent!');
      } else {
        toast.error('❌ Failed to send test event');
      }
    } catch (error) {
      console.error('Test broadcast error:', error);
      toast.error('❌ Test broadcast failed');
    }
  };

  const getStatusIcon = () => {
    if (connecting) return <Clock className="w-4 h-4 animate-spin text-yellow-500" />;
    if (connected) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (error) return <XCircle className="w-4 h-4 text-red-500" />;
    return <WifiOff className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (connecting) return 'Connecting...';
    if (connected) return 'Connected';
    if (isPolling) return 'Polling';
    if (error) return 'Error';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (connecting) return 'bg-yellow-100 text-yellow-800';
    if (connected) return 'bg-green-100 text-green-800';
    if (isPolling) return 'bg-blue-100 text-blue-800';
    if (error) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔌 WebSocket Test Panel</span>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>User ID:</strong> {testUserId}
          </div>
          <div>
            <strong>Role:</strong> {testRole}
          </div>
          <div>
            <strong>Connection:</strong> {connected ? 'WebSocket' : isPolling ? 'Polling' : 'Offline'}
          </div>
          <div>
            <strong>Events Received:</strong> {events.length}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {error}
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={reconnect}
              className="mt-2"
            >
              🔄 Reconnect
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={testBroadcast} disabled={!connected && !isPolling}>
            📡 Send Test Event
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setEvents([])}
          >
            🗑️ Clear Events
          </Button>
        </div>

        <div>
          <h3 className="font-medium mb-2">Recent Events:</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No events received yet. Send a test event or wait for real updates.
              </p>
            ) : (
              events.map((event) => (
                <div 
                  key={event.id}
                  className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-xs">
                      {event.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {event.timestamp}
                    </span>
                  </div>
                  <p className="text-sm">
                    <strong>{event.action}</strong>
                  </p>
                  {event.data && (
                    <p className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(event.data, null, 2).slice(0, 100)}...
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
