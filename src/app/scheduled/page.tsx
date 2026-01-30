'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface ScheduledTweet {
  id: string;
  text: string;
  media: Array<{
    file: string;
    type: 'image' | 'video' | 'gif';
  }>;
  scheduledTime: string;
  isRetweet: boolean;
  retweetId: string;
  quoteTweetId: string;
  status: 'pending' | 'posted' | 'failed';
}

export default function ScheduledPage() {
  const [tweets, setTweets] = useState<ScheduledTweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTweets();
  }, []);

  const fetchTweets = async () => {
    try {
      const response = await fetch('/api/schedule-tweet');
      const data = await response.json();
      setTweets(data);
    } catch (error) {
      console.error('Error fetching tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTweet = async (id: string) => {
    if (!confirm('このツイートを削除しますか？')) return;

    try {
      const response = await fetch(`/api/schedule-tweet/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTweets();
      }
    } catch (error) {
      console.error('Error deleting tweet:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (dateString.includes('+') || dateString.includes('Z')) {
      const date = new Date(dateString);
      const jstDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      return jstDate.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    }
    return dateString.replace(' ', ' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'posted':
        return '投稿済み';
      case 'failed':
        return '失敗';
      default:
        return '待機中';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-300">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            予約済みツイート
          </h1>

          {tweets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              予約済みのツイートはありません
            </div>
          ) : (
            <div className="space-y-4">
              {tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tweet.status)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {getStatusText(tweet.status)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTweet(tweet.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                      title="削除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <p className="text-gray-900 dark:text-white mb-3 whitespace-pre-wrap">
                    {tweet.text}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {tweet.media.map((media, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                      >
                        {media.type === 'gif' ? 'GIF' : media.type === 'video' ? '動画' : '画像'} {index + 1}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock size={14} />
                      <span>予約時間: {formatDate(tweet.scheduledTime)}</span>
                    </div>
                    {tweet.isRetweet && (
                      <div className="flex items-center gap-2">
                        <span>RT: {tweet.retweetId}</span>
                      </div>
                    )}
                    {tweet.quoteTweetId && (
                      <div className="flex items-center gap-2">
                        <span>引用: {tweet.quoteTweetId}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
