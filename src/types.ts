export type Language = 'ar' | 'en' | 'tr';

export interface Reciter {
  id: number;
  name: string;
  server: string;
  surahs: string;
  letter: string;
}

export interface Surah {
  id: number;
  name: string;
  englishName: string;
  arabicName: string;
  revelationType: string;
  numberOfAyahs: number;
  juz: number;
}

export interface AudioState {
  isPlaying: boolean;
  isRadio: boolean;
  isRepeating: boolean;
  currentSurah: Surah | null;
  currentReciter: Reciter | null;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export interface Translation {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  recitersCount: string;
  availableSurahs: string;
  settings: string;
  language: string;
  mode: string;
  night: string;
  version: string;
  charity: string;
  madeBy: string;
  readAndMemorize: string;
  cairoRadio: string;
  meccan: string;
  medinan: string;
  ayahs: string;
  wakeLock: string;
  wakeLockActive: string;
  close: string;
  selectReciter: string;
  welcome: string;
  welcomeDesc: string;
  home: string;
  stop: string;
  repeat: string;
  playbackSpeed: string;
  juz: string;
  copyLink: string;
  linkCopied: string;
}
