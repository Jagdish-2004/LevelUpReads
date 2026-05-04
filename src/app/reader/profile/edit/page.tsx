"use client";

import { useState, useEffect } from "react";
import Header from "@/app/reader/header/page";
import { useRouter } from "next/navigation";

type Section = "basic" | "email" | "phone" | "password";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  dob: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  xp: number;
  booksRead: number;
  image: string;
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium flex items-center gap-2 animate-slide-up ${
        type === "success" ? "bg-green-600" : "bg-red-600"
      }`}
    >
      {type === "success" ? "✅" : "❌"} {message}
    </div>
  );
}

function OtpInput({ onSubmit, loading }: { onSubmit: (otp: string) => void; loading: boolean }) {
  const [otp, setOtp] = useState("");
  return (
    <div className="flex gap-2 mt-3">
      <input
        type="text"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="Enter 6-digit OTP"
        className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-center text-lg tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-black"
      />
      <button
        onClick={() => onSubmit(otp)}
        disabled={otp.length !== 6 || loading}
        className="px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-40 transition"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData>({
    name: "", email: "", phone: "", dob: "",
    phoneVerified: false, emailVerified: false, xp: 0, booksRead: 0, image: "",
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("basic");

  // Basic info
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  // Phone
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        setName(data.name || "");
        setDob(data.dob || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Basic Info ──
  const handleBasicSave = async () => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, dob }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Profile updated!", "success");
      setProfile((p) => ({ ...p, name, dob }));
    } else {
      showToast(data.error || "Failed to update", "error");
    }
  };

  // ── Email OTP ──
  const handleSendEmailOtp = async () => {
    setEmailOtpLoading(true);
    const res = await fetch("/api/profile/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", value: newEmail }),
    });
    const data = await res.json();
    setEmailOtpLoading(false);
    if (res.ok) { setEmailOtpSent(true); showToast("OTP sent to your new email!", "success"); }
    else showToast(data.error || "Failed to send OTP", "error");
  };

  const handleVerifyEmailOtp = async (otp: string) => {
    setEmailOtpLoading(true);
    const res = await fetch("/api/profile/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "email", value: newEmail, otp }),
    });
    const data = await res.json();
    setEmailOtpLoading(false);
    if (res.ok) {
      showToast("Email updated and verified! ✓", "success");
      setProfile((p) => ({ ...p, email: newEmail, emailVerified: true }));
      setEmailOtpSent(false);
      setNewEmail("");
    } else {
      showToast(data.error || "Invalid OTP", "error");
    }
  };

  // ── Phone OTP ──
  const handleSendPhoneOtp = async () => {
    setPhoneOtpLoading(true);
    const res = await fetch("/api/profile/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "phone", value: newPhone }),
    });
    const data = await res.json();
    setPhoneOtpLoading(false);
    if (res.ok) { setPhoneOtpSent(true); showToast("OTP sent to your phone!", "success"); }
    else showToast(data.error || "Failed to send OTP", "error");
  };

  const handleVerifyPhoneOtp = async (otp: string) => {
    setPhoneOtpLoading(true);
    const res = await fetch("/api/profile/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "phone", value: newPhone, otp }),
    });
    const data = await res.json();
    setPhoneOtpLoading(false);
    if (res.ok) {
      showToast("Phone verified and saved! ✓", "success");
      setProfile((p) => ({ ...p, phone: newPhone, phoneVerified: true }));
      setPhoneOtpSent(false);
      setNewPhone("");
    } else {
      showToast(data.error || "Invalid OTP", "error");
    }
  };

  // ── Password ──
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setPwdLoading(true);
    const res = await fetch("/api/profile/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwdLoading(false);
    if (res.ok) {
      showToast("Password changed successfully!", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } else {
      showToast(data.error || "Failed to change password", "error");
    }
  };

  const tabs: { id: Section; label: string; icon: string }[] = [
    { id: "basic", label: "Basic Info", icon: "👤" },
    { id: "email", label: "Email", icon: "✉️" },
    { id: "phone", label: "Phone", icon: "📱" },
    { id: "password", label: "Password", icon: "🔒" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      {toast && <Toast message={toast.message} type={toast.type} />}

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden">
            {profile.image ? <img src={profile.image} className="w-full h-full object-cover rounded-full" /> : "👤"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.name || "Your Name"}</h1>
            <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>⭐ {profile.xp} XP</span>
              <span>📚 {profile.booksRead} books read</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 flex-col md:flex-row">
          {/* Sidebar Tabs */}
          <div className="md:w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`w-full text-left px-5 py-4 text-sm font-medium flex items-center gap-3 transition border-l-4 ${
                    activeSection === tab.id
                      ? "border-black bg-gray-50 text-black"
                      : "border-transparent text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Panel */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

            {/* ── Basic Info ── */}
            {activeSection === "basic" && (
              <div>
                <h2 className="text-xl font-bold mb-6">Basic Information</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
                <button
                  onClick={handleBasicSave}
                  className="mt-8 px-8 py-3 bg-black text-white rounded-full font-semibold hover:opacity-80 transition"
                >
                  Save Changes
                </button>
              </div>
            )}

            {/* ── Email ── */}
            {activeSection === "email" && (
              <div>
                <h2 className="text-xl font-bold mb-2">Email Address</h2>
                <div className="flex items-center gap-2 mb-6">
                  <p className="text-gray-500 text-sm">Current: <span className="font-medium text-black">{profile.email}</span></p>
                  {profile.emailVerified
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                    : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">⚠ Unverified</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => { setNewEmail(e.target.value); setEmailOtpSent(false); }}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="new@email.com"
                    />
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={!newEmail || emailOtpLoading}
                      className="px-5 py-3 border-2 border-black text-black rounded-xl text-sm font-semibold hover:bg-black hover:text-white disabled:opacity-40 transition"
                    >
                      {emailOtpLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>

                  {emailOtpSent && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-sm text-blue-700 mb-2 font-medium">📧 OTP sent to <strong>{newEmail}</strong></p>
                      <OtpInput onSubmit={handleVerifyEmailOtp} loading={emailOtpLoading} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Phone ── */}
            {activeSection === "phone" && (
              <div>
                <h2 className="text-xl font-bold mb-2">Phone Number</h2>
                <div className="flex items-center gap-2 mb-6">
                  <p className="text-gray-500 text-sm">
                    Current: <span className="font-medium text-black">{profile.phone || "Not set"}</span>
                  </p>
                  {profile.phone && (profile.phoneVerified
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Verified</span>
                    : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">⚠ Unverified</span>)}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (with country code)</label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => { setNewPhone(e.target.value); setPhoneOtpSent(false); }}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="+91 9876543210"
                    />
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={!newPhone || phoneOtpLoading}
                      className="px-5 py-3 border-2 border-black text-black rounded-xl text-sm font-semibold hover:bg-black hover:text-white disabled:opacity-40 transition"
                    >
                      {phoneOtpLoading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>

                  {phoneOtpSent && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-sm text-blue-700 mb-2 font-medium">📱 OTP sent to <strong>{newPhone}</strong></p>
                      <p className="text-xs text-blue-500">In dev mode, check your server terminal for the OTP code.</p>
                      <OtpInput onSubmit={handleVerifyPhoneOtp} loading={phoneOtpLoading} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Password ── */}
            {activeSection === "password" && (
              <div>
                <h2 className="text-xl font-bold mb-6">Change Password</h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black ${
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200"
                      }`}
                      placeholder="Re-enter new password"
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={showPwd} onChange={() => setShowPwd(!showPwd)} />
                    Show passwords
                  </label>
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="mt-8 px-8 py-3 bg-black text-white rounded-full font-semibold hover:opacity-80 disabled:opacity-40 transition"
                >
                  {pwdLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
