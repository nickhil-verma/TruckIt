"use client";

import React from "react";
import { Search, Info, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function TruckSidebar({
  from,
  to,
  setFrom,
  setTo,
  handleSearch,
  loading,
  error,
  distanceKm,
  durationMin,
  formatDuration,
  TRUCK_TYPES,
  selectedTruck,
  setSelectedTruck,
  booked,
  setBooked,
  selectedTruckData,
  totalPrice,
}) {
  return (
    <aside className="w-full lg:w-[400px] border-r border-white/10 flex flex-col bg-white/5 backdrop-blur-md">
      <div className="p-6 space-y-5">
        {/* Route Inputs */}
        <div className="space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-orange-500" />
            <Input
              placeholder="Pickup Location"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input-dark pl-10 h-12 rounded-xl"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-green-500" />
            <Input
              placeholder="Drop Location"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input-dark pl-10 h-12 rounded-xl"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold transition-all bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Calculate Route"}
          </Button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Stats Section */}
        {distanceKm && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Distance</p>
              <p className="text-lg font-semibold text-white">{distanceKm.toFixed(1)} km</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Est. Time</p>
              <p className="text-lg font-semibold text-white">{formatDuration(durationMin)}</p>
            </div>
          </div>
        )}

        {/* Vehicle Selection */}
        <div className="space-y-3">
          <p className="text-sm font-bold text-white/70 flex items-center gap-2">
            Select Vehicle <Info className="w-3 h-3" />
          </p>
          <div className="space-y-2">
            {TRUCK_TYPES.map((truck) => (
              <div
                key={truck.id}
                onClick={() => setSelectedTruck(truck.id)}
                className={`truck-card cursor-pointer p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  selectedTruck === truck.id
                    ? "bg-orange-600/20 border-orange-500"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{truck.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{truck.label}</h4>
                    <p className="text-[11px] text-white/50">{truck.capacity} • {truck.eta} away</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">₹{truck.baseRate}/km</p>
                  <p className="text-[10px] text-orange-400">★ {truck.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Booking Section */}
      <div className="mt-auto p-6 bg-black/20 border-t border-white/10 backdrop-blur-xl">
        {totalPrice ? (
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-white/40 font-medium">Total Estimate</p>
                <p className="text-3xl font-black text-white">₹{totalPrice.toLocaleString()}</p>
              </div>
              <div className="text-right text-[11px] text-white/40">
                Inc. taxes & tolls
              </div>
            </div>
            
            <Button
              onClick={() => setBooked(true)}
              disabled={booked}
              className={`w-full h-14 rounded-2xl text-lg font-black transition-all ${
                booked 
                  ? "bg-green-600 hover:bg-green-600 cursor-default" 
                  : "bg-white text-black hover:bg-orange-500 hover:text-white"
              }`}
            >
              {booked ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" /> BOOKED
                </span>
              ) : (
                "CONFIRM BOOKING"
              )}
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-white/30 py-4 font-medium italic">
            Enter locations to see pricing
          </p>
        )}
      </div>
    </aside>
  );
}