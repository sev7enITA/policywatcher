/**
 * @file LiveAssistant.tsx
 *
 * AI-powered chat assistant overlay ("Policy Live Assistant").
 *
 * Architecture:
 *  1. **Text chat** — sends the user's question to `/api/chat` (Gemini),
 *     receives a markdown-formatted answer, and renders it in a scrollable
 *     message log.
 *  2. **Text-to-Speech** — after each answer the component tries Google
 *     Cloud TTS (`/api/tts`). If that endpoint is unavailable or rate-
 *     limited, it falls back to the browser's built-in SpeechSynthesis.
 *  3. **Speech-to-Text** — uses the Web Speech API (`webkitSpeechRecognition`)
 *     for voice input. The recognised transcript is automatically sent as
 *     a chat message.
 *  4. **Canvas visualiser** — a real-time waveform animation whose shape,
 *     amplitude, and colour change based on the current assistant state
 *     (idle / listening / processing / speaking).
 *
 * Supports EN/IT localisation.
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Mic, 
  Send, 
  Volume2, 
  VolumeX, 
  Cpu
} from 'lucide-react';
import styles from './LiveAssistant.module.css';
import type { Company } from '@/types/index';

/** Props for the {@link LiveAssistant} component. */
interface LiveAssistantProps {
  /** Callback to dismiss the assistant overlay. */
  onClose: () => void;
  /** Full company list (available for context-aware prompts). */
  companies: Company[];
  /** Active UI language — affects greeting, placeholders, and TTS voice. */
  lang: 'en' | 'it';
}

/** A single entry in the chat message log. */
interface Message {
  /** Who authored this message. */
  sender: 'user' | 'system';
  /** Raw message text (system messages may contain lightweight markdown). */
  text: string;
}

/**
 * Finite-state machine for the assistant's activity.
 * Drives the waveform visualiser and disables/enables UI controls.
 */
type AssistantState = 'idle' | 'listening' | 'speaking' | 'processing';

const translations = {
  en: {
    greeting: 'Hello! I am your Policy Live Assistant. I can analyze terms of service and privacy policies for you. Ask me, for example: "What biometric changes has Stripe introduced?" or "How does Google handle my Gemini Live voice data?".',
    placeholder: 'Ask a question about policies...',
    processing: 'Gemini is analyzing the documents...',
    idle: 'Ready to listen',
    listening: 'Listening... speak now',
    processingStatus: 'Gemini is processing...',
    speaking: 'Live Speech Assistant',
    speechOn: 'Voice ON',
    speechOff: 'Voice OFF',
    muteTitle: 'Mute voice responses',
    unmuteTitle: 'Enable voice responses',
    micTitle: 'Record voice question',
    error: 'Sorry, I encountered a connection error with the GenAI module.',
  },
  it: {
    greeting: 'Ciao! Sono il tuo Policy Live Assistant. Posso analizzare i termini di servizio e le privacy policy per te. Chiedimi, ad esempio: "Quali sono le novita biometriche introdotte da Stripe?" o "Come tratta Google i miei dati vocali di Gemini Live?".',
    placeholder: 'Fai una domanda sulle policy...',
    processing: 'Gemini sta analizzando i documenti...',
    idle: 'Pronto ad ascoltare',
    listening: 'Ascolto in corso... parla ora',
    processingStatus: 'Gemini sta elaborando...',
    speaking: 'Live Speech Assistant',
    speechOn: 'Sintesi Vocale ON',
    speechOff: 'Sintesi Vocale OFF',
    muteTitle: 'Muta risposte vocali',
    unmuteTitle: 'Attiva risposte vocali',
    micTitle: 'Registra domanda a voce',
    error: 'Scusami, ho riscontrato un errore di connessione con il modulo GenAI.',
  },
};

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: Event) => void;
  onend: () => void;
}

/**
 * Full-screen AI chat assistant with voice I/O and animated waveform.
 *
 * @param props - {@link LiveAssistantProps}
 * @returns The assistant overlay with chat log, input bar, and wave canvas.
 */
