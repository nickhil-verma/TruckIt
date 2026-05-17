"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { User, Truck } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        toast.success("Already signed in!");
        if (parsed.role === "driver") {
          router.push("/driver-dashboard");
        } else {
          router.push("/startbooking");
        }
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [router]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, location }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Account created successfully!");
      if (data.user.role === "driver") {
        router.push("/driver-dashboard");
      } else {
        router.push("/startbooking");
      }
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-center pt-28 pb-16 font-sans relative overflow-hidden">
      {/* Hero-matched grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Soft orange glowing blob */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-orange-100 opacity-60 blur-3xl" />

      <Navbar />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="flex justify-center items-center gap-2 mb-6 group">
          <div className="h-11 w-11 rounded-2xl bg-orange-500 flex items-center justify-center text-xl shadow-lg shadow-orange-200">
            🚛
          </div>
          <span className="font-extrabold text-gray-900 tracking-tight text-3xl font-serif">
            TRUCK<span className="text-orange-500">IT</span>
          </span>
        </div>
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold text-gray-900 font-serif tracking-tight">
          Create Your Account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-medium">
          Join India's premium logistics platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl py-8 px-6 sm:px-10">
          <form className="space-y-5" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-bold text-gray-700">Full Name</label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Email Address</label>
              <div className="mt-2">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Password</label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700">Location / Base City</label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai, India"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setRole("user")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                    role === "user"
                      ? "border-orange-500 bg-orange-50/50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <User className={`h-6 w-6 ${role === "user" ? "text-orange-500" : "text-gray-400"}`} />
                  <span className={`text-sm font-bold ${role === "user" ? "text-orange-600" : "text-gray-600"}`}>
                    Customer
                  </span>
                  <span className="text-[10px] text-gray-400 text-center leading-normal">
                    Book & track shipments
                  </span>
                </div>

                <div
                  onClick={() => setRole("driver")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-2 ${
                    role === "driver"
                      ? "border-orange-500 bg-orange-50/50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <Truck className={`h-6 w-6 ${role === "driver" ? "text-orange-500" : "text-gray-400"}`} />
                  <span className={`text-sm font-bold ${role === "driver" ? "text-orange-600" : "text-gray-600"}`}>
                    Driver
                  </span>
                  <span className="text-[10px] text-gray-400 text-center leading-normal">
                    Share routes & earn profit
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-200 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-orange-600 hover:text-orange-500 font-semibold transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
