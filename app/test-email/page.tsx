"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Test Email from Proliink Connect");
  const [message, setMessage] = useState("This is a test email to verify the Resend integration is working correctly.");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast({
          title: "Email sent successfully!",
          description: data.dev 
            ? "Email logged to console (development mode)" 
            : `Email sent with ID: ${data.messageId}`,
        });
      } else {
        setResult({ error: data.error });
        toast({
          title: "Failed to send email",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setResult({ error: errorMessage });
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Email Integration
          </h1>
          <p className="text-gray-600">
            Test your Resend email integration with your domain
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Domain: v0-south-africa-marketplace-platfo.vercel.app
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Test Email
            </CardTitle>
            <CardDescription>
              Send a test email to verify your Resend integration is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="test@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Test Email Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your test message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Test Email
                  </>
                )}
              </Button>
            </form>

            {result && (
              <div className="mt-6 p-4 rounded-lg border">
                {result.success ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Email sent successfully!</p>
                      {result.dev && (
                        <p className="text-sm text-green-600">
                          Development mode: Email logged to console
                        </p>
                      )}
                      {result.messageId && (
                        <p className="text-sm text-green-600">
                          Message ID: {result.messageId}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Failed to send email</p>
                      <p className="text-sm text-red-600">{result.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>
              Current email configuration and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">API Key:</span>
              <span className="text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_RESEND_API_KEY ? "✅ Configured" : "❌ Not configured"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Environment:</span>
              <span className="text-sm text-gray-600">
                {process.env.NODE_ENV === "production" ? "🚀 Production" : "🔧 Development"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">From Email:</span>
              <span className="text-sm text-gray-600">
                noreply@v0-south-africa-marketplace-platfo.vercel.app
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Domain Status:</span>
              <span className="text-sm text-yellow-600">
                ⚠️ Verify in Resend Dashboard
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Check the{" "}
            <a 
              href="/RESEND_INTEGRATION_GUIDE.md" 
              className="text-green-600 hover:text-green-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Resend Integration Guide
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