export default function LiveAssistant({ onClose, companies, lang }: LiveAssistantProps) {
  const t = translations[lang];

  /**
   * Lightweight markdown-to-HTML converter for system messages.
   * Supports **bold**, bullet lists (`- …`), and line breaks.
   */
  const renderMarkdown = (text: string): string => {
    return text
      // Bold: **text** -> <strong>text</strong>
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Bullet points: - text -> styled list item
      .replace(/^- (.+)$/gm, '<div style="display:flex;gap:6px;margin:4px 0;align-items:baseline"><span style="color:#6366f1;font-weight:600">&#8226;</span><span>$1</span></div>')
      // Line breaks
      .replace(/\n/g, '<br />');
  };
  
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'system', text: t.greeting },
  ]);
  const [input, setInput] = useState('');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [closing, setClosing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleSendMessageRef = useRef<((text?: string) => void) | null>(null);
  const ttsUnavailableRef = useRef(false);

  // Auto-scroll chat area
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantState]);

  // Main send message handler
  const handleSendMessage = useCallback(async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setAssistantState('processing');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      setMessages((prev) => [...prev, { sender: 'system', text: data.answer }]);
      
      // Speak response via Google Cloud TTS if enabled
      if (speechEnabled && !ttsUnavailableRef.current) {
        try {
          // Stop any currently playing audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }

          const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: data.answer, lang }),
          });

          if (ttsRes.ok) {
            const audioBlob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => setAssistantState('speaking');
            audio.onended = () => {
              setAssistantState('idle');
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
            };
            audio.onerror = () => {
              setAssistantState('idle');
              URL.revokeObjectURL(audioUrl);
              audioRef.current = null;
            };

            await audio.play();
          } else {
            // TTS API not available, fall back to browser TTS
            const errData = await ttsRes.json().catch(() => null);
            if (errData?.fallback) {
              ttsUnavailableRef.current = true;
              speakWithBrowserTTS(data.answer, lang);
            }
            setAssistantState('idle');
          }
        } catch {
          setAssistantState('idle');
        }
      } else if (speechEnabled && ttsUnavailableRef.current) {
        // Use browser TTS as fallback
        speakWithBrowserTTS(data.answer, lang);
      } else {
        setAssistantState('idle');
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'system', text: t.error }]);
      setAssistantState('idle');
    }
  }, [input, lang, speechEnabled, t.error]);

  /**
   * Browser-native TTS fallback used when Google Cloud TTS is
   * unavailable (e.g. rate-limited or misconfigured).
   */
  const speakWithBrowserTTS = (text: string, language: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_-]/g, ' ').replace(/\[.*?\]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'it' ? 'it-IT' : 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang.startsWith(language === 'it' ? 'it' : 'en'));
    if (voice) utterance.voice = voice;
    utterance.onstart = () => setAssistantState('speaking');
    utterance.onend = () => setAssistantState('idle');
    utterance.onerror = () => setAssistantState('idle');
    window.speechSynthesis.speak(utterance);
  };

  // Keep ref in sync for speech recognition callback
  useEffect(() => {
    handleSendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionConstructor) {
      const rec = new SpeechRecognitionConstructor() as SpeechRecognition;
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang === 'it' ? 'it-IT' : 'en-US';

      rec.onstart = () => setAssistantState('listening');

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInput(transcript);
          handleSendMessageRef.current?.(transcript);
        }
      };

      rec.onerror = () => setAssistantState('idle');
      rec.onend = () => {
        setAssistantState((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [lang]);

  // Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Canvas wave visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    let animationId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      let waves = 1;
      let amplitude = 3;
      let frequency = 0.015;
      let speed = 0.04;
      let color = 'rgba(99, 102, 241, 0.4)';

      if (assistantState === 'listening') {
        waves = 3; amplitude = 18; frequency = 0.025; speed = 0.12;
        color = 'rgba(6, 182, 212, 0.6)';
      } else if (assistantState === 'speaking') {
        waves = 4;
        amplitude = 18 + Math.abs(Math.sin(Date.now() * 0.015)) * 14;
        frequency = 0.02; speed = 0.16;
        color = 'rgba(129, 140, 248, 0.8)';
      } else if (assistantState === 'processing') {
        waves = 2; amplitude = 6; frequency = 0.05; speed = 0.22;
        color = 'rgba(165, 180, 252, 0.5)';
      }

      for (let w = 0; w < waves; w++) {
        ctx.beginPath();
        const wPhase = phase + (w * Math.PI) / 3;
        const wAmp = amplitude * (1 - w * 0.25);
        ctx.strokeStyle = w === 0 ? color : color.replace(/[\d.]+\)$/, '0.25)');
        ctx.lineWidth = w === 0 ? 2.5 : 1;

        for (let x = 0; x < width; x++) {
          const envelope = Math.sin((x / width) * Math.PI);
          const y = centerY + Math.sin(x * frequency - wPhase) * wAmp * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += speed;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [assistantState]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  /** Starts or stops the Web Speech API recognition session. */
  const toggleRecording = () => {
    if (assistantState === 'listening') {
      recognitionRef.current?.stop();
    } else {
      // Stop any playing audio before starting mic to avoid feedback loops.
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      recognitionRef.current?.start();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  const handleSpeechToggle = () => {
    const nextVal = !speechEnabled;
    setSpeechEnabled(nextVal);
    if (!nextVal) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
      setAssistantState((prev) => (prev === 'speaking' ? 'idle' : prev));
    }
  };

  const isRecognitionSupported = !!recognitionRef.current;

  return (
    <div 
      className={styles.overlay} 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Policy Live Assistant"
    >
      <div 
        className={`${styles.modal} ${closing ? styles.modalClosing : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <span className={styles.glowingDot}></span>
            <h2 className={styles.title}>Policy Live Assistant</h2>
          </div>
          <div className={styles.headerControls}>
            <button 
              onClick={handleSpeechToggle} 
              className={styles.speechToggle}
              title={speechEnabled ? t.muteTitle : t.unmuteTitle}
              aria-label={speechEnabled ? t.muteTitle : t.unmuteTitle}
            >
              {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} color="var(--text-dark)" />}
              <span>{speechEnabled ? t.speechOn : t.speechOff}</span>
            </button>
            <button onClick={handleClose} className={styles.closeBtn} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className={styles.chatArea} role="log" aria-live="polite">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${
                msg.sender === 'user' ? styles.userMessage : styles.systemMessage
              }`}
            >
              {msg.sender === 'user' ? (
                msg.text
              ) : (
                <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
              )}
            </div>
          ))}
          {assistantState === 'processing' && (
            <div className={styles.loadingBubble}>
              <Cpu className="animate-spin" size={14} />
              <span>{t.processing}</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Audio Wave Visualizer */}
        <div className={styles.visualizerWrapper}>
          <canvas ref={canvasRef} className={styles.visualizerCanvas} />
          <div className={styles.statusOverlay}>
            {assistantState === 'idle' && t.idle}
            {assistantState === 'listening' && t.listening}
            {assistantState === 'processing' && t.processingStatus}
            {assistantState === 'speaking' && t.speaking}
          </div>
        </div>

        {/* User Input Bar */}
        <div className={styles.inputArea}>
          {isRecognitionSupported && (
            <button 
              onClick={toggleRecording} 
              className={`${styles.voiceBtn} ${assistantState === 'listening' ? styles.voiceBtnActive : ''}`}
              title={t.micTitle}
              aria-label={t.micTitle}
              disabled={assistantState === 'processing'}
            >
              <Mic size={20} />
            </button>
          )}

          <input 
            type="text" 
            placeholder={t.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={assistantState === 'processing'}
            className={styles.textInput}
            aria-label={t.placeholder}
          />

          <button 
            onClick={() => handleSendMessage()}
            className={styles.sendBtn}
            disabled={assistantState === 'processing' || !input.trim()}
            aria-label="Send"
          >
            <Send size={18} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
}
