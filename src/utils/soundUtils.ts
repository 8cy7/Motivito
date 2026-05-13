import Sound from 'react-native-sound';
import { Platform } from 'react-native';

// تفعيل الصوت - يجب استدعاؤه مرة واحدة فقط
Sound.setCategory('Playback', true);

// مخزن مؤقت للأصوات لتجنب إعادة التحميل
const soundCache: Record<string, Sound> = {};

export type SoundType = 'success' | 'levelup' | 'bonus' | 'click' | 'error' | 'taskdone' | 'openbox' | 'starsspend';

export const SOUND_LABELS: Record<SoundType, string> = {
  success: 'صوت النجاح ✓',
  levelup: 'صوت الترقية 🎉',
  bonus: 'صوت المكافأة 🎁',
  click: 'صوت النقر 🔘',
  error: 'صوت الخطأ ⚠️',
  taskdone: 'صوت إتمام المهمة ✅',
  openbox: 'صوت فتح الصندوق 📦',
  starsspend: 'صوت إنفاق النجوم ⭐',
};

interface SoundConfig {
  soundId: string;
  enabled: boolean;
}

const SOUNDS: Record<SoundType, SoundConfig> = {
  success: {
    soundId: 'taskdone',
    enabled: true,
  },
  levelup: {
    soundId: 'levelup',
    enabled: true,
  },
  bonus: {
    soundId: 'taskdone',
    enabled: true,
  },
  click: {
    soundId: 'taskdone',
    enabled: true,
  },
  error: {
    soundId: 'taskdone',
    enabled: true,
  },
  taskdone: {
    soundId: 'taskdone',
    enabled: true,
  },
  openbox: {
    soundId: 'openboxlevel',
    enabled: true,
  },
  starsspend: {
    soundId: 'starsspend',
    enabled: true,
  },
};

/**
 * مدير الأصوات - يدير تشغيل جميع الأصوات في التطبيق
 *
 * الاستخدام:
 * await SoundManager.playSound('success');
 * SoundManager.setSoundEnabled('success', false);
 */
export class SoundManager {
  static async playSound(soundType: SoundType): Promise<void> {
    try {
      const sound = SOUNDS[soundType];
      if (!sound || !sound.enabled) {
        return;
      }

      const soundId = sound.soundId;
      // iOS needs extension, Android doesn't
      const filename = Platform.OS === 'ios' ? `${soundId}.wav` : soundId;

      // إذا الصوت محمّل مسبقاً شغّله مباشرة
      const cached = soundCache[soundId];
      if (cached) {
        cached.stop(() => {
          cached.play(() => {});
        });
        return;
      }

      // تحميل الصوت وتشغيله بعد التحميل
      const audioSound = new Sound(filename, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          return;
        }
        soundCache[soundId] = audioSound;
        audioSound.play(() => {});
      });
    } catch {
      // silent
    }
  }

  static setSoundEnabled(soundType: SoundType, enabled: boolean): void {
    if (SOUNDS[soundType]) {
      SOUNDS[soundType].enabled = enabled;
    }
  }

  static isSoundEnabled(soundType: SoundType): boolean {
    return SOUNDS[soundType]?.enabled ?? false;
  }

  static toggleSound(soundType: SoundType): boolean {
    const newState = !this.isSoundEnabled(soundType);
    this.setSoundEnabled(soundType, newState);
    return newState;
  }

  static disableAllSounds(): void {
    Object.keys(SOUNDS).forEach((key) => {
      SOUNDS[key as SoundType].enabled = false;
    });
  }

  static enableAllSounds(): void {
    Object.keys(SOUNDS).forEach((key) => {
      SOUNDS[key as SoundType].enabled = true;
    });
  }

  static getAllSounds(): Array<{ type: SoundType; enabled: boolean; label: string }> {
    return Object.entries(SOUNDS).map(([type, config]) => ({
      type: type as SoundType,
      enabled: config.enabled,
      label: SOUND_LABELS[type as SoundType],
    }));
  }

  // تنظيف الأصوات عند الانتهاء
  static releaseAll(): void {
    Object.values(soundCache).forEach((sound) => {
      sound.release();
    });
    Object.keys(soundCache).forEach((key) => {
      delete soundCache[key];
    });
  }
}
