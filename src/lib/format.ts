const formatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const formatDate = (date: Date): string => formatter.format(date)
