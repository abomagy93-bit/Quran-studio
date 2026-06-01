import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Radio, Sun, Moon, Coffee, Sparkles, BookOpen, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Language } from '../types';

interface ProgramSlot {
  id: string;
  nameAr: string;
  nameEn: string;
  startHour: number; // 24h format
  startMinute: number;
  endHour: number;
  endMinute: number;
  presenterAr: string;
  presenterEn: string;
  descriptionAr: string;
  descriptionEn: string;
  iconType: 'morning' | 'night' | 'dawn' | 'quran' | 'spark' | 'general';
}

const PROGRAM_SLOTS: ProgramSlot[] = [
  {
    id: '1',
    nameAr: 'القرآن الكريم المرتل (تلاوات جوف الليل)',
    nameEn: 'Late Night Calm Recitations',
    startHour: 0,
    startMinute: 30,
    endHour: 2,
    endMinute: 0,
    presenterAr: 'كبار قراء المصحف الشريف',
    presenterEn: 'Master Reciters of Egypt',
    descriptionAr: 'باقة تلاوات خاشعة مرجحة للطمأنينة والهدوء من مصاحف عمالقة القراء في هدوء الليل.',
    descriptionEn: 'Serene in-depth recitations selected to bring peace and tranquility during the deep night.',
    iconType: 'night'
  },
  {
    id: '2',
    nameAr: 'برنامج قطوف من حدائق الإيمان (ومضات السحر)',
    nameEn: 'Gleanings of Faith Late-Night Show',
    startHour: 2,
    startMinute: 0,
    endHour: 3,
    endMinute: 0,
    presenterAr: 'رواد ومقدمي الإذاعة المصرية الأوفياء',
    presenterEn: 'Veteran Cairo Radio Hosts',
    descriptionAr: 'من روائع وبدائع الحكمة والمأثورات والأدعية والأحاديث العطرة المرفقة بالابتهالات.',
    descriptionEn: 'Selected wise quotes, prophetic traditional quotes, and peaceful night invocations.',
    iconType: 'spark'
  },
  {
    id: '3',
    nameAr: 'قرآن الفجر المبارك وإبتهالات السحر',
    nameEn: 'Dawn Holy Quran & Spiritual Invocations',
    startHour: 3,
    startMinute: 0,
    endHour: 4,
    endMinute: 30,
    presenterAr: 'الشيخ سيد النقشبندي ونصر الدين طوبار',
    presenterEn: 'Sheikh Sayyed Naqshbandi & Tobar',
    descriptionAr: 'أدعية وتواشيح وابتهالات فجرية نادرة مع تلاوة قرآن الفجر الطيب العذب.',
    descriptionEn: 'Rare dawn invocations, supplications, and the highly spiritual early dawn recitations.',
    iconType: 'dawn'
  },
  {
    id: '4',
    nameAr: 'أذان الفجر وأذكار الصباح وأدعية الاستيقاظ',
    nameEn: 'Dawn Adhan & Morning Athkar blessings',
    startHour: 4,
    startMinute: 30,
    endHour: 5,
    endMinute: 0,
    presenterAr: 'كبار مؤذني ومقرئي الإذاعة المباركة',
    presenterEn: 'Famous Quran Radio Cairo Muadhins',
    descriptionAr: 'المتابعة المباشرة لنداء الصلاة وأذكار الصباح الشرعية والتوكل على الله رب العالمين.',
    descriptionEn: 'Listening to the dawn call to prayer, followed by daily morning remembrance formulas.',
    iconType: 'dawn'
  },
  {
    id: '5',
    nameAr: 'برنامج حديث الصباح الطيب',
    nameEn: 'The Blessed Morning Discourse',
    startHour: 5,
    startMinute: 0,
    endHour: 5,
    endMinute: 45,
    presenterAr: 'نخبة من علماء الأزهر الشريف بمصر',
    presenterEn: 'Eminent Scholars from Al-Azhar University',
    descriptionAr: 'ومضات غالية من النور الإلهي والسير النبوية وأخلاق السلف لافتتاح يوم مبروك.',
    descriptionEn: 'Valuable pearls and guidance from prophetic teachings for a calm modern lifestyle.',
    iconType: 'morning'
  },
  {
    id: '6',
    nameAr: 'تلاوات الصباح المباركة (الشيخ الحصري)',
    nameEn: 'Morning Golden Recitations (Al-Husary)',
    startHour: 5,
    startMinute: 45,
    endHour: 7,
    endMinute: 0,
    presenterAr: 'فضيلة الشيخ محمود خليل الحصري',
    presenterEn: 'Sheikh Mahmoud Khalil Al-Husary',
    descriptionAr: 'ترتيل منضبط بدقة لا تضاهى يسري بالقلوب مع شيخ عموم المقارئ المصرية الأسبق.',
    descriptionEn: 'The absolute golden standard of traditional Quran formulation by Sheikh Al-Husary.',
    iconType: 'quran'
  },
  {
    id: '7',
    nameAr: 'برنامج في رحاب السنة النبوية والأخلاق',
    nameEn: 'In the Sanctuary of Holy Prophetic Sunnah',
    startHour: 7,
    startMinute: 0,
    endHour: 7,
    endMinute: 30,
    presenterAr: 'لجنة البحوث الإسلامية بمصر',
    presenterEn: 'Islamic Research Academy, Egypt',
    descriptionAr: 'مذاكرة مبسطة للأحاديث النبوية الصحيحة وأخلاق سيد الأوس والخزرج والناس أجمعين.',
    descriptionEn: 'Authentic prophetic narrations made accessible with moral context and daily applications.',
    iconType: 'general'
  },
  {
    id: '8',
    nameAr: 'مدرسة ترتيل القرآن الكريم وتفسيره',
    nameEn: 'School of Holy Quran Recitation & Tafseer',
    startHour: 7,
    startMinute: 30,
    endHour: 8,
    endMinute: 30,
    presenterAr: 'الشيخ مصطفى إسماعيل ومحمد محمد المدني',
    presenterEn: 'Sheikh Mustafa Ismail & Dr. Al-Madani',
    descriptionAr: 'حلقات تفصيلية لشرح مخارج الحروف وقواعد التجويد ودلالات التفسير البياني الميسر.',
    descriptionEn: 'Detailed instructional episodes addressing proper articulation, pronunciation and word choices.',
    iconType: 'quran'
  },
  {
    id: '9',
    nameAr: 'برنامج القاموس الإسلامي اللغوي',
    nameEn: 'The Islamic Linguistics Dictionary',
    startHour: 8,
    startMinute: 30,
    endHour: 9,
    endMinute: 0,
    presenterAr: 'علماء اللغة والبيان بمجمع اللغة العربية بالقاهرة',
    presenterEn: 'Cairo Arabic Language Academy scholars',
    descriptionAr: 'توضيح لطيف وممتع لألفاظ ومصطلحات القرآن الكريم وأسرار اللغة العربية الفصحى.',
    descriptionEn: 'A delightful analysis exploring specific linguistic root meanings within Quranic syntax.',
    iconType: 'general'
  },
  {
    id: '10',
    nameAr: 'برنامج بريد الإسلام (الفترة الصباحية الأولى والمباشرة)',
    nameEn: 'Bareed El-Islam Morning Live Broadcast',
    startHour: 9,
    startMinute: 0,
    endHour: 9,
    endMinute: 30,
    presenterAr: 'لجنة الفتوى بالأزهر وكبار إذاعيي مصر',
    presenterEn: 'Dar Al-Ifta & Azhar Fatwa Committee',
    descriptionAr: 'البرنامج التاريخي الأشهر للتواصل والإجابة الدقيقة على تساؤلات المستمعين الدينية والفقهية.',
    descriptionEn: 'Cairo Quran Radio legendary program resolving listener questions under precise Islamic rules.',
    iconType: 'spark'
  },
  {
    id: '11',
    nameAr: 'الختمة المرتلة لعمالقة التلاوة المصرية',
    nameEn: 'Master Reciters Khatmah Compilation',
    startHour: 9,
    startMinute: 30,
    endHour: 11,
    endMinute: 30,
    presenterAr: 'الشيوخ المنشاوي وعبد الباسط والبهتيمي',
    presenterEn: 'Legends Minshawi, Abdul Basit & Bahtimi',
    descriptionAr: 'ساعتان كاملتان من الغذاء الروحي بتلاوات تفيض خشوعاً من روائع الإرث المصري الخالد.',
    descriptionEn: 'Two full hours of spiritual bliss highlighting classic mid-century Egyptian studio recordings.',
    iconType: 'quran'
  },
  {
    id: '12',
    nameAr: 'برنامج دقيقة فقهية مبسطة',
    nameEn: 'Fiqh Clinic Fast Questions & Answers',
    startHour: 11,
    startMinute: 30,
    endHour: 12,
    endMinute: 0,
    presenterAr: 'مفتيات وعلماء الإفتاء بمصر',
    presenterEn: 'Eminent Jurisprudence specialists',
    descriptionAr: 'أجوبة ميسرة وعقائدية حول العبادات والأخلاق والتعامل اليومي في دقائق سريعة التركيز.',
    descriptionEn: 'Fast-paced, accessible fatwas answering minor everyday issues with solid clarity.',
    iconType: 'general'
  },
  {
    id: '13',
    nameAr: 'تلاوات الظهر والابتهالات المرافقة للأذان',
    nameEn: 'Midday Prayer Calm Recitations',
    startHour: 12,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
    presenterAr: 'كبار المنشدين وقراء مصر الأوفياء',
    presenterEn: 'Legendary Cairo Mosque Chanters & Readers',
    descriptionAr: 'فترة تلاوات تسبق وتلي نداء صلاة الظهر لتهيئة النفوس للسكينة وراحة العبادة.',
    descriptionEn: 'A tranquil hour framing the midday prayer with ambient recitations and invocations.',
    iconType: 'morning'
  },
  {
    id: '14',
    nameAr: 'برنامج فقه المرأة والأسرة المسلمة',
    nameEn: 'Islamic Family & Women Jurisprudence',
    startHour: 13,
    startMinute: 0,
    endHour: 14,
    endMinute: 0,
    presenterAr: 'أستاذات العقيدة ونخبة من باحثات الشريعة',
    presenterEn: 'Eminent Female Sharia Scholars',
    descriptionAr: 'نقاشات عميقة حول التربية الصالحة والمسائل الحياتية المعاصرة التي تهم العائلات.',
    descriptionEn: 'Insightful guides regarding nurturing generations and modern family challenges and ethics.',
    iconType: 'general'
  },
  {
    id: '15',
    nameAr: 'صلاة العصر والمصحف المعلم المرتل',
    nameEn: 'Mid-Afternoon Tajweed Instructional Session',
    startHour: 14,
    startMinute: 0,
    endHour: 15,
    endMinute: 0,
    presenterAr: 'الشيخ خليل الحصري بترتيله التعليمي الخالد',
    presenterEn: 'Sheikh Al-Husary and Cairo Quran Students',
    descriptionAr: 'جلسات استماع تفصيلية لمتابعة تلاوة مخارج الحروف لضبط الحفظ والتدرب الصحيح.',
    descriptionEn: 'Listening to the legendary instructional repetitions of Sheikh Husary to refine reading skills.',
    iconType: 'quran'
  },
  {
    id: '16',
    nameAr: 'برنامج حديث الروح وتفسير الشعراوي المبارك',
    nameEn: 'The Spirit\'s Echo & Tafsir Sha\'rawi',
    startHour: 15,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    presenterAr: 'فضيلة الإمام الشيخ محمد متولي الشعراوي',
    presenterEn: 'Imama Sheikh Muhammad Metwally El-Sha\'rawi',
    descriptionAr: 'تفسير وتدبر عميق في آيات الكتاب العزيز بلغة فصيحة قريبة للقلوب والعقول تبسط أعقد المعاني.',
    descriptionEn: 'The world-famous profound and easy to follow lessons deciphering deep Quranic secrets.',
    iconType: 'spark'
  },
  {
    id: '17',
    nameAr: 'تلاوات شفق المغيب وترتيل قبيل أذان المغرب',
    nameEn: 'Golden Hour Sunset Warm Recitations',
    startHour: 16,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    presenterAr: 'الشيخ محمد رفعت والشيخ طه الفشني',
    presenterEn: 'Sheikh Muhammad Rifat & Sheikh Fashni',
    descriptionAr: 'تلاوات مغرب عذبة وبديعة تلامس الوجدان وتذكر بجمال الهدوء وصنع الخالق قبل الغياب.',
    descriptionEn: 'Incredibly moving sunset atmospheric recitations by historical founders of school of Cairo.',
    iconType: 'general'
  },
  {
    id: '18',
    nameAr: 'أذان المغرب وابتهالات الغسق الهادئة',
    nameEn: 'Sunset Call & Quiet Dusk Invocations',
    startHour: 17,
    startMinute: 0,
    endHour: 17,
    endMinute: 30,
    presenterAr: 'مبتهلو الهيئة العامة للإذاعة والتلفزيون',
    presenterEn: 'Official Egypt Radio Vocalists & Masters',
    descriptionAr: 'صلاة المغرب وأوراد الطمأنينة والأدعية المباركة المستحبة عند إقبال الليل المبارك.',
    descriptionEn: 'The sunset call, followed by specific dusk remembrance formulas and serene vocal invocations.',
    iconType: 'night'
  },
  {
    id: '19',
    nameAr: 'برنامج شمس الحضارة والعلوم الإسلامية العريقة',
    nameEn: 'The Radiant Sun of Islamic Civilization',
    startHour: 17,
    startMinute: 30,
    endHour: 18,
    endMinute: 5,
    presenterAr: 'لجنة المؤرخين والباحثين الإسلاميين بمصر',
    presenterEn: 'Islamic Historians and Researchers Commission',
    descriptionAr: 'بحث شيق ومسجل يسلط الأضواء على إسهامات المسلمين الرواد في العلوم الطبية والفلكية.',
    descriptionEn: 'An engaging chronicle reviewing golden contributions made by Islamic scholars in various fields.',
    iconType: 'general'
  },
  {
    id: '20',
    nameAr: 'برنامج بريد الإسلام (الفترة المسائية الثانية والمباشرة)',
    nameEn: 'Bareed El-Islam Evening Live Broadcast',
    startHour: 18,
    startMinute: 5,
    endHour: 18,
    endMinute: 30,
    presenterAr: 'علماء وأمناء الفتوى بدار الإفتاء المصرية',
    presenterEn: 'Senior Egypt Dar Al-Ifta Islamic Scholars',
    descriptionAr: 'النسخة المسائية اليومية من البرنامج الفتوائي الحواري الأشهر ومناقشة قضايا المجتمع.',
    descriptionEn: 'The evening live edition of Bareed El-Islam resolving complicated listener inquiries.',
    iconType: 'spark'
  },
  {
    id: '21',
    nameAr: 'تلاوات العشاء وتدبر كلام رب الأنام',
    nameEn: 'Night Reflection Quran & Deep Reading',
    startHour: 18,
    startMinute: 30,
    endHour: 20,
    endMinute: 0,
    presenterAr: 'نخبة من قراء مقارئ القاهرة المعتمدين',
    presenterEn: 'Approved Cairo Mosque Reciters',
    descriptionAr: 'باقة تلاوات حصرية لشباب القراء وشيوخ الرعيل الثاني في مزامنة تمهد النفس لسكينة الليل.',
    descriptionEn: 'Exclusive recordings from younger and modern generation reciters preparing for night sleep.',
    iconType: 'night'
  },
  {
    id: '22',
    nameAr: 'المصحف المجيد المعلم - المدرسة المصرية التراثية',
    nameEn: 'The Great Tajweed Masterclass - Egyptian Legacy',
    startHour: 20,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
    presenterAr: 'الشيخ عبد الباسط عبد الصمد ومصطفى إسماعيل',
    presenterEn: 'Legends Abdul Basit & Mustafa Ismail',
    descriptionAr: 'حفل التلاوة القرآني المجود المشترك الشهير لعمالقة دولة التلاوة المصرية العريقة.',
    descriptionEn: 'The absolute prime time daily legendary hour of high-art classical Tajweed audio recordings.',
    iconType: 'quran'
  },
  {
    id: '23',
    nameAr: 'برنامج موسوعة الفقه المعاصر والنوازل الحديثة',
    nameEn: 'Encyclopedia of Contemporary Islamic Fiqh',
    startHour: 21,
    startMinute: 0,
    endHour: 22,
    endMinute: 0,
    presenterAr: 'مجمع البحوث ولجنة التوعية الإسلامية بمصر',
    presenterEn: 'Modern Islamic Research Council scholars',
    descriptionAr: 'عرض متألق للحلول الشرعية والوسطية لأحدث المسائل المالية وشؤون التكنولوجيا والطب المعاصرة.',
    descriptionEn: 'Displaying moderate Islamic solutions and legal standpoints regarding modern digital issues.',
    iconType: 'general'
  },
  {
    id: '24',
    nameAr: 'حفل السماع والتلاوة الذهبي اليومي الخاشع',
    nameEn: 'Golden Hours of Cairo Quran Concerts',
    startHour: 22,
    startMinute: 0,
    endHour: 23,
    endMinute: 30,
    presenterAr: 'الشيخ ميثم التمار وشعبان الصياد وطه الفشني',
    presenterEn: 'Quran Master Singers and Reciters',
    descriptionAr: 'روائع التسجيلات الخارجية وحفلات المساجد المصرية الكبرى التي لا غنى للوجدان عنها.',
    descriptionEn: 'Rare external and live mosque recording assets highlighting absolute spiritual perfection.',
    iconType: 'quran'
  },
  {
    id: '25',
    nameAr: 'برنامج السهرة الشهير (قطوف من حدائق الإيمان)',
    nameEn: 'Gardens of Faith Legendary Serene Night Show',
    startHour: 23,
    startMinute: 30,
    endHour: 0,
    endMinute: 30,
    presenterAr: 'كبار رواد وإذاعيي ومقدمي الراديو الموقرين',
    presenterEn: 'Senior Quran Radio Cairo Hosts',
    descriptionAr: 'البرنامج الساهر الخالد العبق بالقصص النبوية والأحاديث الصحيحة والحكم النفيسة المنوعة.',
    descriptionEn: 'The historical late-night serene classic show with beautiful moral teachings and wisdoms.',
    iconType: 'night'
  }
];

