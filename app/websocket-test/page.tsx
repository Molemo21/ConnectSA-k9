'use client';

import { WebSocketTest } from '@/components/websocket-test';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WebSocketTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔌 WebSocket Real-time Test Panel</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This panel allows you to test the real-time WebSocket functionality of your booking platform.
              You can send test events and see how they're received in real-time.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-medium">What to Test:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>WebSocket connection status</li>
                  <li>Real-time event broadcasting</li>
                  <li>Connection error handling</li>
                  <li>Polling fallback mechanism</li>
                  <li>Event reception and processing</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Expected Behavior:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Connection shows "Connected" when WebSocket works</li>
                  <li>Events appear in real-time when sent</li>
                  <li>Fallback to "Polling" when WebSocket fails</li>
                  <li>Toast notifications for received events</li>
                  <li>Error messages for connection issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <WebSocketTest />

        <Card>
          <CardHeader>
            <CardTitle>📋 Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Connection Test</h3>
              <p className="text-sm text-gray-600">
                Check the connection status indicator. It should show "Connected" if the WebSocket server is running.
                If it shows "Polling", the WebSocket connection failed and the system is using fallback polling.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Event Broadcasting Test</h3>
              <p className="text-sm text-gray-600">
                Click "Send Test Event" to broadcast a test booking acceptance event. You should see:
                - A success toast notification
                - The event appear in the "Recent Events" list
                - Real-time status updates
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Error Handling Test</h3>
              <p className="text-sm text-gray-600">
                To test error handling, you can:
                - Stop the server and see fallback to polling
                - Check browser network tab for connection errors
                - Use the "Reconnect" button to retry connection
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">4. Real-world Testing</h3>
              <p className="text-sm text-gray-600">
                For real-world testing:
                1. Open two browser tabs - one as client, one as provider
                2. Create a booking in the client tab
                3. Accept the booking in the provider tab
                4. Watch for real-time updates in the client tab
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔧 Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Server:</strong> Make sure you're running <code className="bg-gray-100 px-1 rounded">npm run dev</code> 
                (which uses the custom server with WebSocket support)
              </p>
              <p>
                <strong>API Endpoint:</strong> <code className="bg-gray-100 px-1 rounded">/api/socket</code> for WebSocket status
              </p>
              <p>
                <strong>Socket Path:</strong> <code className="bg-gray-100 px-1 rounded">/api/socket</code> for WebSocket connections
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
