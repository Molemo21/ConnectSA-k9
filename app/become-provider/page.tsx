"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Users, ShieldCheck, Clock, Wallet } from "lucide-react"
import { motion } from "framer-motion"

export default function BecomeProvider() {
  return (
    <div className="bg-black/90 backdrop-blur-sm text-white scroll-smooth">
      {/* Home button in top left */}
      <div className="fixed top-6 left-6 z-50">
        <Link href="/" className="inline-flex items-center space-x-3 group">
          <img 
            src="/handshake.png" 
            alt="ProLiink Connect Logo" 
            className="w-12 h-12 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-200"
          />
          <div className="text-left">
            <span className="text-2xl font-bold text-white">ProL<span className="text-blue-400">ii</span>nk</span>
            <div className="text-xs text-white/80">Connect</div>
          </div>
        </Link>
      </div>
      {/* Hero Section */}
      <section className="relative text-white py-20 px-6 text-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/provider.jpg')"
          }}
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Content */}
        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Grow Your Business. Get More Clients. Earn More.
          </motion.h1>
          <p className="max-w-2xl mx-auto text-lg mb-8">
            Join ProLiink Connect, a trusted platform that helps service providers
            like you connect with real clients who need your skills — anytime, anywhere.
          </p>
          <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
            <Link href="/signup?role=provider">Get Started</Link>
          </Button>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-16 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-10 text-white">Why Join Us?</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
            <CardContent className="p-6">
              <Users className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">More Jobs</h3>
              <p className="text-white/80">Gain direct access to clients actively looking for your services.</p>
            </CardContent>
          </Card>
          <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
            <CardContent className="p-6">
              <Wallet className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">Secure Payments</h3>
              <p className="text-white/80">Get paid on time, every time, with our reliable system.</p>
            </CardContent>
          </Card>
          <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
            <CardContent className="p-6">
              <ShieldCheck className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">Build Trust</h3>
              <p className="text-white/80">Verified profiles and reviews make it easier for clients to choose you.</p>
            </CardContent>
          </Card>
          <Card className="bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10">
            <CardContent className="p-6">
              <Clock className="h-10 w-10 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">Flexibility</h3>
              <p className="text-white/80">Choose the jobs that fit your schedule and location.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-black/50 py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-10 text-white">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {[
            { step: "Sign Up", desc: "Create your profile in minutes." },
            { step: "Get Verified", desc: "Upload your documents and build trust with clients." },
            { step: "Start Working", desc: "Receive bookings directly from clients in your area." },
            { step: "Get Paid", desc: "Payments are processed quickly and securely." },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="p-6 bg-black/70 backdrop-blur-sm shadow-xl rounded-2xl border border-white/10"
            >
              <div className="text-purple-400 font-bold text-xl mb-3">Step {index + 1}</div>
              <h3 className="font-semibold mb-2 text-white">{item.step}</h3>
              <p className="text-white/80">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">What You'll Need</h2>
        <ul className="space-y-4">
          {[
            "A valid South African ID or work permit",
            "Proof of qualifications/certification (if applicable)",
            "Basic tools or equipment for your service",
            "A bank account for secure payments",
          ].map((req, i) => (
            <li key={i} className="flex items-center gap-3 text-lg text-white/80">
              <CheckCircle className="h-6 w-6 text-green-400" /> {req}
            </li>
          ))}
        </ul>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Grow with ProLiink?</h2>
        <p className="max-w-xl mx-auto mb-8 text-lg">
          Join our network of trusted service providers and start earning today.
        </p>
        <Button asChild size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
          <Link href="/signup?role=provider">Get Started</Link>
        </Button>
      </section>
    </div>
  )
}
