import { faArrowLeft, faEnvelope } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@storyteller/ui-button";
import { useState } from "react";
import { Link } from "react-router-dom";

import Seo from "../../components/seo";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#101014] text-white bg-dots flex flex-col">
      <Seo
        title="Reset Password - ArtCraft"
        description="Reset your ArtCraft password."
      />
      <div className="dotted-pattern absolute inset-0 z-[0] opacity-30" />

      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1C1C20] border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
            <p className="text-white/60 text-sm">
              Enter your email to receive reset instructions
            </p>
          </div>

          {!submitted ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wide ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-black/20 border border-white/10 focus:border-primary/50 rounded-xl px-4 py-3 text-white placeholder-white/20 outline-none transition-colors"
                />
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary-600 text-white border-none justify-center font-bold h-12 mt-2"
                onClick={() => setSubmitted(true)}
              >
                Send Reset Link
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                <FontAwesomeIcon icon={faEnvelope} className="text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">Check your email</h3>
              <p className="text-white/60 text-sm mb-8">
                We've sent a password reset link to <br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <Button
                className="w-full bg-white/10 hover:bg-white/20 text-white border-none justify-center font-bold h-12"
                onClick={() => setSubmitted(false)}
              >
                Try another email
              </Button>
            </div>
          )}

          <div className="mt-8 text-center text-sm">
            <Link
              to="/login"
              className="text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Back to Log in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
