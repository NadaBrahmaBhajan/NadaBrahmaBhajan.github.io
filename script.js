/**
 * Nada Bramha - Main Script
 * Handles Audio (Manjira), Smoke Animation, and UI interactions.
 */

console.log("Nada Bramha Script Loaded");

/* =========================================
   UI & Navigation Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking a link
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    // Audio Toggles
    const desktopAudioBtn = document.getElementById('audio-toggle-desktop');
    const mobileAudioBtn = document.getElementById('audio-toggle-mobile');

    if (desktopAudioBtn) desktopAudioBtn.addEventListener('click', toggleAudioState);
    if (mobileAudioBtn) mobileAudioBtn.addEventListener('click', toggleAudioState);
});


/* =========================================
   Smoke Animation (Canvas)
   ========================================= */

const canvas = document.getElementById('smoke-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // Resize handling
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.vx = (Math.random() - 0.5) * 0.3; // Very slow drift X
            this.vy = -0.5 - Math.random() * 0.5; // Slow drift Up
            this.life = 0;
            this.maxLife = 400 + Math.random() * 200;
            this.size = 20 + Math.random() * 30;
        }

        update() {
            this.life++;
            this.x += this.vx;
            this.y += this.vy;
            this.x += Math.sin(this.life * 0.01) * 0.2; // Gentle sway
        }

        draw(context) {
            const opacity = (1 - this.life / this.maxLife) * 0.15;
            const gradient = context.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.size * 2
            );
            gradient.addColorStop(0, `rgba(200, 200, 200, ${opacity})`);
            gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);

            context.fillStyle = gradient;
            context.beginPath();
            context.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
            context.fill();
        }
    }

    const animateSmoke = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Add particles occasionally
        if (Math.random() < 0.1) {
            particles.push(new Particle());
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw(ctx);
            if (p.life >= p.maxLife) {
                particles.splice(i, 1);
            }
        }
        requestAnimationFrame(animateSmoke);
    };

    animateSmoke();
}


/* =========================================
   Audio Logic (Manjira)
   ========================================= */

let audioCtx = null;
let isPlaying = false;
let nextNoteTime = 0.0;
let timerID = null;
const LOOKAHEAD = 25.0; 
const SCHEDULE_AHEAD_TIME = 0.1; 

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playManjiraSound(time) {
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.value = 3000 + Math.random() * 500; 
    filter.Q.value = 8; 

    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.01); 
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5); 

    osc.type = 'triangle'; 
    osc.frequency.setValueAtTime(2800, time);
    osc.frequency.exponentialRampToValueAtTime(2780, time + 1.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(time);
    osc.stop(time + 2.0);

    // Click sound
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(8000, time);
    gain2.gain.setValueAtTime(0.05, time);
    gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(time);
    osc2.stop(time + 0.1);
}

function scheduler() {
    if (!audioCtx) return;
    while (nextNoteTime < audioCtx.currentTime + SCHEDULE_AHEAD_TIME) {
        playManjiraSound(nextNoteTime);
        const randomDelay = 3 + Math.random() * 3;
        nextNoteTime += randomDelay;
    }
    if (isPlaying) {
        timerID = window.setTimeout(scheduler, LOOKAHEAD);
    }
}

function startManjira() {
    if (isPlaying) return;
    initAudio();
    if (!audioCtx) return;

    isPlaying = true;
    nextNoteTime = audioCtx.currentTime + 0.5;
    scheduler();
}

function stopManjira() {
    isPlaying = false;
    if (timerID) {
        clearTimeout(timerID);
        timerID = null;
    }
}

function toggleAudioState() {
    isPlaying = !isPlaying;
    
    // Update UI
    const desktopText = document.getElementById('audio-text-desktop');
    const desktopBtn = document.getElementById('audio-toggle-desktop');
    const mobileBtn = document.getElementById('audio-toggle-mobile');
    const desktopIcon = document.getElementById('audio-icon-desktop');
    const mobileIcon = document.getElementById('audio-icon-mobile');

    if (isPlaying) {
        startManjira();
        if(desktopText) desktopText.textContent = "Sound On";
        
        // Add active styling
        if(desktopBtn) {
            desktopBtn.classList.remove('bg-stone-100', 'text-stone-500');
            desktopBtn.classList.add('bg-saffron-100', 'text-maroon-600', 'border-saffron-300');
        }
        if(mobileBtn) {
            mobileBtn.classList.remove('text-stone-400');
            mobileBtn.classList.add('text-maroon-600', 'bg-saffron-50');
        }
        
        // Add pulse
        if(desktopIcon) desktopIcon.classList.add('animate-pulse');
        if(mobileIcon) mobileIcon.classList.add('animate-pulse');

    } else {
        stopManjira();
        if(desktopText) desktopText.textContent = "Sound Off";

        // Remove active styling
        if(desktopBtn) {
            desktopBtn.classList.add('bg-stone-100', 'text-stone-500');
            desktopBtn.classList.remove('bg-saffron-100', 'text-maroon-600', 'border-saffron-300');
        }
        if(mobileBtn) {
            mobileBtn.classList.add('text-stone-400');
            mobileBtn.classList.remove('text-maroon-600', 'bg-saffron-50');
        }

        // Remove pulse
        if(desktopIcon) desktopIcon.classList.remove('animate-pulse');
        if(mobileIcon) mobileIcon.classList.remove('animate-pulse');
    }
}
