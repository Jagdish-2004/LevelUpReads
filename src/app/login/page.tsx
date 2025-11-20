'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client' // Make sure this path is correct

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // 1. Add this function to handle Google Login
  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/roleselection", // Redirects here after successful login
    })
  }

  const handleSignIn = async () => {
    // ... existing email/password logic ...
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">
       {/* ... Header ... */}

      <div className="flex flex-col justify-center w-full md:w-1/2 px-10 md:px-20 py-10">
        <h1 className="text-4xl font-medium mb-10 text-center md:text-left">
          Log in
        </h1>

        <div className="space-y-5 w-full max-w-md">
          {/* 2. Attach the handler to the Google button */}
          <button 
            onClick={handleGoogleSignIn}
            className="w-full border rounded-full py-3 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 transition"
          >
            <img src="/google-icon.svg" alt="" className="h-5 w-5" />
            Continue with Google
          </button>

          {/* ... Facebook Button ... */}
        </div>

        {/* ... Rest of your form ... */}
      </div>

      {/* ... Right Image Section ... */}
    </div>
  )
}