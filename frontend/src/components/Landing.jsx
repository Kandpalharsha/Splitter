import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Clock, Activity } from 'lucide-react';

export default function Landing() {
    return (
        <div className="bg-paper text-obsidian min-h-screen relative font-heading overflow-x-hidden">
            {/* Global Noise */}
            <div className="pointer-events-none fixed inset-0 z-50 opacity-5">
                <svg width="100%" height="100%">
                    <filter id="noise">
                        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noise)" />
                </svg>
            </div>

            {/* Navbar */}
            <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-paper border-2 border-obsidian brutal-shadow-sm px-6 py-3 flex items-center justify-between w-11/12 max-w-4xl">
                <div className="font-bold text-xl tracking-tight uppercase">Splitter</div>
                <div className="hidden md:flex gap-6 text-sm font-medium">
                    <a href="#features" className="hover:underline underline-offset-4 decoration-2">Why Choose Us?</a>
                </div>
                <div className="text-sm font-bold uppercase tracking-widest">
                    Made with love ❤️
                </div>
            </nav>

            {/* Hero */}
            <section className="relative min-h-[100dvh] w-full flex flex-col md:flex-row items-center justify-between px-8 md:px-16 pt-32 pb-16 max-w-7xl mx-auto">
                <div className="w-full max-w-2xl text-obsidian order-2 md:order-1 mt-12 md:mt-0">
                    <h1 className="leading-[0.9] tracking-tighter mb-12">
                        <div className="font-drama italic text-5xl md:text-[6rem]">Shared expenses without the math.</div>
                    </h1>
                    <div>
                        <Link to="/login" className="inline-flex items-center gap-3 bg-paper text-obsidian border-2 border-obsidian brutal-shadow brutal-hover px-8 py-4 text-lg font-bold uppercase tracking-wide">
                            <span>Start Splitting</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
                
                <div className="w-full md:w-1/2 h-[40dvh] md:h-[60dvh] relative order-1 md:order-2 border-4 border-obsidian brutal-shadow bg-offwhite p-4">
                    <img src="/hero_image.png" alt="Surreal collage graphic" className="w-full h-full object-contain" />
                </div>
            </section>

            {/* Features (Micro-UI) & Get Started */}
            <section id="features" className="py-24 px-8 md:px-16 bg-offwhite border-t-2 border-obsidian">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-bold uppercase mb-4">Why Splitter?</h2>
                        <p className="text-xl font-medium">Ditch the spreadsheets and complex math.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-24">
                        {/* Card 1: Min-Transaction */}
                        <div className="bg-paper p-8 border-2 border-obsidian brutal-shadow hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="font-data text-sm mb-8 uppercase tracking-widest font-bold">01. Efficiency</h3>
                            <div className="h-32 flex items-center justify-center">
                                <Activity className="w-16 h-16 text-obsidian" />
                            </div>
                            <h4 className="text-2xl font-bold mt-8 mb-2">Min-Transaction Algorithm</h4>
                            <p className="font-medium text-sm">Reduces group debts to the absolute minimum required transfers.</p>
                        </div>

                        {/* Card 2: Custom Splits */}
                        <div className="bg-obsidian text-paper p-8 border-2 border-obsidian brutal-shadow hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="font-data text-sm text-paper/60 mb-8 uppercase tracking-widest font-bold">02. Flexibility</h3>
                            <div className="h-32 flex items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-paper" />
                            </div>
                            <h4 className="text-2xl font-bold mt-8 mb-2">Live Splitting</h4>
                            <p className="font-medium text-sm text-paper/80">Support for equal splits and exact custom amounts.</p>
                        </div>

                        {/* Card 3: Telemetry */}
                        <div className="bg-paper p-8 border-2 border-obsidian brutal-shadow hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="font-data text-sm mb-8 uppercase tracking-widest font-bold">03. Telemetry</h3>
                            <div className="h-32 flex items-center justify-center">
                                <Clock className="w-16 h-16 text-obsidian" />
                            </div>
                            <h4 className="text-2xl font-bold mt-8 mb-2">Real-time History</h4>
                            <p className="font-medium text-sm">Keep an immutable ledger of every expense added to the group.</p>
                        </div>
                    </div>

                    {/* Get Started Footer CTA */}
                    <div className="bg-paper border-2 border-obsidian brutal-shadow p-12 text-center max-w-4xl mx-auto">
                        <h2 className="text-3xl md:text-5xl font-bold uppercase mb-8">Ready to settle up?</h2>
                        <Link to="/login" className="inline-flex items-center gap-3 bg-obsidian text-paper border-2 border-obsidian brutal-shadow-sm brutal-hover-sm px-8 py-4 text-lg font-bold uppercase tracking-wide">
                            <span>Create a Group</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
