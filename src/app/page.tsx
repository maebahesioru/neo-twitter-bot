'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { Image, Video, Send, Clock, Quote, Repeat2, X, MessageCircle } from 'lucide-react';
import { isToday } from 'date-fns';
import { supabase, SCHEDULED_TWEETS_TABLE } from '@/lib/supabase';

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video' | 'gif';
}

export default function Home() {
  const [tweetText, setTweetText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [quoteTweetId, setQuoteTweetId] = useState('');
  const [retweetId, setRetweetId] = useState('');
  const [replyTweetId, setReplyTweetId] = useState('');
  const [tweetType, setTweetType] = useState<'tweet' | 'quote' | 'retweet' | 'reply'>('tweet');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledHour, setScheduledHour] = useState('');
  const [scheduledMinute, setScheduledMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBookedTimes();
  }, []);

  const fetchBookedTimes = async () => {
    try {
      const { data } = await supabase
        .from(SCHEDULED_TWEETS_TABLE)
        .select('scheduled_time')
        .eq('status', 'pending');
      
      if (data) {
        const times = data.map(t => t.scheduled_time);
        setBookedTimes(times);
      }
    } catch (error) {
      console.error('Error fetching booked times:', error);
    }
  };

  const isTodaySelected = scheduledDate ? isToday(new Date(scheduledDate)) : false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const parseJSTTime = (timeString: string): { date: string; hour: number; minute: number } | null => {
    if (timeString.includes('+') || timeString.includes('Z')) {
      const d = new Date(timeString);
      const jstDate = new Date(d.getTime() + (9 * 60 * 60 * 1000));
      return {
        date: `${jstDate.getUTCFullYear()}-${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`,
        hour: jstDate.getUTCHours(),
        minute: jstDate.getUTCMinutes()
      };
    }
    const match = timeString.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):\d{2}$/);
    if (match) {
      return {
        date: match[1],
        hour: parseInt(match[2], 10),
        minute: parseInt(match[3], 10)
      };
    }
    return null;
  };

  const getBookedHoursForDate = (date: string) => {
    if (!date) return [];
    return bookedTimes
      .map(time => parseJSTTime(time))
      .filter(parsed => parsed && parsed.date === date)
      .map(parsed => parsed!.hour);
  };

  const getBookedMinutesForDateAndHour = (date: string, hour: number) => {
    if (!date || hour === null || hour === undefined) return [];
    return bookedTimes
      .map(time => parseJSTTime(time))
      .filter(parsed => parsed && parsed.date === date && parsed.hour === hour)
      .map(parsed => parsed!.minute);
  };

  const bookedHoursForDate = getBookedHoursForDate(scheduledDate);
  const bookedMinutesForDateAndHour = getBookedMinutesForDateAndHour(scheduledDate, parseInt(scheduledHour));

  const getAvailableMinutesCount = (hour: number) => {
    let minutes = [0, 15, 30, 45];
    
    if (isTodaySelected) {
      if (hour === currentHour) {
        minutes = minutes.filter(min => min > currentMinute);
      } else if (hour < currentHour) {
        return 0;
      }
    }
    
    const bookedMinutes = getBookedMinutesForDateAndHour(scheduledDate, hour);
    return minutes.filter(min => !bookedMinutes.includes(min)).length;
  };

  const availableHours = useMemo(() => {
    let hours = Array.from({ length: 24 }, (_, i) => i);
    
    if (isTodaySelected) {
      if (currentMinute > 45) {
        hours = hours.filter(hour => hour > currentHour);
      } else {
        hours = hours.filter(hour => hour > currentHour || hour === currentHour);
      }
    }
    
    return hours.filter(hour => getAvailableMinutesCount(hour) > 0);
  }, [isTodaySelected, currentHour, currentMinute, scheduledDate, bookedTimes]);

  const availableMinutes = useMemo(() => {
    let minutes = [0, 15, 30, 45];
    
    if (isTodaySelected && scheduledHour !== '') {
      const hour = parseInt(scheduledHour);
      if (hour === currentHour) {
        minutes = minutes.filter(min => min > currentMinute);
      }
    }
    
    return minutes.filter(min => !bookedMinutesForDateAndHour.includes(min));
  }, [isTodaySelected, scheduledHour, currentHour, currentMinute, bookedMinutesForDateAndHour]);

  const extractTweetId = (input: string): string => {
    if (!input) return '';
    
    const urlMatch = input.match(/\/status\/(\d+)/);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    return input.replace(/\D/g, '');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const gifCount = mediaFiles.filter(m => m.type === 'gif').length;
    const mediaCount = mediaFiles.filter(m => m.type !== 'gif').length;

    files.forEach(file => {
      const isGif = file.type === 'image/gif';
      
      if (isGif && gifCount >= 1) {
        alert('GIFは1枚までです');
        return;
      }
      
      if (!isGif && mediaCount >= 4) {
        alert('画像・動画は4枚までです');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const newMedia: MediaFile = {
          file,
          preview: reader.result as string,
          type: isGif ? 'gif' : (file.type.startsWith('video/') ? 'video' : 'image')
        };
        setMediaFiles(prev => [...prev, newMedia]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (tweetType !== 'retweet' && !tweetText.trim() && mediaFiles.length === 0) {
      alert('ツイート内容を入力してください');
      return;
    }

    if (tweetType === 'retweet' && !retweetId) {
      alert('リツイートするツイートIDを入力してください');
      return;
    }

    if (tweetType === 'quote' && !quoteTweetId) {
      alert('引用するツイートIDを入力してください');
      return;
    }

    if (tweetType === 'quote' && !tweetText.trim() && mediaFiles.length === 0) {
      alert('引用ツイートの内容または画像を入力してください');
      return;
    }

    if (tweetType === 'reply' && !replyTweetId) {
      alert('返信するツイートIDを入力してください');
      return;
    }

    if (tweetType === 'reply' && !tweetText.trim() && mediaFiles.length === 0) {
      alert('返信の内容または画像を入力してください');
      return;
    }

    if (!scheduledDate || !scheduledHour || !scheduledMinute) {
      alert('投稿日時を指定してください');
      return;
    }

    setIsSubmitting(true);

    const scheduledTime = `${scheduledDate}T${String(scheduledHour).padStart(2, '0')}:${String(scheduledMinute).padStart(2, '0')}:00+09:00`;

    const formData = new FormData();
    formData.append('text', tweetText);
    formData.append('scheduledTime', scheduledTime);
    formData.append('tweetType', tweetType);
    formData.append('retweetId', retweetId);
    formData.append('quoteTweetId', quoteTweetId);
    formData.append('replyTweetId', replyTweetId);

    mediaFiles.forEach((media, index) => {
      formData.append(`media_${index}`, media.file);
      formData.append(`mediaType_${index}`, media.type);
    });

    try {
      const response = await fetch('/api/schedule-tweet', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || 'XOvMtaVBEfWKNLgYRJhZpsxPmTjUCwir'
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        setTweetText('');
        setMediaFiles([]);
        setQuoteTweetId('');
        setRetweetId('');
        setReplyTweetId('');
        setTweetType('tweet');
        setScheduledDate('');
        setScheduledHour('');
        setScheduledMinute('');
        await fetchBookedTimes();
      } else {
        alert(result.error || 'ツイートの予約に失敗しました');
      }
    } catch (error) {
      console.error('Error scheduling tweet:', error);
      alert('ツイートの予約に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <span className="text-blue-500">NEO</span> - ツイート代行ボット
          </h1>

          <div className="space-y-4">
            {tweetType !== 'retweet' && (
              <div>
                <textarea
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  placeholder="ツイート内容を入力..."
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  maxLength={280}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {tweetText.length}/280
                </div>
              </div>
            )}

            <div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {/* eslint-disable jsx-a11y/alt-text */}
                <Image size={20} aria-hidden="true" focusable="false" />
                <Video size={20} aria-hidden="true" focusable="false" />
                メディア追加 (最大4枚)
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="メディアファイルを選択"
              />
            </div>

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'video' ? (
                      <video src={media.preview} className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={media.preview} alt={media.file.name} className="w-full h-32 object-cover rounded-lg" />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      aria-label="メディアを削除"
                    >
                      <X size={16} />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {media.type === 'gif' ? 'GIF' : media.type === 'video' ? '動画' : '画像'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ツイートタイプ
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${tweetType === 'tweet' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="tweetType"
                      value="tweet"
                      checked={tweetType === 'tweet'}
                      onChange={() => setTweetType('tweet')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">ツイート</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${tweetType === 'quote' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="tweetType"
                      value="quote"
                      checked={tweetType === 'quote'}
                      onChange={() => setTweetType('quote')}
                      className="w-4 h-4"
                    />
                    <Quote size={16} />
                    <span className="text-sm">引用リツイート</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${tweetType === 'retweet' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="tweetType"
                      value="retweet"
                      checked={tweetType === 'retweet'}
                      onChange={() => setTweetType('retweet')}
                      className="w-4 h-4"
                    />
                    <Repeat2 size={16} />
                    <span className="text-sm">リツイート</span>
                  </label>
                  <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${tweetType === 'reply' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
                    <input
                      type="radio"
                      name="tweetType"
                      value="reply"
                      checked={tweetType === 'reply'}
                      onChange={() => setTweetType('reply')}
                      className="w-4 h-4"
                    />
                    <MessageCircle size={16} />
                    <span className="text-sm">返信</span>
                  </label>
                </div>
              </div>

              {tweetType === 'quote' && (
                <div className="flex items-center gap-2">
                  <Quote size={18} className="text-gray-700 dark:text-gray-300" />
                  <input
                    type="text"
                    value={quoteTweetId}
                    onChange={(e) => setQuoteTweetId(extractTweetId(e.target.value))}
                    placeholder="引用するツイートIDまたはURL"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {tweetType === 'retweet' && (
                <div className="flex items-center gap-2">
                  <Repeat2 size={18} className="text-gray-700 dark:text-gray-300" />
                  <input
                    type="text"
                    value={retweetId}
                    onChange={(e) => setRetweetId(extractTweetId(e.target.value))}
                    placeholder="リツイートするツイートIDまたはURL"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {tweetType === 'reply' && (
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-gray-700 dark:text-gray-300" />
                  <input
                    type="text"
                    value={replyTweetId}
                    onChange={(e) => setReplyTweetId(extractTweetId(e.target.value))}
                    placeholder="返信するツイートIDまたはURL"
                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Clock size={18} />
                  投稿日時
                </label>
                <p className="text-xs text-gray-500 mb-2">※予約済みの時間は表示されません</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      min={(() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, '0');
                        const day = String(today.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })()}
                      aria-label="投稿日"
                    />
                  </div>
                  <div>
                    <select
                      value={scheduledHour}
                      onChange={(e) => {
                        setScheduledHour(e.target.value);
                        setScheduledMinute('');
                      }}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      disabled={!scheduledDate}
                      aria-label="時間"
                    >
                      <option value="">時</option>
                      {availableHours.map((hour) => (
                        <option key={hour} value={hour}>{hour}時</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={scheduledMinute}
                      onChange={(e) => setScheduledMinute(e.target.value)}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      disabled={!scheduledHour}
                      aria-label="分"
                    >
                      <option value="">分</option>
                      {availableMinutes.map((minute) => (
                        <option key={minute} value={minute}>{minute}分</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
              {isSubmitting ? '送信中...' : 'ツイート予約'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
