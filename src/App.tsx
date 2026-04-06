/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Search, 
  Radio, 
  BookOpen, 
  ListMusic,
  User,
  Music,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Heart,
  Settings,
  X,
  Lock,
  Globe,
  Info,
  RotateCcw,
  Gauge,
  Copy,
  Check
} from 'lucide-react';
import { Reciter, Surah, AudioState, Language } from './types';
import { SURAHS, EXTERNAL_LINKS, TRANSLATIONS } from './constants';

// Memoized Components for Performance
const ReciterCard = React.memo(({ 
  reciter, 
  onClick, 
  language 
}: { 
  reciter: Reciter, 
  onClick: () => void, 
  language: Language 
}) => (
  <button
    onClick={onClick}
    className="group relative flex items-center gap-4 sm:gap-5 p-4 sm:p-6 bg-white/5 border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] hover:bg-white/10 hover:border-gold-primary/30 transition-all text-right w-full will-change-transform"
  >
    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-gold-primary/10 flex items-center justify-center text-xl sm:text-2xl font-black text-gold-primary group-hover:bg-gold-primary group-hover:text-black transition-all">
      {reciter.name[0]}
    </div>
    <div className="flex-1 min-w-0 py-1">
      <p className="font-bold text-base sm:text-lg md:text-xl leading-tight group-hover:text-gold-primary transition-colors break-words">{reciter.name}</p>
      <p className="text-[10px] sm:text-xs text-white/30 uppercase tracking-widest font-bold mt-1">{reciter.letter}</p>
    </div>
    <ChevronLeft className={`w-5 h-5 shrink-0 text-white/20 group-hover:text-gold-primary transition-all ${language === 'ar' ? '' : 'rotate-180'}`} />
  </button>
));

