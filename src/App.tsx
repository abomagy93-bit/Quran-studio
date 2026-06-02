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
  ChevronUp,
  Heart,
  Settings,
  X,
  Lock,
  Globe,
  Info,
  RotateCcw,
  Gauge,
  Copy,
  Check,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Reciter, Surah, AudioState, Language } from './types';
import { SURAHS, EXTERNAL_LINKS, TRANSLATIONS } from './constants';
import { RadioSchedule } from './components/RadioSchedule';

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
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('language');
      return (saved === 'en' || saved === 'tr') ? saved : 'ar';
    } catch {
      return 'ar';
    }
  });
  const t = TRANSLATIONS[language];
  
  const [reciters, setReciters] = useState<Reciter[]>(() => {
    try {
      const savedLang = localStorage.getItem('language') || 'ar';
      const cacheKey = `reciters_${savedLang}_v8`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      if (cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 86400000) {
        return JSON.parse(cachedData);
      }
    } catch {}
    return [];
  });
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
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const savedLang = localStorage.getItem('language') || 'ar';
      const cacheKey = `reciters_${savedLang}_v8`;
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      return !(cachedData && cacheTime && Date.now() - parseInt(cacheTime) < 86400000);
    } catch {}
    return true;
  });
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
  const [showFacebookOverlay, setShowFacebookOverlay] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isFacebook = ua.indexOf("FBAN") > -1 || ua.indexOf("FBIOS") > -1 || ua.indexOf("Messenger") > -1;
    const isAndroid = /android/i.test(ua);

    if (isFacebook) {
      if (isAndroid) {
        const cleanUrl = window.location.href.replace(/^https?:\/\//, '');
        window.location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      } else {
        setShowFacebookOverlay(true);
      }
    }
  }, []);

  const [isRadioScheduleVisible, setIsRadioScheduleVisible] = useState(false);

  const [resumeState, setResumeState] = useState<{
    surah: Surah | null;
    reciter: Reciter | null;
    isRadio: boolean;
    time: number;
  } | null>(() => {
    try {
      const savedSurah = localStorage.getItem('persist_audio_surah');
      const savedReciter = localStorage.getItem('persist_audio_reciter');
      const savedIsRadio = localStorage.getItem('persist_audio_is_radio');
      const savedTime = localStorage.getItem('persist_audio_time');

      if (savedIsRadio === 'true' || (savedSurah && savedReciter)) {
        return {
          surah: savedSurah && savedSurah !== 'null' ? JSON.parse(savedSurah) : null,
          reciter: savedReciter && savedReciter !== 'null' ? JSON.parse(savedReciter) : null,
          isRadio: savedIsRadio === 'true',
          time: savedTime ? parseFloat(savedTime) : 0
        };
      }
    } catch (e) {
      console.error('Failed to parse persistent state', e);
    }
    return null;
  });

  // Reset scroll position to top when entering or leaving a reciter page / mushaf view
  useEffect(() => {
    // Instant scroll to the top of the window
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    // Reset internal scrolling containers to top as well
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTop = 0;
    });
  }, [selectedReciter]);


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

  // Web Audio API hook variables for optional 2x Volume Boost
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [isVolumeBoosted, setIsVolumeBoosted] = useState(false);

  const initWebAudio = React.useCallback(() => {
    if (!audioRef.current) return;
    if (audioContextRef.current) return; // Already initialized

    try {
      // Configure crossOrigin immediately to allow routing audio nodes through gain filters
      audioRef.current.crossOrigin = 'anonymous';

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const gainNode = ctx.createGain();
      gainNode.gain.value = isVolumeBoosted ? 2.0 : 1.0;
      gainNodeRef.current = gainNode;

      if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audioRef.current);
      }
      
      sourceNodeRef.current.connect(gainNode);
      gainNode.connect(ctx.destination);
    } catch (e) {
      console.error('Failed to initialize Web Audio API volume boost node:', e);
    }
  }, [isVolumeBoosted]);

  const toggleVolumeBoost = React.useCallback(() => {
    const nextBoost = !isVolumeBoosted;
    setIsVolumeBoosted(nextBoost);
    
    if (nextBoost) {
      if (!audioContextRef.current) {
        initWebAudio();
      } else {
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.setValueAtTime(2.0, audioContextRef.current.currentTime);
        }
      }
    } else {
      if (gainNodeRef.current) {
        const currentTime = audioContextRef.current ? audioContextRef.current.currentTime : 0;
        gainNodeRef.current.gain.setValueAtTime(1.0, currentTime);
      }
    }
  }, [isVolumeBoosted, initWebAudio]);

  // Sync volume boost gain node when toggled
  useEffect(() => {
    if (gainNodeRef.current) {
      const currentTime = audioContextRef.current ? audioContextRef.current.currentTime : 0;
      gainNodeRef.current.gain.setValueAtTime(isVolumeBoosted ? 2.0 : 1.0, currentTime);
    }
  }, [isVolumeBoosted]);

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
      const cacheKey = `reciters_${language}_v8`;
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
          'محمد صديق المنشاوي',
          'عبدالباسط عبدالصمد',
          'محمود خليل الحصري',
          'محمود علي البنا',
          'مصطفى إسماعيل',
          'محمد رفعت',
          'محمد محمود الطبلاوي',
          'ناصر القطامي',
          'أحمد بن طالب حميد',
          'محمد اللحيدان',
          'محمد جبريل',
          'محمد أيوب',
          'عبدالله الموسى',
          'أحمد نعينع',
          'مشاري العفاسي',
          'أحمد العجمي',
          'توفيق الصايغ',
          'توفيق الطائف',
          'سعد الغامدي',
          'ماهر المعيقلي'
        ];

        const normalizeArabic = (str: string) => {
          return str
            .replace(/[أإآا]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/[\u064B-\u065F\u0670-\u0678]/g, '');
        };

        const getPriorityReciterId = (name: string, recitersList: any[]) => {
          const normQuery = normalizeArabic(name);
          let found = recitersList.find((r: any) => normalizeArabic(r.name).includes(normQuery));
          if (found) return found.id;

          // Custom fallbacks for specific names
          if (name.includes('أحمد بن طالب حميد')) {
            found = recitersList.find((r: any) => {
              const n = normalizeArabic(r.name);
              return (n.includes('احمد بن طالب') && n.includes('حميد')) || (n.includes('احمد طالب') && n.includes('حميد')) || n.includes('احمد بن طالب');
            });
          } else if (name.includes('عبدالله الموسى')) {
            found = recitersList.find((r: any) => {
              const n = normalizeArabic(r.name);
              return n.includes('عبد الله الموسي') || n.includes('عبدالله الموسي') || n.includes('الموسي');
            });
          } else if (name.includes('الطبلاوي')) {
            found = recitersList.find((r: any) => normalizeArabic(r.name).includes('طبلاوي'));
          } else if (name.includes('الحذيفي')) {
            found = recitersList.find((r: any) => normalizeArabic(r.name).includes('علي عبدالرحمن الحذيفي') || normalizeArabic(r.name).includes('الحذيفي') && !normalizeArabic(r.name).includes('احمد'));
          } else if (name.includes('جبريل')) {
            found = recitersList.find((r: any) => normalizeArabic(r.name).includes('جبريل'));
          } else if (name.includes('أيوب')) {
            found = recitersList.find((r: any) => normalizeArabic(r.name).includes('ايوب'));
          } else if (name.includes('اللحيدان')) {
            found = recitersList.find((r: any) => normalizeArabic(r.name).includes('لحيدان'));
          } else if (name.includes('القطامي')) {
            found = recitersList.find((r: any) => normalizeArabic(r.name).includes('قطامي'));
          }
          return found?.id;
        };

        const priorityIds = priorityArabicNames.map(name => 
          getPriorityReciterId(name, arData.reciters)
        ).filter(id => id !== undefined);

        const huthaifiId = getPriorityReciterId('علي الحذيفي', arData.reciters);
        const index = priorityIds.indexOf(huthaifiId);
        if (index > -1) {
          priorityIds.splice(index, 1);
        }

        // Prepend Sheikh Rashad Darwish virtual ID (90004), then Ali Al-Huthaifi to the absolute top of the list!
        if (huthaifiId) {
          priorityIds.unshift(90004, huthaifiId);
        } else {
          priorityIds.unshift(90004);
        }

        // Explicitly add requested key reciters to top priority
        [54, 44, 115, 120, 117].forEach(id => {
          if (!priorityIds.includes(id)) priorityIds.push(id);
        });

        let displayReciters = arData.reciters;

        if (language !== 'ar') {
          const langResponse = await fetch(`https://mp3quran.net/api/v3/reciters?language=${language === 'tr' ? 'tr' : 'en'}`);
          const langData = await langResponse.json();
          displayReciters = langData.reciters;
        }

        const getMoshafByType = (r: any, type: 'tajweed' | 'murattal') => {
          if (!r.moshaf || r.moshaf.length === 0) return null;
          if (type === 'tajweed') {
            return r.moshaf.find((m: any) => 
              m.name.includes('تجويد') || 
              m.name.includes('مجود') ||
              m.name.toLowerCase().includes('tajweed') ||
              m.name.toLowerCase().includes('mujawwad') ||
              m.moshaf_type === 2 ||
              m.id === 2
            ) || null;
          } else {
            // First check if there is a studio recording (تسجيل استوديو)
            const studio = r.moshaf.find((m: any) =>
              m.name.includes('استوديو') ||
              m.name.toLowerCase().includes('studio')
            );
            if (studio) return studio;

            const murattal = r.moshaf.find((m: any) => 
              m.name.includes('مرتل') || 
              m.name.toLowerCase().includes('murattal') || 
              m.name.toLowerCase().includes('murottal') ||
              m.moshaf_type === 1
            );
            if (murattal) return murattal;
            
            // Fallback to any non-tajweed moshaf
            const nonTajweed = r.moshaf.find((m: any) => 
              !(m.name.includes('تجويد') || m.name.includes('مجود') || m.name.toLowerCase().includes('tajweed') || m.name.toLowerCase().includes('mujawwad') || m.moshaf_type === 2)
            );
            return nonTajweed || r.moshaf[0];
          }
        };

        const allReciters: Reciter[] = [];
        
        displayReciters.forEach((r: any) => {
          if (r.name.includes('أحمد الحذيفي') || r.name.toLowerCase().includes('ahmad al-huthaifi') || r.name.toLowerCase().includes('ahmed al-huthaifi')) {
            return;
          }

          const isMinshawi = r.id === 54 || r.name.includes('المنشاوي') || r.name.toLowerCase().includes('minshawi');
          const isAbdulBasit = r.id === 44 || r.name.includes('عبدالباسط') || r.name.includes('عبد الباسط') || r.name.toLowerCase().includes('abdul') || r.name.toLowerCase().includes('abdel');
          const isHusary = r.id === 115 || r.name.includes('الحصري') || r.name.toLowerCase().includes('husary') || r.name.toLowerCase().includes('hosary');
          const isMustafaIsmail = r.id === 120 || r.name.includes('مصطفى إسماعيل') || r.name.includes('مصطفي') || r.name.toLowerCase().includes('mustafa') || r.name.toLowerCase().includes('moustafa');
          const isBanna = r.id === 117 || r.name.includes('البنا') || r.name.toLowerCase().includes('banna');

          const isQatami = r.id === 37 || r.name.includes('القطامي') || r.name.toLowerCase().includes('qatami');
          const isHameed = r.id === 138 || r.name.includes('طالب حميد') || r.name.includes('حميد') || r.name.toLowerCase().includes('talib') || r.name.toLowerCase().includes('hameed');
          const isLuhaidan = r.id === 7 || r.name.includes('اللحيدان') || r.name.toLowerCase().includes('luhaidan') || r.name.toLowerCase().includes('lohaidan');
          const isHuthaifi = r.id === 114 || r.name.includes('الحذيفي') || r.name.toLowerCase().includes('hudhaify') || r.name.toLowerCase().includes('huthaifi');
          const isTablawi = r.id === 52 || r.name.includes('الطبلاوي') || r.name.toLowerCase().includes('tablawi') || r.name.toLowerCase().includes('tablaway');
          const isJibreel = r.id === 50 || r.name.includes('جبريل') || r.name.toLowerCase().includes('jibreel') || r.name.toLowerCase().includes('jebril');
          const isAyoub = r.id === 118 || r.name.includes('أيوب') || r.name.includes('ايوب') || r.name.toLowerCase().includes('ayyoub') || r.name.toLowerCase().includes('ayoub');
          const isMousa = r.id === 145 || r.name.includes('الموسى') || r.name.toLowerCase().includes('mousa');

          const isDualReciter = isMinshawi || isAbdulBasit || isHusary || isMustafaIsmail || isBanna ||
                                isQatami || isHameed || isLuhaidan || isHuthaifi || isTablawi || isJibreel || isAyoub || isMousa;

          if (isDualReciter) {
            const tajweedM = getMoshafByType(r, 'tajweed');
            const murattalM = getMoshafByType(r, 'murattal');

            if (tajweedM && murattalM) {
              if (isMinshawi || isAbdulBasit) {
                // Base ID plays Mujawwad, Virtual ID (+100000) plays Murattal
                allReciters.push({
                  id: r.id,
                  name: r.name + (language === 'ar' ? ' (مجود)' : ' (Mujawwad)'),
                  server: tajweedM.server,
                  surahs: tajweedM.surah_list,
                  letter: r.letter
                });
                allReciters.push({
                  id: r.id + 100000,
                  name: r.name + (language === 'ar' ? ' (مرتل)' : ' (Murattal)'),
                  server: murattalM.server,
                  surahs: murattalM.surah_list,
                  letter: r.letter
                });
              } else {
                // Base ID plays Murattal, Virtual ID (+100000) plays Mujawwad
                allReciters.push({
                  id: r.id,
                  name: r.name + (language === 'ar' ? ' (مرتل)' : ' (Murattal)'),
                  server: murattalM.server,
                  surahs: murattalM.surah_list,
                  letter: r.letter
                });
                allReciters.push({
                  id: r.id + 100000,
                  name: r.name + (language === 'ar' ? ' (مجود)' : ' (Mujawwad)'),
                  server: tajweedM.server,
                  surahs: tajweedM.surah_list,
                  letter: r.letter
                });
              }
            } else {
              const singleM = murattalM || tajweedM || r.moshaf[0];
              if (singleM) {
                const isTaj = singleM === tajweedM;
                allReciters.push({
                  id: r.id,
                  name: r.name + (isTaj ? (language === 'ar' ? ' (مجود)' : ' (Mujawwad)') : (language === 'ar' ? ' (مرتل)' : ' (Murattal)')),
                  server: singleM.server,
                  surahs: singleM.surah_list,
                  letter: r.letter
                });
              }
            }
          } else {
            const selectedMoshaf = r.moshaf[0];
            const isTajweed = selectedMoshaf?.name.includes('تجويد') || 
                             selectedMoshaf?.name.includes('مجود') || 
                             selectedMoshaf?.name.toLowerCase().includes('tajweed');

            allReciters.push({
              id: r.id,
              name: r.name + (isTajweed ? (language === 'ar' ? ' (مجود)' : ' (Mujawwad)') : ''),
              server: selectedMoshaf?.server || '',
              surahs: selectedMoshaf?.surah_list || '',
              letter: r.letter
            });
          }
        });

        // Inject Custom Classical Egyptian Reciters manually after api results
        allReciters.push({
          id: 90004,
          name: language === 'ar' ? 'الشيخ رشاد درويش (مرتل)' : 'Sheikh Rashad Darwish (Murattal)',
          server: 'https://archive.org/download/rashad-darwish/',
          surahs: Array.from({length: 114}, (_, i) => i + 1).join(','),
          letter: 'ر'
        });

        const sorted = [...allReciters].sort((a, b) => {
          const aBaseId = a.id >= 100000 ? a.id - 100000 : a.id;
          const bBaseId = b.id >= 100000 ? b.id - 100000 : b.id;
          const aPriority = priorityIds.indexOf(aBaseId);
          const bPriority = priorityIds.indexOf(bBaseId);
          
          if (aPriority !== -1 && bPriority !== -1) {
            if (aPriority === bPriority) {
              // Same reciter: place Murattal (مرتل) first, then Mujawwad
              const aIsMurattal = a.name.includes('مرتل') || a.name.includes('Murattal');
              const bIsMurattal = b.name.includes('مرتل') || b.name.includes('Murattal');
              if (aIsMurattal && !bIsMurattal) return -1;
              if (!aIsMurattal && bIsMurattal) return 1;
              return a.id - b.id;
            }
            return aPriority - bPriority;
          }
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
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } else {
      if (isVolumeBoosted) {
        if (!audioContextRef.current) {
          initWebAudio();
        } else if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      }
      audioRef.current.play();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    }
    setAudioState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [audioState.isPlaying, isVolumeBoosted, initWebAudio]);

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
    setSelectedReciter(null);
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'none';
    }
    // Clear persist state
    localStorage.removeItem('persist_audio_surah');
    localStorage.removeItem('persist_audio_reciter');
    localStorage.removeItem('persist_audio_is_radio');
    localStorage.removeItem('persist_audio_time');
    setResumeState(null);
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
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      localStorage.removeItem('persist_audio_surah');
      localStorage.removeItem('persist_audio_reciter');
      localStorage.removeItem('persist_audio_is_radio');
      localStorage.removeItem('persist_audio_time');
      return;
    }

    if (isVolumeBoosted) {
      if (!audioContextRef.current) {
        initWebAudio();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
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
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
    setSelectedSurah(null);
    setSelectedReciter(null);

    // Persist radio state
    localStorage.setItem('persist_audio_surah', 'null');
    localStorage.setItem('persist_audio_reciter', 'null');
    localStorage.setItem('persist_audio_is_radio', 'true');
    localStorage.setItem('persist_audio_time', '0');
    setResumeState(null);
  }, [audioState.isRadio, isVolumeBoosted, initWebAudio]);

  const playSurah = React.useCallback((surah: Surah, reciter: Reciter) => {
    if (!audioRef.current) return;
    
    if (isVolumeBoosted) {
      if (!audioContextRef.current) {
        initWebAudio();
      } else if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    }

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
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }

    // Persist surah state
    localStorage.setItem('persist_audio_surah', JSON.stringify(surah));
    localStorage.setItem('persist_audio_reciter', JSON.stringify(reciter));
    localStorage.setItem('persist_audio_is_radio', 'false');
    localStorage.setItem('persist_audio_time', '0');
    setResumeState(null);
  }, [isWakeLockActive, toggleWakeLock, isVolumeBoosted, initWebAudio]);

  const resumePlayback = React.useCallback(() => {
    if (!resumeState) return;
    const { surah, reciter, isRadio, time } = resumeState;
    if (isRadio) {
      playRadio();
    } else if (surah && reciter) {
      setSelectedReciter(reciter);
      setSelectedSurah(surah);
      
      if (audioRef.current) {
        if (isVolumeBoosted) {
          if (!audioContextRef.current) {
            initWebAudio();
          } else if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
          }
        }

        const surahId = surah.id.toString().padStart(3, '0');
        const url = `${reciter.server}${surahId}.mp3`;
        audioRef.current.src = url;
        audioRef.current.currentTime = time;
        audioRef.current.play().then(() => {
          setAudioState(prev => ({
            ...prev,
            isPlaying: true,
            isRadio: false,
            currentSurah: surah,
            currentReciter: reciter,
            currentTime: time
          }));
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        }).catch(err => {
          console.error("Autoplay from saved state blocked by browser", err);
          setAudioState(prev => ({
            ...prev,
            isPlaying: false,
            isRadio: false,
            currentSurah: surah,
            currentReciter: reciter,
            currentTime: time
          }));
        });
      }
    }
    setResumeState(null);
  }, [resumeState, playRadio, isVolumeBoosted, initWebAudio]);


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

  const copyWebsiteUrl = React.useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setIsUrlCopied(true);
      setTimeout(() => setIsUrlCopied(false), 2000);
    });
  }, []);

  // Handle Audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.volume = audioState.volume;
      audioRef.current.playbackRate = audioState.playbackRate;
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setAudioState(prev => {
        const next = { ...prev, currentTime: audio.currentTime };
        if (audio.currentTime > 0) {
          localStorage.setItem('persist_audio_time', audio.currentTime.toString());
        }
        return next;
      });
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

    const handleError = () => {
      if (selectedSurah && selectedReciter && selectedReciter.id >= 90000) {
        setPlaybackError(language === 'ar' 
          ? "تنبيه: عذراً، التسجيل الكامل والواضح لهذه السورة من نوادر التلاوات غير متاح حالياً لهذه المدرسة." 
          : "Notice: Apologies, the full studio recording of this Surah is currently unavailable for this classical reciter."
        );
        setTimeout(() => setPlaybackError(null), 6000);
      }
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [playNextSurah, audioState.volume, selectedSurah, selectedReciter, language]);

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
                <div className="relative h-48 sm:h-64 rounded-[3rem] overflow-hidden group bg-gradient-to-br from-[#0c0d12] via-[#1a1c24] to-[#08090d] border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center p-6 shadow-gold-primary/5">
                  {/* Glowing Ambient Spotlights */}
                  <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-gold-primary/10 blur-[80px] rounded-full group-hover:bg-gold-primary/15 transition-all duration-1000 pointer-events-none" />
                  <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-cyan-primary/10 blur-[80px] rounded-full group-hover:bg-cyan-primary/15 transition-all duration-1000 pointer-events-none" />
                  
                  {/* Subtle Elegant Islamic Star Pattern Overlay in CSS */}
                  <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
                  <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(45deg,#d4af37_1px,transparent_1px),linear-gradient(-45deg,#d4af37_1px,transparent_1px)] [background-size:48px_48px] pointer-events-none" />
                  
                  {/* Golden Border Arc */}
                  <div className="absolute inset-4 rounded-[2.5rem] border border-gold-primary/5 group-hover:border-gold-primary/10 transition-colors pointer-events-none" />

                  {/* Banner Title */}
                  <motion.h2 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl sm:text-5xl font-black text-gold-primary tracking-tighter mb-2 drop-shadow-2xl relative z-10"
                  >
                    {t.title}
                  </motion.h2>
                  <p className="text-sm sm:text-lg text-white/60 font-medium tracking-widest uppercase relative z-10 mb-1">{t.subtitle}</p>
                </div>

                {/* Quick Utilities: Cairo Radio & Resume Playback */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cairo Radio Quick Play Card */}
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={playRadio}
                    className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${
                      audioState.isRadio
                        ? 'bg-cyan-primary/15 border-cyan-primary text-cyan-primary shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                        : 'bg-white/5 border-white/10 hover:border-gold-primary/50 text-white shadow-xl hover:shadow-gold-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${
                        audioState.isRadio 
                          ? 'bg-cyan-primary text-black animate-pulse' 
                          : 'bg-gold-primary/10 text-gold-primary'
                      }`}>
                        <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="text-right">
                        <p className={`font-black tracking-tight text-sm sm:text-base ${audioState.isRadio ? 'text-cyan-primary' : 'text-gold-primary'}`}>
                          {t.cairoRadio}
                        </p>
                        <p className="text-[10px] sm:text-xs text-white/40 font-bold">{language === 'ar' ? 'البث المباشر المعتمد' : 'Live stream broadcast'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        audioState.isRadio 
                          ? 'bg-cyan-primary/20 text-cyan-primary' 
                          : 'bg-white/5 text-white/50'
                      }`}>
                        {audioState.isRadio && audioState.isPlaying ? (language === 'ar' ? 'متصل الآن' : 'Live') : (language === 'ar' ? 'تشغيل من القاهرة' : 'Play Radio')}
                      </span>
                    </div>
                  </motion.button>

                  {/* Resume Listening Card */}
                  {resumeState ? (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resumePlayback}
                      className="flex items-center justify-between p-4 rounded-3xl border bg-gold-primary/10 border-gold-primary/40 hover:border-gold-primary text-gold-primary shadow-xl shadow-gold-primary/5 transition-all text-right"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gold-primary text-black">
                          <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                        </div>
                        <div className="text-right">
                          <p className="font-black tracking-tight text-sm sm:text-base text-gold-primary">
                            {language === 'ar' ? 'استئناف الاستماع السابق' : 'Resume Playback'}
                          </p>
                          <p className="text-[10px] sm:text-xs text-white/65 font-bold truncate max-w-[180px] sm:max-w-xs">
                            {resumeState.isRadio 
                              ? (language === 'ar' ? 'إذاعة القاهرة' : 'Cairo Radio')
                              : `${resumeState.reciter ? resumeState.reciter.name : ''} • ${resumeState.surah ? (language === 'ar' ? 'سورة ' + resumeState.surah.name : resumeState.surah.englishName) : ''}`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gold-primary/25 text-gold-primary uppercase tracking-wider">
                        {formatTime(resumeState.time)}
                      </span>
                    </motion.button>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-3xl border border-white/5 bg-white/[0.01] text-white/20 select-none">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white/5 text-white/10">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm tracking-tight">
                            {language === 'ar' ? 'محفوظات الاستماع' : 'Audio History'}
                          </p>
                          <p className="text-[10px] font-bold">{language === 'ar' ? 'لا يوجد استماع معلق' : 'No suspended session'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live program segments from Egypt Quran Radio (Collapsible) */}
                <div className="w-full max-w-4xl mx-auto">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIsRadioScheduleVisible(!isRadioScheduleVisible)}
                    className="w-full flex items-center justify-between p-5 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all relative overflow-hidden group select-none"
                  >
                    {/* Glowing golden border effect on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-cyan-primary/0 via-gold-primary/30 to-cyan-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                    
                    <div className="flex items-center gap-4 text-right">
                      <div className="p-3 rounded-2xl bg-gold-primary/10 text-gold-primary group-hover:bg-gold-primary/20 transition-all">
                        <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm sm:text-base text-gold-primary tracking-tight">
                          {language === 'ar' ? 'خريطة برامج وتواقيت إذاعة القرآن الكريم المباشرة' : 'Live Cairo Quran Radio Program Schedule & Timing'}
                        </p>
                        <p className="text-[10px] sm:text-xs text-white/50 font-medium mt-0.5">
                          {language === 'ar' 
                            ? (isRadioScheduleVisible ? 'اضغط هنا لطي الخريطة بالكامل وتوفير المساحة' : 'تضمّن تلاوات السحر، أحاديث الأزهر والتفاسير النادرة. اضغط للعرض والمتابعة الفورية للبرامج الآن')
                            : (isRadioScheduleVisible ? 'Click to collapse the complete schedule' : 'Highlights dawn recitations, Al-Azhar podcasts, and rare Tafseer. Click to expand')
                          }
                        </p>
                      </div>
                    </div>

                    <div className="p-2 bg-white/5 rounded-xl text-white/40 group-hover:text-gold-primary transition-all shrink-0">
                      {isRadioScheduleVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </motion.button>
                  
                  <AnimatePresence>
                    {isRadioScheduleVisible && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <RadioSchedule language={language} />
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        <button 
                          onClick={toggleVolumeBoost}
                          className={`flex items-center gap-0.5 transition-all ${isVolumeBoosted ? 'text-gold-primary filter drop-shadow-[0_0_8px_rgba(255,215,0,0.6)] scale-110 font-bold' : 'text-white/40 hover:text-white'}`}
                          title={language === 'ar' ? 'مضاعفة حجم الصوت (200%)' : 'Volume Boost (200%)'}
                        >
                          <Zap className={`w-5 h-5 ${isVolumeBoosted ? 'fill-gold-primary' : ''}`} />
                          <span className="text-[10px] font-black w-8">{isVolumeBoosted ? '200%' : '100%'}</span>
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

      {/* Facebook In-App Browser Escape Overlay */}
      <AnimatePresence>
        {showFacebookOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl text-white select-none"
            dir="rtl"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-[20%] left-[20%] w-[50%] h-[50%] bg-gold-primary/10 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[20%] right-[20%] w-[50%] h-[50%] bg-cyan-primary/10 blur-[100px] rounded-full pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative max-w-md w-full bg-gradient-to-b from-[#16171d] to-[#0c0d12] border border-white/10 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-2xl overflow-hidden"
            >
              {/* Star pattern */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Glowing Icon */}
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gold-primary/10 flex items-center justify-center text-gold-primary mb-6 border border-gold-primary/25 shadow-[0_0_20px_rgba(212,175,55,0.15)] animate-pulse">
                <Globe className="w-8 h-8" />
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-black text-gold-primary tracking-tight mb-3">
                اسرع تصفح وسماع بدون انقطاع!
              </h3>
              
              <p className="text-sm sm:text-base text-white/70 font-medium leading-relaxed mb-6">
                أنت تستخدم متصفح فيسبوك الداخلي، لتجربة تشغيل فائقة السرعة ولتجنب توقف التلاوة عند إغلاق الشاشة، يرجى تشغيل الموقع في التطبيق الافتراضي لهاتفك (سافاري أو كروم).
              </p>

              {/* Steps */}
              <div className="space-y-4 text-right mb-8">
                <div className="flex gap-4 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gold-primary text-black font-black text-xs shrink-0">١</span>
                  <p className="text-xs sm:text-sm text-white/80 font-bold leading-normal">
                    انقر على زر القائمة <span className="text-gold-primary font-black">•••</span> (النقاط الثلاث) في الزاوية العليا أو السفلى للشاشة.
                  </p>
                </div>
                <div className="flex gap-4 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gold-primary text-black font-black text-xs shrink-0">٢</span>
                  <p className="text-xs sm:text-sm text-white/80 font-bold leading-normal">
                    اختر <span className="text-gold-primary font-black">"فتح في المتصفح الخارجي"</span> أو <span className="text-gold-primary font-black">"Open in Safari"</span>.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={copyWebsiteUrl}
                  className={`flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-black transition-all text-sm ${
                    isUrlCopied 
                      ? 'bg-cyan-primary/20 text-cyan-primary border border-cyan-primary animate-pulse' 
                      : 'bg-gold-primary text-black hover:bg-gold-primary/95 border border-gold-primary/20 shadow-lg shadow-gold-primary/10'
                  }`}
                >
                  {isUrlCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {isUrlCopied ? 'تم نسخ الرابط المباشر' : 'نسخ رابط الموقع ومتابعته يدوياً'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowFacebookOverlay(false)}
                  className="py-3 px-6 rounded-2xl font-bold text-white/40 hover:text-white/80 transition-all text-xs border border-white/5 hover:bg-white/5"
                >
                  المتابعة على فيسبوك مؤقتاً
                </motion.button>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-white/30 font-black">
                صدقة جارية لأمي وجميع موتى المسلمين
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {playbackError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)] bg-zinc-950/95 border border-gold-primary/30 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-start gap-4 backdrop-blur-md"
          >
            <div className="p-2 bg-gold-primary/10 rounded-xl text-gold-primary shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white/95 leading-relaxed text-right">
                {playbackError}
              </p>
            </div>
            <button 
              onClick={() => setPlaybackError(null)}
              className="text-white/40 hover:text-white/80 transition-all p-1 self-start shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
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
