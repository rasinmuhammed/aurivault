"use client";
import React, { useState, useEffect } from 'react';
import { Lock, Lightbulb, Shield, Zap, ArrowRight, Play, Users, FileText, Brain } from 'lucide-react';

const AuriVaultLanding = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Vault-Grade Security",
      description: "AES-256 encryption, multi-tenant isolation, and enterprise compliance built-in."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Living Intelligence",
      description: "Your documents evolve into an intelligent knowledge layer that learns and adapts."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Illuminated Insights",
      description: "Transform static files into radiant, actionable intelligence with full citations."
    }
  ];

  const stats = [
    { number: "99.9%", label: "Uptime Guaranteed" },
    { number: "256-bit", label: "Military Encryption" },
    { number: "<100ms", label: "Response Time" },
    { number: "∞", label: "Scale Potential" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl animate-pulse"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-2xl animate-bounce" 
             style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 blur-xl animate-pulse" 
             style={{ animationDelay: '1s' }} />
      </div>

      {/* Navigation provided by global Navbar */}

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full badge-gold mb-8">
            <Zap className="w-4 h-4 text-amber-400 mr-2" />
            <span className="text-sm text-amber-300">Where Knowledge Glows, Securely</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-none">
            <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">
              Unlock the
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent animate-pulse">
              Gold
            </span>
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {" "}in Your Data
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Transform hidden organizational knowledge into <span className="text-amber-300 font-semibold">radiant, actionable insights</span>. 
            AuriVault protects your data like a vault while illuminating it like gold.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button 
              className="group relative btn-primary text-lg"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => window.location.assign('/chat')}
            >
              <span className="relative z-10 flex items-center">
                Open the Vault
                <ArrowRight className={`ml-2 w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              </span>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-700 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
            </button>
            
            <button className="flex items-center btn-secondary" onClick={() => window.location.assign('/documents')}>
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-slate-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Secure Brilliance
            </span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Experience the perfect fusion of unbreakable security and illuminating intelligence
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-slate-900/50 backdrop-blur border border-slate-700 hover:border-amber-500/50 rounded-3xl p-8 hover:transform hover:scale-105 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {React.cloneElement(feature.icon, { className: "w-6 h-6 text-slate-900" })}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Three Steps to
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Illumination
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-12 items-center">
          {[
            { icon: <FileText className="w-8 h-8" />, title: "Upload", desc: "Securely upload your documents to your encrypted vault" },
            { icon: <Brain className="w-8 h-8" />, title: "Transform", desc: "AI processes and transforms your static files into living knowledge" },
            { icon: <Lightbulb className="w-8 h-8" />, title: "Illuminate", desc: "Ask questions and receive cited, intelligent responses that glow with insight" }
          ].map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="relative mx-auto mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center mx-auto">
                  {React.cloneElement(step.icon, { className: "w-8 h-8 text-slate-900" })}
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 blur-2xl opacity-50 animate-pulse" />
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-300 text-slate-900 flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-slate-400">{step.desc}</p>
              {index < 2 && (
                <div className="hidden md:block absolute top-10 -right-6 w-12 h-0.5 bg-gradient-to-r from-amber-400 to-transparent" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-3xl blur-2xl" />
          <div className="relative bg-slate-900/80 backdrop-blur border border-amber-500/30 rounded-3xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Ready to Unlock
              </span>
              <br />
              <span className="text-white">Your Knowledge Vault?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join forward-thinking organizations who've discovered the golden potential hiding in their data
            </p>
            <button className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-900 font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/30 transform hover:scale-105 transition-all">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuriVaultLanding;