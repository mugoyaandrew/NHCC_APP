import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { parseVoiceCommand } from '../../lib/ai-engine';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function VoiceNavigator({ onOpenAdvisor }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toggleDarkMode, darkMode } = useSettings();

  // Use refs for callbacks to avoid stale closures
  const navigateRef = useRef(navigate);
  const logoutRef = useRef(logout);
  const toggleDarkModeRef = useRef(toggleDarkMode);
  const darkModeRef = useRef(darkMode);
  const onOpenAdvisorRef = useRef(onOpenAdvisor);

  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { logoutRef.current = logout; }, [logout]);
  useEffect(() => { toggleDarkModeRef.current = toggleDarkMode; }, [toggleDarkMode]);
  useEffect(() => { darkModeRef.current = darkMode; }, [darkMode]);
  useEffect(() => { onOpenAdvisorRef.current = onOpenAdvisor; }, [onOpenAdvisor]);

  const speak = (text) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const clean = text.replace(/[*_#]/g, '').replace(/\n/g, '. ').substring(0, 200);
        const utterance = new SpeechSynthesisUtterance(clean);
        utterance.rate = 1.05;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  const executeCommand = (cmd, spokenText) => {
    setResult(cmd);
    setShowResult(true);
    setTranscript(spokenText);

    switch (cmd.action) {
      case 'navigate':
        speak(cmd.response);
        setTimeout(() => navigateRef.current(cmd.target), 500);
        break;
      case 'toggle_dark':
        if (!darkModeRef.current) toggleDarkModeRef.current();
        speak('Switching to dark mode');
        break;
      case 'toggle_light':
        if (darkModeRef.current) toggleDarkModeRef.current();
        speak('Switching to light mode');
        break;
      case 'logout':
        speak('Logging out. Goodbye!');
        setTimeout(() => logoutRef.current(), 1000);
        break;
      case 'open_advisor':
        speak('Opening AI advisor');
        if (onOpenAdvisorRef.current) onOpenAdvisorRef.current();
        break;
      case 'add_expense':
        speak(cmd.response);
        navigateRef.current('/finara/expenses');
        break;
      case 'query_balance':
      case 'query_spending':
        speak('Let me show you that');
        navigateRef.current('/finara/dashboard');
        break;
      case 'unknown':
        speak(cmd.response);
        break;
      default:
        if (cmd.response) speak(cmd.response);
    }

    setTimeout(() => setShowResult(false), 5000);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t;
          } else {
            interimTranscript += t;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          console.log('🎤 Final transcript:', finalTranscript);
          const cmd = parseVoiceCommand(finalTranscript);
          executeCommand(cmd, finalTranscript);
        }
      };

      recognition.onend = () => {
        console.log('🎤 Voice recognition ended');
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);

        switch (event.error) {
          case 'not-allowed':
            setError('Microphone blocked. Click the 🔒 icon in your browser address bar → Allow microphone.');
            break;
          case 'no-speech':
            setError("Didn't hear anything. Click the mic and try again.");
            break;
          case 'audio-capture':
            setError('No microphone found. Check your mic connection.');
            break;
          case 'network':
            setError('Network error. Speech recognition needs an internet connection in Chrome.');
            break;
          default:
            setError(`Voice error: ${event.error}. Try again.`);
        }

        setResult({ response: error, action: 'error' });
        setShowResult(true);
        setTimeout(() => setShowResult(false), 6000);
      };

      recognitionRef.current = recognition;
      console.log('✅ Speech Recognition initialized');
    } catch (e) {
      console.error('Failed to initialize Speech Recognition:', e);
      setSupported(false);
    }
  }, []); // intentionally empty — uses refs for callbacks

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Voice commands not available in this browser. Try Chrome or Edge.');
      setShowResult(true);
      setResult({ response: 'Voice commands not available in this browser. Try Chrome or Edge.', action: 'error' });
      setTimeout(() => setShowResult(false), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResult(null);
      setShowResult(false);
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
        // might be already started, try abort and restart
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsListening(true);
          }, 100);
        } catch (e2) {
          setError('Could not start voice recognition. Try refreshing the page.');
        }
      }
    }
  };

  // Even if not "supported", show a button that explains it
  return (
    <>
      {/* Floating Mic Button */}
      <motion.button
        onClick={toggleListening}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/40'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/30'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? 'Stop listening' : 'Voice commands (click to speak)'}
      >
        {isListening ? (
          <div className="relative">
            <MicOff className="w-6 h-6 text-white" />
            <div className="absolute -inset-3 rounded-full border-2 border-red-300 animate-ping opacity-30" />
          </div>
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Listening Overlay */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Listening...</p>
                <p className="text-xs text-slate-400">Say a command</p>
              </div>
              <button onClick={toggleListening} className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Waveform */}
            <div className="flex items-center justify-center gap-[3px] h-8 mb-2">
              {[...Array(16)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] bg-gradient-to-t from-blue-500 to-indigo-400 rounded-full"
                  animate={{ height: [8, 12 + Math.random() * 20, 8] }}
                  transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </div>

            {transcript && (
              <p className="text-sm text-slate-600 dark:text-slate-300 italic mt-1">"{transcript}"</p>
            )}

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Try: <span className="text-blue-500">"Go to projects"</span> · <span className="text-blue-500">"Switch to Finara"</span> · <span className="text-blue-500">"Dark mode"</span> · <span className="text-blue-500">"Open advisor"</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Toast */}
      <AnimatePresence>
        {showResult && result && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                result.action === 'unknown' || result.action === 'error' ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                {result.action === 'unknown' || result.action === 'error' ? '❓' : <Volume2 className="w-4 h-4 text-green-600" />}
              </div>
              <div className="flex-1 min-w-0">
                {transcript && <p className="text-sm font-medium text-slate-800 dark:text-white truncate">"{transcript}"</p>}
                <p className="text-xs text-slate-500 mt-1">{result.response}</p>
              </div>
              <button onClick={() => setShowResult(false)} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && !showResult && !isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-50 w-80 bg-red-50 dark:bg-red-900/30 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">🎤</span>
              <div className="flex-1">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="p-0.5">
                <X className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