export function RadioSchedule({ language }: { language: Language }) {
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [isSynced, setIsSynced] = useState<boolean>(false);
  const [cairoTime, setCairoTime] = useState({ 
    hours: 0, 
    minutes: 0, 
    seconds: 0, 
    formatted: '',
    dateFormatted: ''
  });
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  // Synchronize with authentic Cairo atomic time on mount
  useEffect(() => {
    let active = true;
    const fetchTrueTime = async () => {
      try {
        const response = await fetch('https://worldtimeapi.org/api/timezone/Africa/Cairo');
        if (!response.ok) throw new Error('Primary source down');
        const data = await response.json();
        if (data && typeof data.unixtime === 'number') {
          const trueMs = data.unixtime * 1000;
          const localMs = Date.now();
          const offset = trueMs - localMs;
          if (active) {
            setTimeOffset(offset);
            setIsSynced(true);
            console.log(`Cairo Accurate Sync completed (offset: ${offset}ms)`);
          }
        }
      } catch (err) {
        if (!active) return;
        console.warn('Primary sync source down, trying backup time server...', err);
        try {
          const response = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Africa/Cairo');
          if (response.ok) {
            const data = await response.json();
            if (data && data.dateTime) {
              const trueMs = new Date(data.dateTime).getTime();
              const localMs = Date.now();
              const offset = trueMs - localMs;
              if (active) {
                setTimeOffset(offset);
                setIsSynced(true);
                console.log(`Cairo Backup Sync completed (offset: ${offset}ms)`);
              }
            }
          }
        } catch (backupErr) {
          console.warn('All sync time servers are unavailable. Gracefully fallback to internal calendar clock.', backupErr);
        }
      }
    };

    fetchTrueTime();
    const interval = setInterval(fetchTrueTime, 180000); // Re-sync every 3 minutes
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Calculate current Cairo time dynamically using the high-accuracy offset
  useEffect(() => {
    const updateTime = () => {
      try {
        // Apply the safe network time offset to ensure device clock misalignment has zero effect
        const d = new Date(Date.now() + timeOffset);
        
        // Format to Africa/Cairo Time
        const options: Intl.DateTimeFormatOptions = {
          timeZone: 'Africa/Cairo',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(d);
        
        let hh = 0, mm = 0, ss = 0;
        parts.forEach(p => {
          if (p.type === 'hour') hh = parseInt(p.value);
          if (p.type === 'minute') mm = parseInt(p.value);
          if (p.type === 'second') ss = parseInt(p.value);
        });

        // Safe-guard hour string formatted quirks (handling "24" formatted midnight boundary)
        if (hh === 24) hh = 0;

        // Human readable time label (including seconds to show alive state)
        const displayOptions: Intl.DateTimeFormatOptions = {
          timeZone: 'Africa/Cairo',
          hour12: true,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit'
        };
        const displayFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', displayOptions);
        const formatted = displayFormatter.format(d);

        // Human readable date label for Cairo (Day, Date, Month, Year)
        const dateOptions: Intl.DateTimeFormatOptions = {
          timeZone: 'Africa/Cairo',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        };
        const dateDisplayFormatter = new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-US', dateOptions);
        const dateFormatted = dateDisplayFormatter.format(d);

        setCairoTime({ hours: hh, minutes: mm, seconds: ss, formatted, dateFormatted });
      } catch (err) {
        console.error('Error calculating Cairo timezone:', err);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [language, timeOffset]);

  // Check if a program slot is currently broadcasting
  const isSlotActive = (slot: ProgramSlot, currentHours: number, currentMinutes: number) => {
    const currentTotal = currentHours * 60 + currentMinutes;
    const startTotal = slot.startHour * 60 + slot.startMinute;
    let endTotal = slot.endHour * 60 + slot.endMinute;

    // Handle midnight overlap (e.g., 23:30 to 00:30)
    if (startTotal <= endTotal) {
      return currentTotal >= startTotal && currentTotal < endTotal;
    } else {
      // Overnight
      return currentTotal >= startTotal || currentTotal < endTotal;
    }
  };

  // Check if a program slot is already finished for today
  const isSlotFinished = (slot: ProgramSlot, currentHours: number, currentMinutes: number) => {
    // If it is currently active, it is definitely NOT finished
    if (isSlotActive(slot, currentHours, currentMinutes)) {
      return false;
    }
    
    const currentTotal = currentHours * 60 + currentMinutes;
    const startTotal = slot.startHour * 60 + slot.startMinute;

    // Inside a 24-hour calendar day, a repeating slot is considered finished 
    // if the day's time has progressed past or equal to its start time 
    // AND it is no longer active.
    return currentTotal >= startTotal;
  };

  // Filter program slots that have finished to only show remaining/upcoming programs
  const upcomingSlots = useMemo(() => {
    return PROGRAM_SLOTS.filter(slot => !isSlotFinished(slot, cairoTime.hours, cairoTime.minutes));
  }, [cairoTime.hours, cairoTime.minutes]);

  // Custom slider horizontal controller supporting RTL
  const scrollSlider = (direction: 'left' | 'right') => {
    const slider = document.getElementById('programs-slider');
    if (slider) {
      const isRTL = language === 'ar';
      let amount = 300;
      if (direction === 'left') {
        amount = isRTL ? 300 : -300;
      } else {
        amount = isRTL ? -300 : 300;
      }
      slider.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Get active and upcoming programs
  const activeProgram = useMemo(() => {
    return PROGRAM_SLOTS.find(slot => isSlotActive(slot, cairoTime.hours, cairoTime.minutes));
  }, [cairoTime.hours, cairoTime.minutes]);

  // Calculate active program completion percentage
  const progressPercent = useMemo(() => {
    if (!activeProgram) return 0;
    const currentTotal = cairoTime.hours * 60 + cairoTime.minutes;
    const startTotal = activeProgram.startHour * 60 + activeProgram.startMinute;
    let endTotal = activeProgram.endHour * 60 + activeProgram.endMinute;
    
    let totalMinutes = endTotal - startTotal;
    let elapsedMinutes = currentTotal - startTotal;

    if (startTotal > endTotal) {
      // Modulo 24 hours calculations
      totalMinutes = (endTotal + 1440) - startTotal;
      elapsedMinutes = currentTotal >= startTotal 
        ? currentTotal - startTotal 
        : (currentTotal + 1440) - startTotal;
    }

    if (totalMinutes <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalMinutes) * 100)));
  }, [activeProgram, cairoTime.hours, cairoTime.minutes]);

  // Get next program coming up
  const nextProgram = useMemo(() => {
    if (!activeProgram) return null;
    const activeIndex = PROGRAM_SLOTS.findIndex(s => s.id === activeProgram.id);
    if (activeIndex === -1) return null;
    return PROGRAM_SLOTS[(activeIndex + 1) % PROGRAM_SLOTS.length];
  }, [activeProgram]);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'morning':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'night':
        return <Moon className="w-5 h-5 text-indigo-400" />;
      case 'dawn':
        return <Coffee className="w-5 h-5 text-sky-400" />;
      case 'quran':
        return <BookOpen className="w-5 h-5 text-gold-primary" />;
      case 'spark':
        return <Sparkles className="w-5 h-5 text-teal-400" />;
      default:
        return <Radio className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getFormatTimeStr = (hour: number, minute: number) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = language === 'ar' 
      ? (hour >= 12 ? 'مساءً' : 'صباحاً') 
      : (hour >= 12 ? 'PM' : 'AM');
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto mt-6"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-[#0e1017]/85 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-primary/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-primary/5 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.015] bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Schedule Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-primary/10 flex items-center justify-center text-gold-primary">
              <Radio className="w-5 h-5" />
            </div>
            <div className="text-right">
              <h4 className="text-lg sm:text-xl font-black text-gold-primary tracking-tight">
                {language === 'ar' ? 'خريطة برامج إذاعة القرآن الكريم' : 'Quran Radio Program Schedule'}
              </h4>
              <p className="text-[10px] sm:text-xs text-cyan-primary/70 font-black">
                {language === 'ar' 
                  ? 'مزامنة حية تلقائية مبرمجة ومتجددة كل يوم على مدار الساعة' 
                  : 'Live automatic 24/7 synchronization updating itself on daily rollover'}
              </p>
            </div>
          </div>

          {/* Clock Ticker widget */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2.5 rounded-2xl shrink-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-primary/10 flex items-center justify-center text-cyan-primary shrink-0 animate-pulse">
              <Clock className="w-4 h-4 text-cyan-primary" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-start">
                <span className={`text-[10px] text-white/40 font-bold leading-none`}>
                  {language === 'ar' ? 'توقيت وتاريخ القاهرة الآن' : 'Cairo Live Time & Date'}
                </span>
                {isSynced && (
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90 select-none animate-pulse">
                    ● {language === 'ar' ? 'دقة متناهية (متزامن)' : 'Atomic Sync'}
                  </span>
                )}
              </div>
              <div className="text-xs sm:text-sm font-black text-cyan-primary mt-1 leading-none">
                {cairoTime.formatted || '...'}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-white/60 mt-1 leading-none">
                {cairoTime.dateFormatted || '...'}
              </div>
            </div>
          </div>
        </div>

        {/* Live Slot Highlight */}
        {activeProgram && (
          <div className="p-5 sm:p-6 bg-gradient-to-br from-cyan-primary/[0.03] to-gold-primary/[0.03] border border-cyan-primary/20 hover:border-cyan-primary/40 rounded-3xl relative overflow-hidden transition-all shadow-lg mb-6 group">
            {/* Live Indicator */}
            <div className="absolute top-4 left-4 sm:left-auto sm:right-4 flex items-center gap-2 bg-cyan-primary/10 border border-cyan-primary/30 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-cyan-primary animate-pulse shadow-[0_0_10px_#06b6d4]" />
              <span className="text-[10px] font-black uppercase text-cyan-primary tracking-wider">
                {language === 'ar' ? 'يبث الآن بمصر' : 'Broadcasting NOW'}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 text-right pt-4 sm:pt-0">
              <div className="w-12 h-12 rounded-2xl bg-cyan-primary/10 flex items-center justify-center shrink-0 border border-cyan-primary/20 shadow-cyan-primary/5">
                {renderIcon(activeProgram.iconType)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-cyan-primary bg-cyan-primary/10 border border-cyan-primary/20 px-2.5 py-1 rounded-lg tracking-wider mb-1.5">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  {getFormatTimeStr(activeProgram.startHour, activeProgram.startMinute)} - {getFormatTimeStr(activeProgram.endHour, activeProgram.endMinute)}
                </span>
                <h5 className="text-base sm:text-lg font-black text-gold-primary mt-1 tracking-tight leading-snug">
                  {language === 'ar' ? activeProgram.nameAr : activeProgram.nameEn}
                </h5>
                <p className="text-xs text-white/80 font-medium mt-1 leading-relaxed">
                  {language === 'ar' ? activeProgram.descriptionAr : activeProgram.descriptionEn}
                </p>
                <p className="text-[10px] sm:text-xs text-cyan-primary/80 font-black mt-2">
                  {language === 'ar' ? 'تقديم: ' : 'Presented by: '} {language === 'ar' ? activeProgram.presenterAr : activeProgram.presenterEn}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Up Quick Teaser */}
        {nextProgram && !showAllPrograms && (
          <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-right mb-6 text-sm">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-white/30" />
              <div>
                <span className="text-[10px] text-white/30 font-bold">
                  {language === 'ar' ? 'الفقرة التالية بمصر' : 'Upcoming Next'}
                </span>
                <p className="font-bold text-white/80 text-xs sm:text-sm mt-0.5">
                  {language === 'ar' ? nextProgram.nameAr : nextProgram.nameEn}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/5 text-white/50 border border-white/5 shrink-0">
              {getFormatTimeStr(nextProgram.startHour, nextProgram.startMinute)}
            </span>
          </div>
        )}

        {/* Full Interactive Schedule Panel */}
        <AnimatePresence>
          {showAllPrograms && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mb-6"
            >
              <div className="relative group/nav mt-2">
                {/* Scroll track navigation buttons */}
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/85 backdrop-blur-md border border-white/10 hover:border-cyan-primary/50 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <ChevronLeft className="w-5 h-5 text-cyan-primary" />
                </button>

                {/* Horizontal slide container */}
                <div
                  id="programs-slider"
                  className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scroll-smooth custom-scrollbar no-scrollbar scrollbar-none"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {upcomingSlots.length === 0 ? (
                    <div className="w-full text-center py-8 text-white/40 text-xs font-bold bg-white/[0.01] rounded-2xl border border-white/5">
                      {language === 'ar' ? 'اكتملت جميع مواعيد اليوم وستتجدد الخريطة بالكامل قريباً' : 'All schedule slots completed for today. Auto-reloads shortly.'}
                    </div>
                  ) : (
                    upcomingSlots.map((slot) => {
                      const isActive = isSlotActive(slot, cairoTime.hours, cairoTime.minutes);
                      return (
                        <div
                          key={slot.id}
                          className={`w-[290px] sm:w-[330px] shrink-0 p-4 rounded-2xl border transition-all snap-start flex flex-col justify-between h-[155px] select-none relative overflow-hidden ${
                            isActive
                              ? 'bg-gradient-to-br from-cyan-primary/[0.08] to-gold-primary/[0.04] border-cyan-primary/40 shadow-lg shadow-cyan-primary/10'
                              : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/[0.04] hover:border-white/15'
                          }`}
                        >
                          {/* Shimmer light effect inside active card */}
                          {isActive && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-primary/10 blur-2xl rounded-full pointer-events-none" />
                          )}
                          
                          <div className="flex items-start justify-between gap-3 text-right">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-cyan-primary/10 text-cyan-primary border border-cyan-primary/20' : 'bg-white/5 text-white/30'}`}>
                                {renderIcon(slot.iconType)}
                              </div>
                              <div className="min-w-0">
                                <span className="inline-flex text-[10px] font-black text-cyan-primary bg-cyan-primary/5 px-2 py-0.5 rounded border border-cyan-primary/10">
                                  {getFormatTimeStr(slot.startHour, slot.startMinute)} - {getFormatTimeStr(slot.endHour, slot.endMinute)}
                                </span>
                                <h6 className={`text-xs sm:text-sm font-black mt-1.5 leading-snug line-clamp-1 ${isActive ? 'text-gold-primary' : 'text-white/90'}`}>
                                  {language === 'ar' ? slot.nameAr : slot.nameEn}
                                </h6>
                                <p className="text-[10px] text-white/60 mt-1 leading-relaxed line-clamp-2">
                                  {language === 'ar' ? slot.descriptionAr : slot.descriptionEn}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2 gap-2 text-right">
                            <span className="text-[9px] font-bold text-white/40 truncate">
                              {language === 'ar' ? 'تقديم: ' : 'Hosted by: '}{language === 'ar' ? slot.presenterAr : slot.presenterEn}
                            </span>
                            
                            {isActive && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-cyan-primary/20 text-cyan-primary border border-cyan-primary/30 shrink-0 uppercase tracking-widest animate-pulse">
                                {language === 'ar' ? 'الآن' : 'Now'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Arrow navigation button */}
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/85 backdrop-blur-md border border-white/10 hover:border-cyan-primary/50 text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                >
                  <ChevronRight className="w-5 h-5 text-cyan-primary" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle view button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAllPrograms(!showAllPrograms)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto py-2.5 px-6 rounded-2xl bg-white/5 border border-white/10 hover:border-gold-primary/30 text-white/70 hover:text-white text-xs font-black transition-all"
          >
            {showAllPrograms ? <ChevronUp className="w-4 h-4 text-gold-primary" /> : <ChevronDown className="w-4 h-4 text-gold-primary" />}
            {showAllPrograms 
              ? (language === 'ar' ? 'طي قائمة البرامج المتبقية' : 'Hide Remaining Programs list') 
              : (language === 'ar' ? `عرض الفقرات المتبقية اليوم (${upcomingSlots.length})` : `Show remaining programs today (${upcomingSlots.length})`)}
          </motion.button>

          <a
            href="https://misrquran.gov.eg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gold-primary/70 hover:text-gold-primary font-black transition-all group shrink-0"
          >
            <span>{language === 'ar' ? 'الموقع الرسمي للهيئة العامة' : 'Official Misr Quran Website'}</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-y-[-1px] group-hover:translate-x-[1px] transition-transform" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
