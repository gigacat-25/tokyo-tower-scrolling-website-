import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// Section Configurations for Side Navigation
const SECTIONS = [
  { id: 'hero', num: '01', title: 'HERO' },
  { id: 'specification', num: '02', title: 'SPECIFICATION' },
  { id: 'origin', num: '03', title: 'ORIGIN' },
  { id: 'structure', num: '04', title: 'STRUCTURE' },
  { id: 'observation', num: '05', title: 'OBSERVATION' },
  { id: 'illumination', num: '06', title: 'ILLUMINATION' },
  { id: 'finale', num: '07', title: 'FINALE' },
];

export default function App() {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const containerRef = useRef(null);

  // Monitor scroll for text highlight and metadata reveal (window scroll for reliability)
  const { scrollYProgress } = useScroll();

  // Transform scroll progress for Section 3 horizontal Japanese text slide
  const xTextSlide = useTransform(scrollYProgress, [0.25, 0.5], ['30vw', '-80vw']);
  // Transform scroll progress for Section 5 observational depth scaling
  const textScale = useTransform(scrollYProgress, [0.6, 0.78], [1, 1.25]);

  // Track active section based on scroll progress
  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      const index = Math.min(
        SECTIONS.length - 1,
        Math.floor(latest * SECTIONS.length)
      );
      setActiveSection(index);
      setHasScrolled(latest > 0.02);
    });
  }, [scrollYProgress]);

  // Preload Images with GPU pre-decoding to eliminate on-the-fly decode lag
  useEffect(() => {
    let loadedCount = 0;
    const totalFrames = 300;
    const imageArray = [];

    const checkAllLoaded = () => {
      loadedCount++;
      const progress = Math.round((loadedCount / totalFrames) * 100);
      setLoadProgress(progress);
      if (loadedCount === totalFrames) {
        // Slight delay for loading screen exit transition
        setTimeout(() => {
          setImagesLoaded(true);
        }, 600);
      }
    };

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, '0');
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
      img.onload = () => {
        // Force asynchronous image decoding to avoid blocking main thread on paint
        if (typeof img.decode === 'function') {
          img.decode()
            .then(checkAllLoaded)
            .catch(() => {
              checkAllLoaded();
            });
        } else {
          checkAllLoaded();
        }
      };
      img.onerror = () => {
        console.warn(`Error loading frame: ${frameNum}`);
        checkAllLoaded(); // Skip failed frame to prevent infinite loader
      };
      imageArray.push(img);
    }

    imagesRef.current = imageArray;
  }, []);

  // Set up scroll sync and canvas draw loop
  useEffect(() => {
    if (!imagesLoaded) return;

    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let lastDrawnFrame = -1;

    const drawFrame = (frameIndex) => {
      const img = imagesRef.current[frameIndex];
      if (!img) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imgWidth = img.width;
      const imgHeight = img.height;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const imgRatio = imgWidth / imgHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, drawX, drawY;

      // Cover scaling math (like object-fit: cover)
      if (canvasRatio > imgRatio) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imgRatio;
        drawX = 0;
        drawY = (canvasHeight - drawHeight) / 2;
      } else {
        drawWidth = canvasHeight * imgRatio;
        drawHeight = canvasHeight;
        drawX = (canvasWidth - drawWidth) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(Math.round(currentFrameRef.current));
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Lerp-based animation loop for smooth inertia (no scroll listeners or layout thrashing!)
    const renderLoop = () => {
      // Get the latest scroll progress directly from Framer Motion's optimized hook
      const scrollPercent = scrollYProgress.get();
      targetFrameRef.current = scrollPercent * 299;

      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) < 0.01) {
        currentFrameRef.current = targetFrameRef.current;
      } else {
        // 0.12 lerp factor for smooth scrolling physics
        currentFrameRef.current += diff * 0.12;
      }

      const frameToDraw = Math.round(currentFrameRef.current);
      // Only draw when the frame actually changes to save CPU/GPU cycles
      if (frameToDraw !== lastDrawnFrame) {
        drawFrame(frameToDraw);
        lastDrawnFrame = frameToDraw;
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [imagesLoaded, scrollYProgress]);

  return (
    <>
      {/* Dynamic grain & texture layers */}
      <div className="film-grain" />
      <div className="paper-texture" />
      <div className="vignette-overlay" />

      {/* Loading Screen */}
      <AnimatePresence>
        {!imagesLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-50 bg-[#F9F6F0] flex flex-col justify-between p-8 md:p-12"
          >
            <div className="flex justify-between items-start border-b border-navy/10 pb-6">
              <div>
                <p className="font-title text-sm tracking-[0.2em] text-navy/40">TOKYO TOWER EDITORIAL</p>
                <p className="font-serif text-xs italic text-navy/35">ISSUE NO. 01</p>
              </div>
              <p className="font-title text-sm tracking-[0.2em] text-navy/40">EST. 1958</p>
            </div>

            <div className="flex flex-col items-center justify-center my-auto">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="font-title text-6xl md:text-8xl tracking-[0.1em] text-navy font-bold text-center"
              >
                東京タワー
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 1 }}
                className="font-serif text-lg md:text-xl italic text-rust tracking-[0.15em] mt-4"
              >
                An Editorial Scroll Experience
              </motion.p>

              {/* Progress Bar */}
              <div className="w-48 h-[1px] bg-navy/10 mt-12 relative overflow-hidden">
                <motion.div 
                  className="absolute left-0 top-0 h-full bg-rust"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="font-title text-xs tracking-[0.3em] text-navy/50 mt-4">
                [{String(loadProgress).padStart(3, '0')}%]
              </p>
            </div>

            <div className="flex justify-between items-end border-t border-navy/10 pt-6">
              <p className="font-serif text-xs text-navy/40 max-w-xs leading-relaxed">
                Loading pre-rendered visual assets for full canvas interpolation. Please wait...
              </p>
              <p className="font-title text-xs tracking-widest text-navy/40">ANTIGRAVITY</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Interactive Site */}
      {imagesLoaded && (
        <div className="relative min-h-screen">
          {/* Static Background Canvas (GPU accelerated) */}
          <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[-1] w-screen h-screen object-cover pointer-events-none"
            style={{
              willChange: 'transform',
              transform: 'translate3d(0, 0, 0)',
              backfaceVisibility: 'hidden',
            }}
          />

          {/* Minimal Header UI */}
          <header className="fixed top-0 left-0 right-0 z-30 flex justify-between items-center px-8 py-6 md:px-12 pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto cursor-pointer">
              <span className="w-2.5 h-2.5 rounded-full bg-rust animate-pulse" />
              <span className="font-title text-xs tracking-[0.25em] text-navy font-bold">TOKYO TOWER</span>
            </div>
            <div className="flex items-center gap-8 pointer-events-auto">
              <span className="font-serif text-xs italic hidden md:block text-navy/50">
                A Visual Chronicle of Japan's Mid-Century Icon
              </span>
              <span className="font-title text-xs tracking-[0.2em] text-navy/60 font-semibold border-b border-navy/20 pb-0.5">
                ISSUE 01 / EDITORIAL
              </span>
            </div>
          </header>

          {/* Side Editorial TOC (Table of Contents) */}
          <nav className="fixed right-6 md:right-12 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-6 pointer-events-auto">
            {SECTIONS.map((sec, idx) => (
              <div
                key={sec.id}
                onClick={() => {
                  const targetScroll = (idx / (SECTIONS.length - 1)) * (document.documentElement.scrollHeight - window.innerHeight);
                  window.scrollTo({ top: targetScroll, behavior: 'smooth' });
                }}
                className="group flex items-center gap-4 cursor-pointer text-right"
              >
                <span className={`font-title text-[10px] tracking-wider transition-all duration-300 ${
                  activeSection === idx ? 'text-rust opacity-100 translate-x-0 font-bold' : 'text-navy/35 opacity-0 translate-x-2 group-hover:opacity-60'
                }`}>
                  {sec.title}
                </span>
                <div className="flex flex-col items-center">
                  <span className={`text-[10px] font-title transition-colors duration-300 ${
                    activeSection === idx ? 'text-rust font-bold' : 'text-navy/30'
                  }`}>
                    {sec.num}
                  </span>
                  <span className={`w-[1px] transition-all duration-300 mt-1 ${
                    activeSection === idx ? 'h-5 bg-rust' : 'h-2 bg-navy/25 group-hover:h-4 group-hover:bg-navy/50'
                  }`} />
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Left Magazine Info */}
          <footer className="fixed bottom-6 left-8 md:left-12 z-30 pointer-events-none flex flex-col gap-1">
            <span className="font-title text-[10px] tracking-[0.2em] text-navy/40">
              MINATO-KU, TOKYO, JAPAN
            </span>
            <span className="font-serif text-[10px] italic text-navy/30">
              35.6586° N, 139.7454° E
            </span>
          </footer>

          {/* Scrolling Content Container */}
          <div ref={containerRef} className="relative w-full">
            
            {/* Section 1 — Hero */}
            <section id="hero" className="relative h-screen flex flex-col justify-between items-center p-8 md:p-12">
              <div className="editorial-frame absolute inset-0 pointer-events-none" />
              <div className="w-full flex justify-between items-start pt-16 z-10 px-4 md:px-8">
                <div>
                  <span className="text-xs font-serif italic text-navy/50">VOL. I</span>
                  <h2 className="font-title text-sm tracking-[0.25em] text-navy/60 font-semibold mt-1">THE RED BEACON</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs font-serif italic text-navy/50">LOCATION</span>
                  <h2 className="font-title text-sm tracking-[0.25em] text-navy/60 font-semibold mt-1">SHIBA-KOEN</h2>
                </div>
              </div>

              {/* Minimal indicator that shifts on scroll */}
              <AnimatePresence>
                {!hasScrolled && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center gap-3 z-10 pb-8 cursor-pointer"
                    onClick={() => {
                      window.scrollTo({
                        top: window.innerHeight * 0.8,
                        behavior: 'smooth'
                      });
                    }}
                  >
                    <span className="font-title text-[10px] tracking-[0.3em] text-navy/50 font-bold">SCROLL TO COMMENCE</span>
                    <div className="w-[1px] h-12 bg-navy/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1/2 bg-rust animate-scroll-down" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Section 2 — Tower Introduction */}
            <section id="specification" className="relative min-h-screen flex items-center justify-center p-8 md:p-12 my-[20vh]">
              <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="md:col-span-6 flex flex-col gap-6"
                >
                  <p className="font-title text-xs tracking-[0.3em] text-rust font-bold">INTRODUCTION</p>
                  <h2 className="font-title text-4xl md:text-5xl lg:text-6xl text-navy font-bold leading-[1.15] tracking-tight">
                    AN ICON<br />OF MID-CENTURY<br />REBIRTH
                  </h2>
                  <div className="w-24 h-[1px] bg-rust mt-2" />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                  className="md:col-span-6 flex flex-col gap-8"
                >
                  <p className="font-serif text-lg md:text-xl text-navy/85 leading-relaxed italic">
                    <span className="float-left text-6xl font-serif text-rust mr-4 mt-2 font-bold leading-3">T</span>
                    okyo Tower stands as a striking symbol of Japan's post-war resilience. Built in 1958 during a period of massive economic growth, it rose as a beacon of modern technology, connecting a recovering nation to the digital age.
                  </p>

                  {/* Horizontal stat cards */}
                  <div className="grid grid-cols-3 border-t border-b border-navy/15 py-6 mt-4 gap-4">
                    <div>
                      <p className="font-serif text-[10px] text-navy/40 italic">HEIGHT</p>
                      <p className="font-title text-2xl font-bold text-navy mt-1">333 M</p>
                    </div>
                    <div>
                      <p className="font-serif text-[10px] text-navy/40 italic">COMPLETED</p>
                      <p className="font-title text-2xl font-bold text-navy mt-1">1958</p>
                    </div>
                    <div>
                      <p className="font-serif text-[10px] text-navy/40 italic">STRUCTURAL TYPE</p>
                      <p className="font-title text-xl font-bold text-navy mt-1.5 tracking-tight uppercase">Lattice</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Section 3 — Storytelling */}
            <section id="origin" className="relative min-h-[120vh] flex flex-col justify-center overflow-hidden py-16">
              {/* Massive Horizontal Scrolling Background Japanese Typography */}
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none whitespace-nowrap z-0">
                <motion.h3 
                  style={{ x: xTextSlide }}
                  className="font-title text-[22vh] md:text-[30vh] font-black tracking-widest text-navy uppercase"
                >
                  東京タワー 昭和三十三年
                </motion.h3>
              </div>

              <div className="w-full max-w-4xl mx-auto px-8 z-10">
                <motion.div 
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-100px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#FCFAF7]/95 backdrop-blur-[3px] border border-navy/10 p-8 md:p-16 shadow-lg relative"
                >
                  {/* Decorative vintage border lines */}
                  <div className="absolute top-3 left-3 right-3 bottom-3 border border-navy/5 pointer-events-none" />
                  
                  <div className="flex justify-between items-center border-b border-navy/10 pb-6 mb-8">
                    <span className="font-serif text-xs italic text-navy/40">CHAPTER 02 — THE ORIGIN</span>
                    <span className="font-title text-[10px] tracking-widest text-rust font-bold">NARRATIVE</span>
                  </div>

                  <h3 className="font-serif text-2xl md:text-3xl font-semibold leading-relaxed text-navy mb-6">
                    "From the embers of conflict, we forged a monument to peace."
                  </h3>
                  
                  <div className="space-y-6 text-navy/75 font-serif text-base md:text-lg leading-relaxed">
                    <p>
                      In a powerful symbolic transition, a portion of the steel used to build Tokyo Tower was recycled from decommissioned American military tanks that had served in the Korean War. 
                    </p>
                    <p>
                      This repurposing of war machines into a towering beacon of telecommunication stood as a physical testament to Japan's dedication to peace, cultural reconstruction, and forward-looking international collaboration in the mid-century era.
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-navy/10 flex items-center justify-between">
                    <span className="font-title text-[9px] tracking-[0.2em] text-navy/40">SCRAP REUSE INITIATIVE</span>
                    <span className="font-serif text-[10px] italic text-rust">Showa 33</span>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Section 4 — Architectural Details */}
            <section id="structure" className="relative min-h-screen flex items-center justify-center p-8 md:p-12 my-[20vh]">
              <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                
                {/* Stats Panel (Left on Desktop) */}
                <div className="md:col-span-5 order-2 md:order-1 grid grid-cols-1 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
                    className="border border-navy/10 p-6 bg-[#FCFAF7]/80"
                  >
                    <span className="font-serif text-xs text-navy/40 italic">WEIGHT OPTIMIZATION</span>
                    <h4 className="font-title text-2xl font-bold text-navy mt-2">4,000 TONNES</h4>
                    <p className="font-serif text-sm text-navy/60 leading-relaxed mt-2">
                      Through advanced structural lattice design, the tower weighs roughly 3,300 tonnes less than the Eiffel Tower, despite standing 9 meters taller.
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                    className="border border-navy/10 p-6 bg-[#FCFAF7]/80"
                  >
                    <span className="font-serif text-xs text-navy/40 italic">COLOR SCHEME</span>
                    <h4 className="font-title text-2xl font-bold text-rust mt-2">INTERNATIONAL ORANGE</h4>
                    <p className="font-serif text-sm text-navy/60 leading-relaxed mt-2">
                      Coated in striking orange and white bands to comply with aviation safety laws. It requires 34,000 liters of paint per coat.
                    </p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: false, margin: "-100px" }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="border border-navy/10 p-6 bg-[#FCFAF7]/80"
                  >
                    <span className="font-serif text-xs text-navy/40 italic">MAINTENANCE</span>
                    <h4 className="font-title text-2xl font-bold text-navy mt-2">HAND-PAINTED EVERY 5 YRS</h4>
                    <p className="font-serif text-sm text-navy/60 leading-relaxed mt-2">
                      The entire structure is painted completely by hand. The process takes a team of skilled painters an entire year to finish.
                    </p>
                  </motion.div>
                </div>

                {/* Narrative Panel (Right on Desktop) */}
                <div className="md:col-span-7 order-1 md:order-2 flex flex-col gap-6">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false }}
                    className="font-title text-xs tracking-[0.3em] text-rust font-bold"
                  >
                    ENGINEERING & CRAFT
                  </motion.p>
                  <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false }}
                    transition={{ duration: 1 }}
                    className="font-title text-4xl md:text-5xl lg:text-6xl text-navy font-bold leading-[1.1] tracking-tight"
                  >
                    THE ANATOMY OF STEEL
                  </motion.h2>
                  <div className="w-24 h-[1px] bg-rust my-2" />
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: false }}
                    transition={{ delay: 0.2, duration: 1 }}
                    className="font-serif text-lg text-navy/80 leading-relaxed"
                  >
                    Engineered by the legendary structural designer Tachū Naitō, Tokyo Tower was built to withstand the worst seismic events in Japan. Inspired by the Eiffel Tower, Naitō optimized the steel framework to minimize wind resistance, creating a robust yet incredibly graceful silhouette against the skyline.
                  </motion.p>
                </div>

              </div>
            </section>

            {/* Section 5 — Observation Deck */}
            <section id="observation" className="relative min-h-screen flex items-center justify-center p-8 md:p-12 my-[15vh]">
              <div className="w-full max-w-4xl text-center flex flex-col items-center gap-6">
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false }}
                  className="font-title text-xs tracking-[0.3em] text-rust font-bold"
                >
                  DECK EXPERIENCE
                </motion.p>
                
                <motion.div style={{ scale: textScale }} className="flex flex-col gap-4">
                  <h2 className="font-title text-4xl md:text-6xl lg:text-7xl text-navy font-bold tracking-tight">
                    THE PANORAMIC GAZE
                  </h2>
                  <p className="font-serif text-lg md:text-2xl text-rust italic tracking-wide">
                    150m Main Deck / 250m Top Deck
                  </p>
                </motion.div>

                <div className="w-16 h-[1px] bg-navy/25 my-4" />

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 1 }}
                  className="font-serif text-lg md:text-xl text-navy/80 leading-relaxed max-w-2xl"
                >
                  Perched high above the city, the observation platforms provide a spectacular 360-degree panorama of the sprawling metropolis. On clear mornings, the snow-covered peak of Mt. Fuji stands majestically on the western horizon, representing the eternal link between urban progress and natural beauty.
                </motion.p>
              </div>
            </section>

            {/* Section 6 — Skyline Experience */}
            <section id="illumination" className="relative min-h-screen flex items-center justify-center p-8 md:p-12 my-[15vh]">
              <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
                
                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 1 }}
                  className="md:col-span-6 md:order-2 flex flex-col gap-6"
                >
                  <p className="font-title text-xs tracking-[0.3em] text-rust font-bold">ATMOSPHERE</p>
                  <h2 className="font-title text-4xl md:text-5xl lg:text-6xl text-navy font-bold leading-tight">
                    A BEACON IN THE METROPOLITAN NIGHT
                  </h2>
                  <div className="w-24 h-[1px] bg-rust mt-2" />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="md:col-span-6 md:order-1 flex flex-col gap-6"
                >
                  <p className="font-serif text-lg text-navy/80 leading-relaxed">
                    As twilight fades, Tokyo Tower transforms into a vibrant sculpture of light. The tower features two distinct lighting systems: the warm orange "Landmark Light," which glows with amber intensity during winter, and the colorful "Diamond Veil," wrapping the lattice in patterns of ruby, sapphire, and emerald.
                  </p>
                  
                  <div className="border-l-2 border-rust pl-6 py-2 italic font-serif text-navy/70 text-base">
                    "A vibrant monument that captures the heartbeat of the capital, lighting up the sky and shifting colors to match the passing seasons."
                  </div>
                </motion.div>

              </div>
            </section>

            {/* Section 7 — Final Reveal */}
            <section id="finale" className="relative h-screen flex flex-col justify-between items-center p-8 md:p-12">
              <div className="editorial-frame absolute inset-0 pointer-events-none" />
              
              <div className="w-full flex justify-between items-start pt-16 z-10 px-4 md:px-8">
                <span className="font-serif text-xs italic text-navy/40">END OF ISSUE 01</span>
                <span className="font-title text-[9px] tracking-[0.25em] text-navy/40">SHIBA-KOEN, TOKYO</span>
              </div>

              {/* Final Typography overlay */}
              <div className="text-center z-10 flex flex-col items-center gap-4">
                <motion.h1 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: false }}
                  transition={{ duration: 1.5 }}
                  className="font-title text-7xl md:text-9xl tracking-[0.2em] font-bold text-navy"
                >
                  TOKYO
                </motion.h1>
                <div className="w-12 h-[1px] bg-rust my-2" />
                <p className="font-serif text-sm tracking-[0.3em] text-rust uppercase">
                  A Modern Tribute
                </p>
              </div>

              {/* Vintage Credits Footer */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-end pb-8 border-t border-navy/10 pt-6 z-10 px-4 md:px-8">
                <div className="flex flex-col gap-1">
                  <p className="font-title text-[9px] tracking-widest text-navy/45">CREDITS & DESIGN</p>
                  <p className="font-serif text-xs text-navy/60 leading-relaxed">
                    Designed and built by Antigravity under Google DeepMind. Powered by pre-rendered canvas frame buffers.
                  </p>
                </div>
                <div className="flex justify-center">
                  <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="font-title text-[10px] tracking-[0.3em] text-rust font-bold hover:text-navy transition-colors border border-rust/30 hover:border-navy/30 px-6 py-2 bg-cream"
                  >
                    RETURN TO COVERS
                  </button>
                </div>
                <div className="text-left md:text-right flex flex-col gap-1">
                  <p className="font-title text-[9px] tracking-widest text-navy/45">CHRONICLE INC.</p>
                  <p className="font-serif text-xs text-navy/40">
                    © 2026 Tokyo Tower Editorial. All rights reserved.
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>
      )}
    </>
  );
}
