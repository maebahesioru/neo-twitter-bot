export function sanitizeInput(input: string): string {
  // Simple HTML sanitization - remove all HTML tags
  return input.replace(/<[^>]*>/g, '');
}

export function validateTweetText(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'ツイート内容を入力してください' };
  }
  
  if (text.length > 280) {
    return { valid: false, error: 'ツイートは280文字以内にしてください' };
  }
  
  return { valid: true };
}

export function validateTweetId(id: string): { valid: boolean; error?: string } {
  if (!id || id.trim().length === 0) {
    return { valid: false, error: 'ツイートIDを入力してください' };
  }
  
  // Twitter IDs are numeric strings
  if (!/^\d+$/.test(id)) {
    return { valid: false, error: '無効なツイートIDです' };
  }
  
  return { valid: true };
}

export function validateScheduledTime(time: string): { valid: boolean; error?: string } {
  if (!time || time.trim().length === 0) {
    return { valid: false, error: 'スケジュール時間を入力してください' };
  }
  
  const date = new Date(time);
  if (isNaN(date.getTime())) {
    return { valid: false, error: '無効な日時です' };
  }
  
  const now = new Date();
  if (date <= now) {
    return { valid: false, error: 'スケジュール時間は未来である必要があります' };
  }
  
  return { valid: true };
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return { valid: false, error: 'ファイルサイズは5MB以下にしてください' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '許可されていないファイルタイプです' };
  }
  
  return { valid: true };
}

export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
