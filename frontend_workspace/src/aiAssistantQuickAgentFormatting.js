export const formatAssistantReply = (value) => {
  const source = String(value ?? '').replace(/\r\n/g, '\n').trim();
  if (!source) return '';
  let formatted = source.replace(/\s*(\d+\.)\s*/g, '\n$1 ');
  formatted = formatted.replace(/\n{2,}/g, '\n').trim();
  if (!formatted.includes('\n')) {
    formatted = formatted.replace(/([.!?]|니다\.|세요\.|해주세요\.|됩니다\.)\s+(?=[^\n])/g, '$1\n');
    formatted = formatted.replace(/\n{2,}/g, '\n').trim();
  }
  return formatted;
};
