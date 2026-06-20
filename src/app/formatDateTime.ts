const unixSecondsPattern = /^\d+$/;

export function formatDateTime(value: string): string {
  const date = unixSecondsPattern.test(value)
    ? new Date(Number(value) * 1000)
    : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '时间未知';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
