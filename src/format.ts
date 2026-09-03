export const formatKrw = (value: number): string =>
  new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number): string =>
  `${new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(value)}%`;