const SurahCard = React.memo(({ 
  surah, 
  isSelected, 
  onClick, 
  language,
  t
}: { 
  surah: Surah, 
  isSelected: boolean, 
  onClick: () => void, 
  language: Language,
  t: any
}) => (
  <button
    onClick={onClick}
    className={`group relative flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] border transition-all w-full will-change-transform ${
      isSelected
        ? 'bg-gold-primary/10 border-gold-primary text-gold-primary'
        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
    }`}
  >
    <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
      isSelected
        ? 'bg-gold-primary text-black'
        : 'bg-white/10 group-hover:bg-gold-primary group-hover:text-black'
    }`}>
      {surah.id}
    </div>
    <div className="text-right flex-1 min-w-0 py-1">
      <p className="font-bold text-base sm:text-lg md:text-xl leading-tight break-words">{language === 'ar' ? surah.name : surah.englishName}</p>
      <p className="text-[10px] sm:text-xs opacity-40 font-bold uppercase tracking-widest mt-1">
        {surah.revelationType === 'Meccan' ? t.meccan : t.medinan} • {surah.numberOfAyahs} {t.ayahs}
      </p>
    </div>
  </button>
));

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const t = TRANSLATIONS[language];
  
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [surahSearchQuery, setSurahSearchQuery] = useState('');
  
  const filteredReciters = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return reciters;
    return reciters.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.letter.toLowerCase().includes(query)
    );
  }, [reciters, searchQuery]);

  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);
  const wakeLockRef = useRef<any>(null);
  
  const availableSurahs = useMemo(() => {
    if (!selectedReciter) return [];
    const surahIds = selectedReciter.surahs.split(',').map(id => parseInt(id));
    const baseSurahs = SURAHS.filter(s => surahIds.includes(s.id));
    
    const query = surahSearchQuery.toLowerCase().trim();
    if (!query) return baseSurahs;
    
    return baseSurahs.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.englishName.toLowerCase().includes(query) ||
      s.id.toString() === query
    );
  }, [selectedReciter, surahSearchQuery]);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isRadio: false,
    currentSurah: null,
    currentReciter: null,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isRepeating: false,
    playbackRate: 1,
  });

  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    const updateVisitorCount = async () => {
      try {
        // Using a public simple counter API (Real & Persistent)
        const response = await fetch('https://api.counterapi.dev/v1/ahlelquran_official/visits/up');
        const data = await response.json();
        if (data && data.count) {
          setVisitorCount(data.count);
        }
      } catch (error) {
        console.error('Visitor counter error:', error);
        // Fallback to local storage if API is unavailable
        const saved = localStorage.getItem('visitor_count_fallback');
        const count = saved ? parseInt(saved) + 1 : 15420;
        setVisitorCount(count);
        localStorage.setItem('visitor_count_fallback', count.toString());
      }
    };

    updateVisitorCount();
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Wake Lock Logic
  const toggleWakeLock = React.useCallback(async () => {
    if ('wakeLock' in navigator) {
      if (isWakeLockActive) {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
          setIsWakeLockActive(false);
        }
      } else {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
          setIsWakeLockActive(true);
          wakeLockRef.current.addEventListener('release', () => {
            setIsWakeLockActive(false);
          });
        } catch (err: any) {
          // Silence permission errors as they are expected in some iframe environments
          if (err.name !== 'NotAllowedError') {
            console.error(`${err.name}, ${err.message}`);
          }
        }
      }
    }
  }, [isWakeLockActive]);

  // Fetch reciters
  useEffect(() => {
    const fetchReciters = async () => {
      const cacheKey = `reciters_${language}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      
      // Cache for 24 hours
      if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
        setReciters(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Always fetch Arabic to get the priority IDs and stable order
        const arResponse = await fetch('https://mp3quran.net/api/v3/reciters?language=ar');
        const arData = await arResponse.json();
        
        const priorityArabicNames = [
          'علي الحذيفي',
          'محمد صديق المنشاوي',
          'عبدالباسط عبدالصمد',
          'محمود خليل الحصري',
          'محمود علي البنا',
          'مصطفى إسماعيل',
          'محمد رفعت',
          'رشاد درويش',
          'محمد محمود الطبلاوي',
          'كامل يوسف البهتيمي',
          'أحمد نعينع',
          'مشاري العفاسي',
          'أحمد العجمي',
          'توفيق الصايغ',
          'توفيق الطائف',
          'أحمد بن حميد',
          'سعد الغامدي',
          'ماهر المعيقلي'
        ];

        const priorityIds = priorityArabicNames.map(name => 
          arData.reciters.find((r: any) => r.name.includes(name))?.id
        ).filter(id => id !== undefined);

        // Explicitly add Minshawi (54) and Abdul Basit (44) to priority if not found
        if (!priorityIds.includes(54)) priorityIds.push(54);
        if (!priorityIds.includes(44)) priorityIds.push(44);

        let displayReciters = arData.reciters;

        if (language !== 'ar') {
          const langResponse = await fetch(`https://mp3quran.net/api/v3/reciters?language=${language === 'tr' ? 'tr' : 'en'}`);
          const langData = await langResponse.json();
          displayReciters = langData.reciters;
        }

        const allReciters: Reciter[] = displayReciters.map((r: any) => {
          // Default to the first moshaf
          let selectedMoshaf = r.moshaf[0];

          // Special case for El-Minshawi: Force Tajweed version
          // Minshawi's ID is 54 in MP3Quran API
          if (r.id === 54 || r.name.includes('المنشاوي') || r.name.includes('Minshawi')) {
            const tajweed = r.moshaf.find((m: any) => 
              m.name.includes('تجويد') || 
              m.name.includes('مجود') ||
              m.name.toLowerCase().includes('tajweed') ||
              m.moshaf_type === 2 || // Some versions use moshaf_type
              m.id === 2 // Common ID for Tajweed
            );
            if (tajweed) selectedMoshaf = tajweed;
          }

          // Also for Abdul Basit (ID 44)
          if (r.id === 44 || r.name.includes('عبدالباسط') || r.name.includes('Abdul Basit')) {
            const tajweed = r.moshaf.find((m: any) => 
              m.name.includes('تجويد') || 
              m.name.includes('مجود') ||
              m.name.toLowerCase().includes('tajweed') ||
              m.moshaf_type === 2 ||
              m.id === 2
            );
            if (tajweed) selectedMoshaf = tajweed;
          }

          const isTajweed = selectedMoshaf?.name.includes('تجويد') || 
                           selectedMoshaf?.name.includes('مجود') || 
                           selectedMoshaf?.name.toLowerCase().includes('tajweed');

          return {
            id: r.id,
            name: r.name + (isTajweed ? (language === 'ar' ? ' (تجويد)' : ' (Tajweed)') : ''),
            server: selectedMoshaf?.server || '',
            surahs: selectedMoshaf?.surah_list || '',
            letter: r.letter
          };
        });

        const sorted = [...allReciters].sort((a, b) => {
          const aPriority = priorityIds.indexOf(a.id);
          const bPriority = priorityIds.indexOf(b.id);
          
          if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
          if (aPriority !== -1) return -1;
          if (bPriority !== -1) return 1;
          return a.name.localeCompare(b.name, language === 'ar' ? 'ar' : 'en');
        });

        setReciters(sorted);
        localStorage.setItem(cacheKey, JSON.stringify(sorted));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching reciters:', error);
        setIsLoading(false);
      }
    };

    fetchReciters();
  }, [language]);

  const handleReciterClick = React.useCallback((reciter: Reciter) => {
    setSelectedReciter(reciter);
  }, []);

  // Update selected reciter when reciters list changes (e.g. language change)
  useEffect(() => {
    if (selectedReciter) {
      const updated = reciters.find(r => r.id === selectedReciter.id);
      if (updated) setSelectedReciter(updated);
    }
  }, [reciters]);

  // Handle Audio
  const togglePlay = React.useCallback(() => {
    if (!audioRef.current) return;
    
    if (audioState.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [audioState.isPlaying]);

  const stopPlayback = React.useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = '';
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isRadio: false,
      currentSurah: null, 
      currentReciter: null,
      currentTime: 0,
      duration: 0,
      isRepeating: false
    }));
    if (audioRef.current) audioRef.current.loop = false;
    setSelectedSurah(null);
  }, []);

  const toggleRepeat = React.useCallback(() => {
    if (!audioRef.current) return;
    const newState = !audioState.isRepeating;
    audioRef.current.loop = newState;
    setAudioState(prev => ({ ...prev, isRepeating: newState }));
  }, [audioState.isRepeating]);

  const togglePlaybackRate = React.useCallback(() => {
    if (!audioRef.current) return;
    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(audioState.playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setAudioState(prev => ({ ...prev, playbackRate: nextRate }));
  }, [audioState.playbackRate]);

  const playRadio = React.useCallback(() => {
    if (!audioRef.current) return;
    
    if (audioState.isRadio) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isRadio: false 
      }));
      return;
    }

    audioRef.current.src = EXTERNAL_LINKS.QURAN_RADIO;
    audioRef.current.play();
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      isRadio: true,
      currentSurah: null, 
      currentReciter: null 
    }));
    setSelectedSurah(null);
    setSelectedReciter(null);
  }, [audioState.isRadio]);

  const playSurah = React.useCallback((surah: Surah, reciter: Reciter) => {
    if (!audioRef.current) return;
    
    const surahId = surah.id.toString().padStart(3, '0');
    const url = `${reciter.server}${surahId}.mp3`;
    
    audioRef.current.src = url;
    audioRef.current.play();
    
    // Auto-request wake lock when playing
    if (!isWakeLockActive) toggleWakeLock();

    setSelectedSurah(surah);
    setSelectedReciter(reciter);
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: true, 
      isRadio: false,
      currentSurah: surah, 
      currentReciter: reciter 
    }));
  }, [isWakeLockActive, toggleWakeLock]);

  const playNextSurah = React.useCallback(() => {
    if (!selectedSurah || !selectedReciter || availableSurahs.length === 0) return;
    const currentIndex = availableSurahs.findIndex(s => s.id === selectedSurah.id);
    const nextSurah = availableSurahs[(currentIndex + 1) % availableSurahs.length];
    playSurah(nextSurah, selectedReciter);
  }, [selectedSurah, selectedReciter, availableSurahs, playSurah]);

  const playPrevSurah = React.useCallback(() => {
    if (!selectedSurah || !selectedReciter || availableSurahs.length === 0) return;
    const currentIndex = availableSurahs.findIndex(s => s.id === selectedSurah.id);
    const prevSurah = availableSurahs[(currentIndex - 1 + availableSurahs.length) % availableSurahs.length];
    playSurah(prevSurah, selectedReciter);
  }, [selectedSurah, selectedReciter, availableSurahs, playSurah]);

  const handleSurahClick = React.useCallback((surah: Surah) => {
    if (selectedReciter) playSurah(surah, selectedReciter);
  }, [selectedReciter, playSurah]);

  const copyRecitationLink = React.useCallback(() => {
    if (!selectedSurah || !selectedReciter) return;
    const surahId = selectedSurah.id.toString().padStart(3, '0');
    const url = `${selectedReciter.server}${surahId}.mp3`;
    
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [selectedSurah, selectedReciter]);

  // Handle Audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = audioState.volume;
      audioRef.current.playbackRate = audioState.playbackRate;
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setAudioState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      if (audioRef.current?.loop) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      } else {
        playNextSurah();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [playNextSurah, audioState.volume]);

  // Media Session API for background playback
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (audioState.isRadio) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.cairoRadio,
          artist: 'إذاعة القرآن الكريم',
          album: 'بث مباشر',
          artwork: [
            { src: 'https://picsum.photos/seed/radio/512/512', sizes: '512x512', type: 'image/png' }
          ]
        });
      } else if (selectedSurah && selectedReciter) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${language === 'ar' ? 'سورة' : 'Surah'} ${language === 'ar' ? selectedSurah.name : selectedSurah.englishName}`,
          artist: selectedReciter.name,
          album: t.title,
          artwork: [
            { src: 'https://picsum.photos/seed/quran/512/512', sizes: '512x512', type: 'image/png' }
          ]
        });
      }

      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => !audioState.isRadio && playPrevSurah());
      navigator.mediaSession.setActionHandler('nexttrack', () => !audioState.isRadio && playNextSurah());
    }
  }, [selectedSurah, selectedReciter, audioState.isRadio, language, t.cairoRadio, t.title, togglePlay, playPrevSurah, playNextSurah]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setAudioState(prev => ({ ...prev, currentTime: time }));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const vol = parseFloat(e.target.value);
    audioRef.current.volume = vol;
    setAudioState(prev => ({ ...prev, volume: vol }));
    if (vol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = audioState.volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-black text-white selection:bg-cyan-primary/30 ${language === 'ar' ? 'rtl' : 'ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-cyan-primary/5 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-gold-primary/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gold-primary rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-gold-primary/20">
              <Music className="text-black w-5 h-5 sm:w-8 sm:h-8" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gold-primary leading-tight">{t.title}</h1>
              <p className="text-[10px] sm:text-xs text-cyan-primary uppercase tracking-widest font-bold">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
              <button 
                onClick={() => setLanguage(l => l === 'ar' ? 'en' : 'ar')}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-gold-primary flex items-center gap-2"
                title={t.language}
              >
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{language === 'ar' ? 'EN' : 'عربي'}</span>
              </button>
              <button 
                onClick={toggleWakeLock}
                className={`p-1.5 sm:p-2 rounded-full transition-all ${isWakeLockActive ? 'text-gold-primary' : 'text-white/40 hover:text-white'}`}
                title={t.wakeLock}
              >
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3">
              <a 
                href={EXTERNAL_LINKS.QURAN_READ} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-primary/10 hover:bg-cyan-primary/20 rounded-full transition-all text-[10px] sm:text-xs font-black border border-cyan-primary/20 text-cyan-primary"
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{t.readAndMemorize}</span>
              </a>
              <button 
                onClick={playRadio}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all text-[10px] sm:text-xs font-black shadow-lg ${audioState.isRadio ? 'bg-cyan-primary text-black shadow-cyan-primary/20' : 'bg-gold-primary text-black shadow-gold-primary/20 hover:scale-105'}`}
              >
                <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{t.cairoRadio}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 pb-24">
        <div className="w-full space-y-12">
          
          <AnimatePresence mode="wait">
            {!selectedReciter ? (
              <motion.div
                key="reciters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-12"
              >
                {/* Hero Banner */}
                <div className="relative h-48 sm:h-64 rounded-[3rem] overflow-hidden group">
                  <img 
                    src="https://picsum.photos/seed/quran-banner/1200/400" 
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[5s]"
                    alt="Banner"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                    <motion.h2 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-3xl sm:text-5xl font-black text-gold-primary tracking-tighter mb-2 drop-shadow-2xl"
                    >
                      {t.title}
                    </motion.h2>
                    <p className="text-sm sm:text-lg text-white/60 font-medium tracking-widest uppercase">{t.subtitle}</p>
                  </div>
                </div>

                {/* Search Section */}
                <div className="text-center space-y-3 sm:space-y-4">
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{t.selectReciter}</h2>
                  <div className="relative max-w-md mx-auto group">
                    <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors w-4 h-4`} />
                    <input 
                      type="text" 
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:outline-none focus:ring-2 focus:ring-gold-primary/20 focus:border-gold-primary/40 transition-all text-base placeholder:text-white/10`}
                    />
                  </div>
                </div>

                {/* Reciters Grid - Contained */}
                <div className="max-w-5xl mx-auto bg-white/5 rounded-[2.5rem] p-6 sm:p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {isLoading ? (
                        Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="h-24 bg-white/5 animate-pulse rounded-3xl" />
                        ))
                      ) : (
                        filteredReciters.map((reciter) => (
                          <ReciterCard
                            key={reciter.id}
                            reciter={reciter}
                            language={language}
                            onClick={() => handleReciterClick(reciter)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="surahs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gold-primary flex items-center justify-center text-3xl font-black text-black">
                      {selectedReciter.name[0]}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gold-primary">{selectedReciter.name}</h2>
                      <p className="text-cyan-primary font-bold flex items-center gap-2">
                        <ListMusic className="w-4 h-4" />
                        {availableSurahs.length} {t.availableSurahs}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedReciter(null)}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full transition-all text-sm font-bold border border-white/10"
                  >
                    <ChevronRight className={`w-4 h-4 ${language === 'ar' ? '' : 'rotate-180'}`} />
                    <span>{t.home}</span>
                  </button>
                </div>

                {/* Surah Search */}
                <div className="relative max-w-md mx-auto group">
                  <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold-primary transition-colors w-4 h-4`} />
                  <input 
                    type="text" 
                    placeholder={language === 'ar' ? 'بحث عن سورة...' : 'Search surah...'}
                    value={surahSearchQuery}
                    onChange={(e) => setSurahSearchQuery(e.target.value)}
                    className={`w-full bg-white/5 border border-white/10 rounded-xl py-3 sm:py-4 ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:outline-none focus:ring-2 focus:ring-gold-primary/20 focus:border-gold-primary/40 transition-all text-base placeholder:text-white/10`}
                  />
                </div>

                <div className="max-w-7xl mx-auto bg-white/5 rounded-[2.5rem] p-6 sm:p-8 border border-white/10 backdrop-blur-xl shadow-2xl">
                  <div className="max-h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {availableSurahs.map((surah) => (
                        <SurahCard
                          key={surah.id}
                          surah={surah}
                          language={language}
                          t={t}
                          isSelected={selectedSurah?.id === surah.id && selectedReciter?.id === audioState.currentReciter?.id}
                          onClick={() => handleSurahClick(surah)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Settings Modal */}

      {/* Footer Credits */}
      <footer className="max-w-7xl mx-auto px-4 pt-8 pb-16 text-center border-t border-white/5 space-y-6">
        <div className="flex items-center justify-center gap-4 text-white/20">
          <div className="h-px w-12 bg-current" />
          <Info className="w-5 h-5" />
          <div className="h-px w-12 bg-current" />
        </div>
        <p className="text-white/40 text-sm font-medium">{t.madeBy}</p>
        <div className="space-y-4">
          <p className="text-gold-primary text-3xl sm:text-5xl font-black tracking-tight drop-shadow-lg leading-tight">
            {t.charity}
          </p>
          <div className="inline-flex flex-col items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-primary font-bold">إجمالي الزوار</p>
            <p className="text-2xl font-mono font-black text-white tabular-nums">
              {visitorCount.toLocaleString()}
            </p>
          </div>
        </div>
      </footer>

      {/* Player Bar */}
      <AnimatePresence>
        {(selectedSurah || audioState.isRadio) && (
          <>
            {isPlayerMinimized ? (
              <motion.button
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                onClick={() => setIsPlayerMinimized(false)}
                className="fixed bottom-6 right-6 z-[70] w-16 h-16 bg-gold-primary text-black rounded-full shadow-2xl shadow-gold-primary/40 flex items-center justify-center hover:scale-110 transition-transform"
              >
                <div className="relative">
                  <Music className="w-6 h-6" />
                  {audioState.isPlaying && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-primary rounded-full animate-pulse border-2 border-black" />
                  )}
                </div>
              </motion.button>
            ) : (
              <motion.footer
                initial={{ y: 150 }}
                animate={{ y: 0 }}
                exit={{ y: 150 }}
                className="fixed bottom-0 left-0 right-0 z-[60] bg-black/95 backdrop-blur-3xl border-t border-white/10 px-4 py-6 sm:py-8 shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)]"
              >
                <div className="max-w-7xl mx-auto relative">
                  {/* Player Controls Toggle */}
                  <div className="absolute -top-12 left-0 right-0">
                    <button 
                      onClick={stopPlayback}
                      className="absolute left-4 sm:left-8 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-xl border border-red-500/20 p-2 rounded-t-xl transition-colors text-red-400 hover:text-red-300"
                      title="إغلاق"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsPlayerMinimized(true)}
                      className="absolute right-4 sm:right-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 p-2 rounded-t-xl transition-colors text-white/60 hover:text-white"
                      title="تصغير"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
                    
                    {/* Current Info */}
                    <div className="flex items-center gap-6">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] overflow-hidden shadow-2xl shadow-gold-primary/10 group bg-gradient-to-br from-gold-primary/20 to-cyan-primary/20">
                        <div className="absolute inset-0 flex items-center justify-center text-gold-primary/40 font-black text-2xl">
                          {audioState.isRadio ? '📻' : selectedReciter?.name[0]}
                        </div>
                        <div className="absolute inset-0 bg-gold-primary/10 mix-blend-overlay" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl sm:text-2xl break-words text-gold-primary leading-tight">
                          {audioState.isRadio ? t.cairoRadio : `${language === 'ar' ? 'سورة' : 'Surah'} ${language === 'ar' ? selectedSurah?.name : selectedSurah?.englishName}`}
                        </h3>
                        <p className="text-cyan-primary text-sm sm:text-base font-bold mt-1 break-words">
                          {audioState.isRadio ? 'إذاعة القرآن الكريم' : selectedReciter?.name}
                        </p>
                        {!audioState.isRadio && selectedSurah && (
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                            {selectedSurah.revelationType === 'Meccan' ? t.meccan : t.medinan} • {selectedSurah.numberOfAyahs} {t.ayahs} • {t.juz} {selectedSurah.juz}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-6 sm:gap-10">
                        <button 
                          onClick={toggleRepeat}
                          disabled={audioState.isRadio}
                          className={`transition-all ${audioState.isRadio ? 'opacity-10 text-white/10' : audioState.isRepeating ? 'text-gold-primary' : 'text-white/40 hover:text-white'}`}
                          title={t.repeat}
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={playPrevSurah} 
                          disabled={audioState.isRadio}
                          className={`transition-all ${audioState.isRadio ? 'opacity-10 text-white/10' : 'text-white/40 hover:text-gold-primary hover:scale-110'}`}
                        >
                          <SkipForward className={`w-7 h-7 ${language === 'ar' ? '' : 'rotate-180'}`} />
                        </button>
                        <button 
                          onClick={togglePlay}
                          className="w-16 h-16 sm:w-20 sm:h-20 bg-gold-primary text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-2xl shadow-gold-primary/30"
                        >
                          {audioState.isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                        </button>
                        <button 
                          onClick={playNextSurah} 
                          disabled={audioState.isRadio}
                          className={`transition-all ${audioState.isRadio ? 'opacity-10 text-white/10' : 'text-white/40 hover:text-gold-primary hover:scale-110'}`}
                        >
                          <SkipBack className={`w-7 h-7 ${language === 'ar' ? '' : 'rotate-180'}`} />
                        </button>
                        <button 
                          onClick={togglePlaybackRate}
                          disabled={audioState.isRadio}
                          className={`flex items-center gap-1 transition-all ${audioState.isRadio ? 'opacity-10 text-white/10' : audioState.playbackRate !== 1 ? 'text-gold-primary' : 'text-white/40 hover:text-white'}`}
                          title={t.playbackSpeed}
                        >
                          <Gauge className="w-5 h-5" />
                          <span className="text-[10px] font-black w-6">{audioState.playbackRate}x</span>
                        </button>
                      </div>
                      
                      {!audioState.isRadio && (
                        <div className="w-full flex items-center gap-4">
                          <span className="text-[10px] font-black text-white/20 w-12 text-left">{formatTime(audioState.currentTime)}</span>
                          <div className="relative flex-1 h-2 group">
                            <input 
                              type="range" 
                              min="0" 
                              max={audioState.duration || 0} 
                              value={audioState.currentTime}
                              onChange={handleSeek}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="absolute inset-0 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gold-primary transition-all duration-100 shadow-[0_0_15px_rgba(255,215,0,0.5)]" 
                                style={{ width: `${(audioState.currentTime / (audioState.duration || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-white/20 w-12 text-right">{formatTime(audioState.duration)}</span>
                        </div>
                      )}
                    </div>

                    {/* Volume & Actions */}
                    <div className="hidden md:flex items-center justify-end gap-6">
                      <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                        <button onClick={toggleMute} className="text-white/40 hover:text-gold-primary transition-colors">
                          {isMuted || audioState.volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input 
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : audioState.volume}
                          onChange={handleVolumeChange}
                          className="w-24 h-1 appearance-none bg-white/10 rounded-full cursor-pointer accent-gold-primary"
                        />
                      </div>
                      <button 
                        onClick={copyRecitationLink}
                        className={`p-3 rounded-2xl transition-all border ${isCopied ? 'bg-cyan-primary/20 border-cyan-primary text-cyan-primary' : 'bg-white/5 border-white/5 text-white/40 hover:text-gold-primary hover:bg-white/10'}`}
                        title={t.copyLink}
                      >
                        {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="w-full text-center mt-4 pt-4 border-t border-white/5">
                    <p className="text-[10px] sm:text-xs text-gold-primary/60 font-black tracking-widest animate-pulse">
                      صدقة جارية لأمي وجميع موتى المسلمين
                    </p>
                  </div>
                </div>
              </motion.footer>
            )}
          </>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
