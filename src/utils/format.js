import dayjs from 'dayjs';

export const CURRENCY = 'OMR';

export const money = (n) => `${Number(n || 0).toFixed(3)} ${CURRENCY}`;
export const num = (n) => Number(n || 0).toFixed(3);
export const fmtDate = (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-');

export const statusColor = {
  active: 'green',
  inactive: 'red',
  draft: 'default',
  submitted: 'blue',
  confirmed: 'cyan',
  delivered: 'green',
  cancelled: 'red',
};
