"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Calendar, Clock, MapPin, FileText, CheckCircle, Loader2 } from "lucide-react"
import { BrandHeader } from "@/components/ui/brand-header"

export default function BookServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [form, setForm] = useState({
    serviceId: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);

  // Check for sessionStorage booking data after login
  useEffect(() => {
    if (typeof window !== "undefined" && searchParams?.get("intent") === "booking") {
      const stored = sessionStorage.getItem("bookingDetails");
      if (stored) {
        setForm(JSON.parse(stored));
        setShowReview(true);
        sessionStorage.removeItem("bookingDetails");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchServices() {
      setLoadingServices(true);
      setServicesError(null);
      try {
        const res = await fetch("/api/services");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setServices(data);
      } catch (err) {
        setServicesError("Could not load services. Please try again later.");
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Check auth status before booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);
    try {
      // Check if logged in
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        // Not logged in: save form data and redirect to login
        if (typeof window !== "undefined") {
          sessionStorage.setItem("bookingDetails", JSON.stringify(form));
        }
        router.push("/login?intent=booking");
        return;
      }
      // If logged in, show review step before final submission
      setShowReview(true);
    } catch (err: any) {
      setSubmitError("Could not check authentication. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Final booking submission after review
  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);
    try {
      const res = await fetch("/api/book-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const data = await res.json();
        setConfirmation(data);
        setShowReview(false);
      } else {
        const error = await res.json();
        setSubmitError(error.error || "Failed to create booking");
      }
    } catch (err: any) {
      setSubmitError("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = services.find(s => s.id === form.serviceId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <BrandHeader showAuth={false} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Book a Service</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tell us what you need and we'll connect you with trusted professionals in your area
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Service Details</CardTitle>
                  <CardDescription>
                    Fill in the details below to book your service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {confirmation ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
                      <p className="text-gray-600 mb-6">
                        Your booking has been created successfully. We'll notify you once a provider accepts your request.
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">Booking Details</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Service:</span>
                            <span className="font-medium">{selectedService?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Date:</span>
                            <span className="font-medium">{form.date}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Time:</span>
                            <span className="font-medium">{form.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Address:</span>
                            <span className="font-medium">{form.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4 justify-center">
                        <Button asChild variant="outline">
                          <a href="/dashboard">View Dashboard</a>
                        </Button>
                        <Button asChild>
                          <a href="/book-service">Book Another Service</a>
                        </Button>
                      </div>
                    </div>
                  ) : showReview ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Review Your Booking</h3>
                        <p className="text-blue-700 text-sm">
                          Please review your booking details before confirming.
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Selected Service</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium">{selectedService?.name}</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{form.date}</span>
                              </div>
                              <div className="flex items-center space-x-2 mt-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{form.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Service Address</Label>
                            <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                <span>{form.address}</span>
                              </div>
                            </div>
                          </div>
                          
                          {form.notes && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Additional Notes</Label>
                              <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <span>{form.notes}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
                          onClick={() => setShowReview(false)}
                          className="flex-1"
                        >
                          Edit Details
                        </Button>
                        <Button
                          onClick={handleFinalSubmit}
                          disabled={submitting}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {submitting ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Creating Booking...</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>Confirm Booking</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
        </Button>
      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Service Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="serviceId" className="text-sm font-medium">Select Service *</Label>
                        {loadingServices ? (
                          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading services...</span>
          </div>
                        ) : servicesError ? (
                          <div className="p-3 bg-red-50 rounded-lg text-red-700">
                            {servicesError}
        </div>
                        ) : (
                          <Select
                            value={form.serviceId}
                            onValueChange={(value) => setForm({ ...form, serviceId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a service" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
        )}
      </div>

                      {/* Date and Time */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            value={form.date}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time" className="text-sm font-medium">Time *</Label>
                          <Input
                            id="time"
                            name="time"
                            type="time"
                            value={form.time}
                            onChange={handleChange}
                            required
                          />
  </div>
</div>

                      {/* Address */}
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium">Service Address *</Label>
                        <Input
                          id="address"
                          name="address"
                          type="text"
                          placeholder="Enter the address where you need the service"
                          value={form.address}
                          onChange={handleChange}
          required
        />
  </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Any specific requirements or details about the service..."
                          value={form.notes}
                          onChange={handleChange}
                          rows={4}
                        />
      </div>

                      {submitError && (
                        <div className="p-3 bg-red-50 rounded-lg text-red-700">
                          {submitError}
  </div>
)}

                      <Button
                        type="submit"
                        disabled={submitting || !form.serviceId || !form.date || !form.time || !form.address}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {submitting ? (
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Checking...</span>
    </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>Continue to Booking</span>
                            <ArrowRight className="w-4 h-4" />
  </div>
)}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How it works */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">How it Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { step: "1", title: "Book Service", desc: "Fill out the form with your requirements" },
                      { step: "2", title: "Get Matched", desc: "We'll connect you with verified providers" },
                      { step: "3", title: "Confirm Booking", desc: "Provider accepts and confirms your booking" },
                      { step: "4", title: "Enjoy Service", desc: "Sit back and relax while we handle the rest" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{item.step}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Why Choose Us?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      "Verified professionals",
                      "Secure payment processing",
                      "Satisfaction guaranteed",
                      "24/7 customer support",
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                </div>
                    ))}
              </div>
                </CardContent>
          </Card>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
