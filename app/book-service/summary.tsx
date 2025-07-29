"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function BookingSummary({ booking, onBook }: {
  booking: {
    category: string;
    service: string;
    description: string;
    photos: File[];
    date: string;
    time: string;
    address: string;
  },
  onBook: () => void
}) {
  return (
    <Card className="w-full max-w-2xl mx-auto p-6 rounded-xl shadow-lg bg-gray-800 border border-gray-700 animate-fade-in">
      <h3 className="text-lg font-semibold text-white mb-2">Booking Summary</h3>
      <ul className="text-gray-200 mb-4 space-y-1">
        <li><span className="font-medium">Category:</span> {booking.category}</li>
        <li><span className="font-medium">Service:</span> {booking.service}</li>
        <li><span className="font-medium">Description:</span> {booking.description}</li>
        <li><span className="font-medium">Date:</span> {booking.date}</li>
        <li><span className="font-medium">Time:</span> {booking.time}</li>
        <li><span className="font-medium">Address:</span> {booking.address}</li>
      </ul>
      {booking.photos && booking.photos.length > 0 && (
        <div className="mb-4">
          <div className="font-medium text-gray-200 mb-2">Photos:</div>
          <div className="flex flex-wrap gap-3">
            {booking.photos.map((file, idx) => (
              <img
                key={idx}
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-24 h-24 object-cover rounded border border-gray-700"
              />
            ))}
          </div>
        </div>
      )}
      <Button
        type="button"
        className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
        onClick={onBook}
      >
        Book
      </Button>
    </Card>
  );
}
