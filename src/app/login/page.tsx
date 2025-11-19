'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function LoginPage() {

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white">

      {/* Header Logo — Fixed Top Left */}
      <header className="p-4 flex items-center justify-between w-full absolute top-0 left-0">
        <div className="flex items-center space-x-2">
          <img src="/logo.png" alt="LevelupReads Logo" className="h-6 w-6" />
          <span className="text-xl font-semibold">levelupReads</span>
        </div>
      </header>

      {/* LEFT — FORM */}
      <div className="flex flex-col justify-center w-full md:w-1/2 px-10 md:px-20 py-10">

        <h1 className="text-4xl font-medium mb-10 text-center md:text-left">
          Log in
        </h1>

        {/* Social Buttons */}
        <div className="space-y-5 w-full max-w-md">

          <button className="w-full border rounded-full py-3 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 transition">
            <img src="/google-icon.svg" alt="" className="h-5 w-5" />
            Continue with Google
          </button>

          <button className="w-full border rounded-full py-3 flex items-center justify-center gap-2 text-gray-700 hover:bg-gray-100 transition">
            <img src="/facebook-icon.svg" alt="" className="h-5 w-5" />
            Continue with Facebook
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-8">
          <span className="flex-1 border-t" />
          <span className="px-4 text-gray-500 text-sm">or continue with email</span>
          <span className="flex-1 border-t" />
        </div>

        {/* Email */}
        <div className='w-full max-w-md'>
          <div className="flex justify-between">
            <label className="text-gray-700">Username</label>
          </div>

          <input
            type="email"
            className="w-full max-w-md border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-gray-500 focus:outline-none mb-4"
          />
        </div>

        {/* Password with Eye Toggle */}
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center">
            <label className="text-gray-700">Password</label>

            {/* Eye Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-sm flex items-center gap-1 text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <input
            type={showPassword ? "text" : "password"}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-gray-500 focus:outline-none"
          />

          <div className="flex justify-end mt-1">
            <a href="#" className="text-sm underline">Forget your password</a>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center mt-4 gap-2">
          <input type="checkbox" id="remember" />
          <label htmlFor="remember" className="text-gray-700">Remember me</label>
        </div>

        {/* Login Button */}
        <button className="w-full max-w-md bg-black text-white py-3 rounded-full hover:bg-gray-800 transition mt-6">
          Log in
        </button>

        {/* Signup Link */}
        <p className="text-center text-gray-600 text-sm mt-5">
          Don’t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* RIGHT — IMAGE */}
      <div className="w-full md:w-1/2 flex justify-center items-center bg-gray-100 rounded-t-3xl md:rounded-l-3xl md:rounded-t-none p-6 md:p-0">
        <div className="overflow-hidden rounded-3xl shadow-lg w-full max-w-md md:max-w-none">
          <Image
            src="/Login_image.jpg"
            alt="Reading Illustration"
            width={500}
            height={700}
            className="object-cover w-full h-auto rounded-3xl"
          />
        </div>
      </div>

    </div>
  )
}
