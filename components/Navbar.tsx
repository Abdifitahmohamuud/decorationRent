"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { ShoppingCart, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/app/context/CartContext";

export default function Navbar() {
  const { user: session, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              DecorRent
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/decorations" className="text-gray-600 hover:text-indigo-600">
              Decorations
            </Link>
            {session ? (
              <>
                {session?.role !== "ADMIN" && (
                  <div className="flex items-center">
                    <Link href="/cart" className="relative text-gray-600 hover:text-indigo-600 mr-8">
                      <ShoppingCart className="w-6 h-6" />
                      {totalItems > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                          {totalItems}
                        </span>
                      )}
                    </Link>
                    <Link href="/bookings" className="text-gray-600 hover:text-indigo-600 font-medium">
                      My Bookings
                    </Link>
                  </div>
                )}
                {session?.role === "ADMIN" && (
                  <Link href="/dashboard/admin" className="text-gray-600 hover:text-indigo-600">
                    Admin
                  </Link>
                )}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">Hi, {session.fullName || session.email}</span>
                  <button
                    onClick={() => logout()}
                    className="flex items-center text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-gray-600 hover:text-indigo-600">
                  Login
                </Link>
                <Link href="/cart" className="relative text-gray-600 hover:text-indigo-600 ml-4 mr-2">
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <Link href="/cart" className="relative p-2 text-gray-600 hover:text-indigo-600">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t px-4 py-2 space-y-2">
          <Link href="/decorations" className="block text-gray-600 py-2">Decorations</Link>
          {session ? (
            <>
              {session?.role !== "ADMIN" && (
                <>
                  <Link href="/cart" className="block text-gray-600 py-2">Cart ({totalItems})</Link>
                  <Link href="/bookings" className="block text-indigo-600 font-medium py-2">My Bookings</Link>
                </>
              )}
              {session?.role === "ADMIN" && (
                <Link href="/dashboard/admin" className="block text-gray-600 py-2">Admin</Link>
              )}
                  <button onClick={() => logout()} className="block text-red-600 py-2 w-full text-left">Sign Out</button>
                </>
              ) : (
            <>
              <Link href="/auth/login" className="block text-gray-600 py-2">Login</Link>
              <Link href="/auth/register" className="block text-indigo-600 py-2">Register</Link>
              <Link href="/cart" className="block text-gray-600 py-2">Cart ({totalItems})</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
