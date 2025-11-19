'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`.trim(),
      // The error will now be gone because authClient knows 'role' exists
      role: 'reader', 
    }, {
      onSuccess: () => {
        router.push('/roleselection') 
      },
      onError: (ctx) => {
        alert(ctx.error.message)
        setLoading(false)
      }
    })
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">

      {/* Navbar fixed at top-left */}
      <header className="fixed top-0 left-0 w-full bg-white p-4 z-50">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="LevelupReads Logo" className="h-6 w-6" />
          <span className="text-xl font-semibold">levelupReads</span>
        </div>
      </header>

      {/* Left Section - Sign Up Form */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 px-8 md:px-16 py-10">
        <h1 className="text-4xl font-medium mb-10 text-center md:text-left">
          Sign up
        </h1>

        <form onSubmit={handleSignUp} className="w-full max-w-md space-y-5">
          {/* Name Fields */}
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="First name"
              className="w-full md:w-1/2 border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last name"
              className="w-full md:w-1/2 border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <p className="text-gray-500 text-sm">
            Use 8 or more characters with a mix of letters, numbers & symbols
          </p>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Sign up"}
          </button>

          <p className="text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </p>
        </form>
      </div>

      {/* Right Section - Image */}
      <div className="w-full md:w-1/2 flex justify-center items-center bg-gray-100 rounded-t-3xl md:rounded-l-3xl md:rounded-t-none p-6 md:p-0">
        <div className="overflow-hidden rounded-3xl shadow-lg w-full max-w-md md:max-w-none">
          <Image
            src="/signup_image.jpg"
            alt="Snoopy Reading"
            width={500}
            height={700}
            className="object-cover w-full h-auto rounded-3xl"
          />
        </div>
      </div>
    </div>
  )
}