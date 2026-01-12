import { useState, useEffect } from "react";
import { AnthropicLogo, OpenAILogo } from "./icons/ai-logos";

type Phase = "approaching" | "denied" | "reset";

export function GateAnimation() {
  const [phase, setPhase] = useState<Phase>("approaching");

  useEffect(() => {
    const runSequence = async () => {
      setPhase("approaching");
      await delay(2800);
      setPhase("denied");
      await delay(3500);
      setPhase("reset");
      await delay(400);
    };

    runSequence();
    const interval = setInterval(runSequence, 6700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gate-scene" data-phase={phase}>
      {/* Atmospheric fog */}
      <div className="fog-layer" />
      
      {/* Torch flames */}
      <div className="torch torch-left">
        <div className="torch-bracket" />
        <div className="flame">
          <div className="flame-core" />
        </div>
        <div className="torch-glow" />
      </div>
      <div className="torch torch-right">
        <div className="torch-bracket" />
        <div className="flame">
          <div className="flame-core" />
        </div>
        <div className="torch-glow" />
      </div>

      {/* Stone archway */}
      <div className="archway">
        <div className="arch-stones">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="arch-stone" style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className="keystone">
          <svg viewBox="0 0 24 24" className="keystone-skull">
            <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 3.052 1.364 5.78 3.5 7.614V22h2v-1.5h2V22h5v-1.5h2V22h2v-2.386C20.636 17.78 22 15.052 22 12c0-5.523-4.477-10-10-10zm-3 12a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm-3 4c-1.657 0-3-.895-3-2h6c0 1.105-1.343 2-3 2z"/>
          </svg>
        </div>
      </div>

      {/* Left pillar */}
      <div className="pillar pillar-left">
        <div className="pillar-cap" />
        <div className="pillar-body">
          <div className="pillar-groove" />
          <div className="pillar-groove" />
          <div className="pillar-groove" />
        </div>
        <div className="pillar-base" />
      </div>

      {/* Right pillar */}
      <div className="pillar pillar-right">
        <div className="pillar-cap" />
        <div className="pillar-body">
          <div className="pillar-groove" />
          <div className="pillar-groove" />
          <div className="pillar-groove" />
        </div>
        <div className="pillar-base" />
      </div>

      {/* The gate opening - dark void */}
      <div className="gate-void">
        {/* Approaching entities */}
        <div className="entities">
          <div className="entity entity-1">
            <div className="entity-glow" />
            <OpenAILogo className="entity-logo" />
          </div>
          <div className="entity entity-2">
            <div className="entity-glow" />
            <AnthropicLogo className="entity-logo" />
          </div>
        </div>
      </div>

      {/* Portcullis */}
      <div className="portcullis">
        <div className="portcullis-frame">
          {/* Vertical bars */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bar-v" style={{ left: `${i * 16.66}%` }}>
              <div className="spike" />
            </div>
          ))}
          {/* Horizontal bars */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bar-h" style={{ top: `${15 + i * 20}%` }} />
          ))}
        </div>
      </div>

      {/* Denied stamp */}
      <div className="denied-stamp">
        <span>DENIED</span>
      </div>

      {/* Ground cracks from impact */}
      <div className="impact-cracks">
        <svg viewBox="0 0 200 30" preserveAspectRatio="none">
          <path d="M100 0 L95 15 L85 10 L80 25 L70 20" stroke="currentColor" fill="none" strokeWidth="2"/>
          <path d="M100 0 L105 15 L115 10 L120 25 L130 20" stroke="currentColor" fill="none" strokeWidth="2"/>
          <path d="M100 0 L100 20 L95 30" stroke="currentColor" fill="none" strokeWidth="2"/>
        </svg>
      </div>

      <style>{`
        .gate-scene {
          --void: oklch(0.08 0.02 280);
          --stone: oklch(0.38 0.02 60);
          --stone-light: oklch(0.48 0.025 55);
          --stone-dark: oklch(0.25 0.015 65);
          --iron: oklch(0.28 0.01 250);
          --iron-light: oklch(0.38 0.01 245);
          --crimson: oklch(0.55 0.22 25);
          --flame: oklch(0.75 0.18 60);
          --flame-core: oklch(0.95 0.15 90);
          
          position: relative;
          width: 100%;
          max-width: 420px;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          background: radial-gradient(ellipse at 50% 120%, var(--void) 0%, oklch(0.04 0.01 280) 100%);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 
            inset 0 0 60px oklch(0 0 0 / 0.5),
            0 20px 60px oklch(0 0 0 / 0.4);
        }

        /* Fog */
        .fog-layer {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 30% 80%, oklch(0.5 0 0 / 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 90%, oklch(0.5 0 0 / 0.06) 0%, transparent 40%);
          animation: fog-drift 8s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 20;
        }
        @keyframes fog-drift {
          0% { transform: translateX(-5%) translateY(0); opacity: 0.6; }
          100% { transform: translateX(5%) translateY(-3%); opacity: 0.9; }
        }

        /* Torches */
        .torch {
          position: absolute;
          top: 15%;
          width: 8%;
          height: 25%;
          z-index: 15;
        }
        .torch-left { left: 8%; }
        .torch-right { right: 8%; }

        .torch-bracket {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40%;
          height: 60%;
          background: linear-gradient(to right, var(--iron), var(--iron-light), var(--iron));
          border-radius: 2px;
        }

        .flame {
          position: absolute;
          bottom: 55%;
          left: 50%;
          transform: translateX(-50%);
          width: 70%;
          aspect-ratio: 1 / 1.5;
          background: radial-gradient(ellipse at 50% 80%, var(--flame) 0%, oklch(0.6 0.2 30) 60%, transparent 100%);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          animation: flicker 0.15s ease-in-out infinite alternate;
          filter: blur(1px);
        }
        .flame-core {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          width: 40%;
          height: 50%;
          background: var(--flame-core);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          animation: flicker-core 0.1s ease-in-out infinite alternate;
        }
        @keyframes flicker {
          0% { transform: translateX(-50%) scaleY(1) scaleX(1); }
          100% { transform: translateX(-50%) scaleY(1.1) scaleX(0.95); }
        }
        @keyframes flicker-core {
          0% { opacity: 0.9; }
          100% { opacity: 1; }
        }

        .torch-glow {
          position: absolute;
          bottom: 40%;
          left: 50%;
          transform: translateX(-50%);
          width: 300%;
          aspect-ratio: 1;
          background: radial-gradient(circle, oklch(0.7 0.15 50 / 0.3) 0%, transparent 60%);
          pointer-events: none;
          animation: glow-pulse 2s ease-in-out infinite alternate;
        }
        @keyframes glow-pulse {
          0% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          100% { opacity: 1; transform: translateX(-50%) scale(1.1); }
        }

        /* Archway */
        .archway {
          position: absolute;
          top: 5%;
          left: 20%;
          right: 20%;
          height: 20%;
          z-index: 12;
        }

        .arch-stones {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
        }

        .arch-stone {
          width: 11%;
          height: 100%;
          background: linear-gradient(
            to bottom,
            var(--stone-light) 0%,
            var(--stone) 30%,
            var(--stone-dark) 100%
          );
          transform-origin: bottom center;
          transform: rotate(calc((var(--i) - 4) * 8deg));
          border: 1px solid var(--stone-dark);
          box-shadow: inset 0 2px 4px oklch(1 0 0 / 0.1);
        }

        .keystone {
          position: absolute;
          top: -5%;
          left: 50%;
          transform: translateX(-50%);
          width: 18%;
          height: 70%;
          background: linear-gradient(to bottom, var(--stone-light), var(--stone-dark));
          clip-path: polygon(15% 0, 85% 0, 100% 100%, 0 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2;
        }

        .keystone-skull {
          width: 50%;
          height: 50%;
          color: var(--crimson);
          filter: drop-shadow(0 0 8px var(--crimson));
          animation: skull-glow 3s ease-in-out infinite alternate;
        }
        @keyframes skull-glow {
          0% { filter: drop-shadow(0 0 5px var(--crimson)); }
          100% { filter: drop-shadow(0 0 12px var(--crimson)); }
        }

        /* Pillars */
        .pillar {
          position: absolute;
          top: 10%;
          width: 18%;
          height: 85%;
          z-index: 10;
        }
        .pillar-left { left: 2%; }
        .pillar-right { right: 2%; }

        .pillar-cap {
          height: 8%;
          background: linear-gradient(to bottom, var(--stone-light), var(--stone));
          clip-path: polygon(10% 100%, 50% 0, 90% 100%);
        }

        .pillar-body {
          height: 82%;
          background: linear-gradient(to right, var(--stone-dark) 0%, var(--stone) 20%, var(--stone-light) 50%, var(--stone) 80%, var(--stone-dark) 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          padding: 0 15%;
        }

        .pillar-groove {
          height: 3%;
          background: var(--stone-dark);
          box-shadow: 0 1px 0 var(--stone-light);
        }

        .pillar-base {
          height: 10%;
          background: linear-gradient(to bottom, var(--stone), var(--stone-dark));
          clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%);
        }

        /* Gate void */
        .gate-void {
          position: absolute;
          top: 22%;
          left: 20%;
          right: 20%;
          bottom: 5%;
          background: 
            radial-gradient(ellipse at 50% 30%, oklch(0.12 0.02 280) 0%, var(--void) 70%);
          z-index: 1;
        }

        /* Entities */
        .entities {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15%;
        }

        .entity {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          opacity: 0;
          transform: scale(0.3) translateY(100%);
        }

        .gate-scene[data-phase="approaching"] .entity {
          animation: entity-approach 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .gate-scene[data-phase="approaching"] .entity-2 {
          animation-delay: 0.3s;
        }

        @keyframes entity-approach {
          0% { 
            opacity: 0; 
            transform: scale(0.2) translateY(80%);
            filter: blur(4px);
          }
          60% { 
            opacity: 1; 
            transform: scale(0.9) translateY(5%);
            filter: blur(0);
          }
          100% { 
            opacity: 1; 
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        .gate-scene[data-phase="denied"] .entity {
          animation: entity-denied 0.5s ease-out forwards;
        }
        .gate-scene[data-phase="denied"] .entity-2 {
          animation-delay: 0.05s;
        }

        @keyframes entity-denied {
          0% { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
          100% { 
            opacity: 0; 
            transform: scale(0.5) translateY(30%);
            filter: blur(3px);
          }
        }

        .entity-glow {
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, oklch(0.6 0.1 250 / 0.4) 0%, transparent 60%);
          animation: entity-pulse 2s ease-in-out infinite alternate;
        }
        @keyframes entity-pulse {
          0% { opacity: 0.5; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1.1); }
        }

        .entity-logo {
          width: clamp(2.5rem, 8vw, 4rem);
          height: clamp(2.5rem, 8vw, 4rem);
          color: oklch(0.9 0 0);
          filter: drop-shadow(0 0 10px oklch(1 0 0 / 0.5));
          position: relative;
          z-index: 2;
        }

        /* Portcullis */
        .portcullis {
          position: absolute;
          top: 22%;
          left: 20%;
          right: 20%;
          height: 78%;
          z-index: 5;
          pointer-events: none;
        }

        .portcullis-frame {
          position: absolute;
          top: -100%;
          left: 0;
          right: 0;
          height: 100%;
          transition: transform 0.1s;
        }

        .gate-scene[data-phase="denied"] .portcullis-frame {
          animation: gate-slam 0.4s cubic-bezier(0.32, 0, 0.67, 0) forwards;
        }
        .gate-scene[data-phase="reset"] .portcullis-frame {
          transform: translateY(0);
        }

        @keyframes gate-slam {
          0% { transform: translateY(0); }
          70% { transform: translateY(103%); }
          80% { transform: translateY(98%); }
          90% { transform: translateY(101%); }
          100% { transform: translateY(100%); }
        }

        .bar-v {
          position: absolute;
          top: 0;
          width: 7%;
          height: 100%;
          background: linear-gradient(to right, var(--iron) 0%, var(--iron-light) 40%, var(--iron) 100%);
          box-shadow: 2px 0 4px oklch(0 0 0 / 0.4);
        }

        .spike {
          position: absolute;
          bottom: -8%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 10px solid transparent;
          border-right: 10px solid transparent;
          border-top: 24px solid var(--iron-light);
          filter: drop-shadow(0 4px 4px oklch(0 0 0 / 0.6));
        }

        .bar-h {
          position: absolute;
          left: 0;
          right: 0;
          height: 5%;
          background: linear-gradient(to bottom, var(--iron-light) 0%, var(--iron) 50%, oklch(0.2 0.01 250) 100%);
          box-shadow: 0 2px 4px oklch(0 0 0 / 0.4);
        }

        /* Denied stamp */
        .denied-stamp {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-12deg) scale(0);
          z-index: 25;
          pointer-events: none;
          opacity: 0;
        }

        .gate-scene[data-phase="denied"] .denied-stamp {
          animation: stamp-slam 0.3s 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes stamp-slam {
          0% { 
            opacity: 0; 
            transform: translate(-50%, -50%) rotate(-12deg) scale(2.5);
          }
          100% { 
            opacity: 1; 
            transform: translate(-50%, -50%) rotate(-12deg) scale(1);
          }
        }

        .denied-stamp span {
          display: block;
          font-family: var(--font-display, 'Jacquard 12', serif);
          font-size: clamp(2rem, 8vw, 3.5rem);
          font-weight: 400;
          color: var(--crimson);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          padding: 0.3em 0.6em;
          border: 4px solid var(--crimson);
          border-radius: 4px;
          background: oklch(0.08 0.02 25 / 0.9);
          box-shadow: 
            0 0 30px var(--crimson),
            inset 0 0 20px oklch(0.5 0.2 25 / 0.3);
          text-shadow: 0 0 20px var(--crimson);
        }

        /* Impact cracks */
        .impact-cracks {
          position: absolute;
          bottom: 3%;
          left: 25%;
          right: 25%;
          height: 8%;
          z-index: 6;
          opacity: 0;
          color: var(--stone-dark);
        }

        .gate-scene[data-phase="denied"] .impact-cracks {
          animation: cracks-appear 0.2s 0.35s ease-out forwards;
        }

        @keyframes cracks-appear {
          0% { opacity: 0; transform: scaleX(0.5); }
          100% { opacity: 0.7; transform: scaleX(1); }
        }

        .impact-cracks svg {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
