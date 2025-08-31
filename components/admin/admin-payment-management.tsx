"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { showToast } from '@/lib/toast';

interface PaymentStatus {
  status: string;
  count: number;
}

interface PaymentStats {
  total: number;
  pending: number;
  escrow: number;
  released: number;
  failed: number;
}

export function AdminPaymentManagement() {
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastRecovery, setLastRecovery] = useState<any>(null);

  // Fetch payment statistics
  const fetchPaymentStats = async () => {
    try {
      setIsLoading(true);
      
      // Skip API calls during build time
      if (typeof window === 'undefined') {
        console.log('Skipping API call during build time');
        return;
      }
      
      const response = await fetch('/api/admin/payments/pending');
      
      if (response.ok) {
        const data = await response.json();
        setPaymentStats(data.stats);
      } else {
        console.error('Failed to fetch payment stats');
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-recover stuck payments
  const triggerAutoRecovery = async () => {
    try {
      setIsRecovering(true);
      const response = await fetch('/api/payment/auto-recover', {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
          
      if (response.ok) {
        const result = await response.json();
        setLastRecovery(result);
        showToast.success(`Auto-recovery completed! ${result.summary.recovered} payments recovered.`);
          
        // Refresh stats after recovery
        setTimeout(() => fetchPaymentStats(), 1000);
          } else {
        const error = await response.json();
        showToast.error(`Auto-recovery failed: ${error.message}`);
          }
        } catch (error) {
      console.error('Auto-recovery error:', error);
      showToast.error('Auto-recovery failed. Please try again.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    // Only fetch stats in the browser, not during build time
    if (typeof window !== 'undefined') {
      fetchPaymentStats();
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ESCROW': return 'bg-blue-100 text-blue-800';
      case 'RELEASED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'ESCROW': return <DollarSign className="w-4 h-4" />;
      case 'RELEASED': return <CheckCircle className="w-4 h-4" />;
      case 'FAILED': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Status Overview
          </CardTitle>
          <CardDescription>
            Monitor payment statuses and manage stuck payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
        </div>
          <Button
              onClick={fetchPaymentStats} 
              disabled={isLoading}
            variant="outline"
            size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
          </Button>
      </div>

          {paymentStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{paymentStats.total}</div>
                <div className="text-sm text-gray-600">Total Payments</div>
                  </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-700">{paymentStats.pending}</div>
                <div className="text-sm text-yellow-600">Pending</div>
                  </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{paymentStats.escrow}</div>
                <div className="text-sm text-blue-600">In Escrow</div>
                </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{paymentStats.released}</div>
                <div className="text-sm text-green-600">Released</div>
                </div>
              </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Loading payment statistics...' : 'No payment data available'}
            </div>
          )}
            </CardContent>
          </Card>

      {/* Auto-Recovery Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            Stuck Payment Recovery
          </CardTitle>
          <CardDescription>
            Automatically recover payments stuck in PENDING status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paymentStats?.pending && paymentStats.pending > 0 ? (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <strong>{paymentStats.pending} payments</strong> are currently stuck in PENDING status. 
                This usually indicates webhook processing issues.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                No stuck payments detected. All payments are processing correctly.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4">
              <Button
              onClick={triggerAutoRecovery}
              disabled={isRecovering || !paymentStats?.pending}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isRecovering ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                )}
              {isRecovering ? 'Recovering...' : `Recover ${paymentStats?.pending || 0} Stuck Payments`}
              </Button>

            <div className="text-sm text-muted-foreground">
              This will verify all PENDING payments with Paystack and update their status accordingly.
            </div>
          </div>

          {/* Last Recovery Results */}
          {lastRecovery && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Last Recovery Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Processed:</span> {lastRecovery.summary.total}
                </div>
                <div>
                  <span className="font-medium">Recovered:</span> 
                  <span className="text-green-600 ml-1">{lastRecovery.summary.recovered}</span>
                </div>
                <div>
                  <span className="font-medium">Failed:</span> 
                  <span className="text-red-600 ml-1">{lastRecovery.summary.failed}</span>
                </div>
                <div>
                  <span className="font-medium">Errors:</span> 
                  <span className="text-yellow-600 ml-1">{lastRecovery.summary.errors}</span>
                </div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Webhook Status
          </CardTitle>
          <CardDescription>
            Monitor webhook processing and troubleshoot issues
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Webhook Endpoint</div>
                <div className="text-sm text-muted-foreground">
                  /api/webhooks/paystack
                  </div>
                </div>
              <Badge variant="outline">Active</Badge>
                  </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Supported Events</div>
                <div className="text-sm text-muted-foreground">
                  charge.success, transfer.success, transfer.failed
                </div>
              </div>
              <Badge variant="outline">3 Events</Badge>
            </div>
            
            <Separator />

            <div className="text-sm text-muted-foreground">
              <strong>Common Issues:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Webhook URL not configured in Paystack dashboard</li>
                <li>Incorrect webhook secret in environment variables</li>
                <li>Webhook endpoint not accessible from Paystack servers</li>
                <li>Database connection issues during webhook processing</li>
              </ul>
                </div>

            <div className="text-sm text-muted-foreground">
              <strong>Quick Fix:</strong> Check your Paystack dashboard webhook configuration and ensure 
              the webhook URL points to your domain with the correct endpoint.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
