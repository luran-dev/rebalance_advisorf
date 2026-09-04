import { ExternalLink, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchMarketHistory, fetchNews } from "../marketApi";
import { buildMarketAnalysis } from "../marketAnalysis";
import type { MarketDetailSubject, MarketHistory, MarketRange, NewsResult } from "../types";
import { MarketChart } from "./MarketChart";

const rangeLabels: readonly { readonly range: MarketRange; readonly label: string }[] = [
  { range: "1w", label: "1주" },
  { range: "1m", label: "1개월" },
  { range: "3m", label: "3개월" },
  { range: "6m", label: "6개월" },
  { range: "1y", label: "1년" },
];

const newsSearchUrl = (engine: "naver" | "google", query: string): string => {
  const encoded = encodeURIComponent(query);
  return engine === "naver"
    ? `https://search.naver.com/search.naver?where=news&query=${encoded}`
    : `https://news.google.com/search?q=${encoded}&hl=ko&gl=KR&ceid=KR:ko`;
};

export function MarketDetailDialog({
  subject,
  onClose,
}: {
  readonly subject: MarketDetailSubject;
  readonly onClose: () => void;
}) {
  const [range, setRange] = useState<MarketRange>("6m");
  const [history, setHistory] = useState<MarketHistory | null>(null);
  const [news, setNews] = useState<NewsResult | null>(null);
  const [historyError, setHistoryError] = useState("");
  const [newsError, setNewsError] = useState("");
  const query = `${subject.productName} ${subject.symbol}`;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    setHistory(null);
    setHistoryError("");
    void fetchMarketHistory(subject.symbol, range)
      .then((result) => {
        if (active) {
          setHistory(result);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setHistoryError(error instanceof Error ? error.message : "차트 데이터를 불러오지 못했습니다.");
        }
      });
    return () => {
      active = false;
    };
  }, [range, subject.symbol]);

  useEffect(() => {
    let active = true;
    setNews(null);
    setNewsError("");
    void fetchNews(query)
      .then((result) => {
        if (active) {
          setNews(result);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setNewsError(error instanceof Error ? error.message : "뉴스를 불러오지 못했습니다.");
        }
      });
    return () => {
      active = false;
    };
  }, [query]);

  const analysis = useMemo(() => buildMarketAnalysis(subject, history?.items ?? []), [history, subject]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="panel target-dialog market-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="market-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="market-dialog-header">
          <div>
            <p className="eyebrow">{subject.accountName ?? "포트폴리오"} · {subject.assetClass}</p>
            <h2 id="market-detail-title">{subject.productName}</h2>
            <span className="ticker">{subject.symbol}</span>
          </div>
          <button className="icon-command icon-only" type="button" onClick={onClose} aria-label="종목 상세 닫기" title="닫기">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="market-dialog-body">
          <div className="period-control" aria-label="차트 기간">
            {rangeLabels.map((item) => (
              <button
                key={item.range}
                className={item.range === range ? "active" : ""}
                type="button"
                onClick={() => setRange(item.range)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {historyError ? <p className="form-feedback">{historyError}</p> : <MarketChart items={history?.items ?? []} />}
          <p className="target-hint market-source">
            {history === null ? "차트 데이터 불러오는 중" : `${history.source} · ${history.currency}`}
          </p>
          <div className="market-metrics">
            {analysis.metrics.map((metric) => (
              <div className={`market-metric market-metric-${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          <div className="market-comments">
            {analysis.comments.map((comment) => (
              <p key={comment}>{comment}</p>
            ))}
          </div>
          <footer className="market-news">
            <div className="news-link-row">
              <a href={newsSearchUrl("naver", query)} target="_blank" rel="noreferrer">
                네이버뉴스 검색
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <a href={newsSearchUrl("google", query)} target="_blank" rel="noreferrer">
                구글 뉴스 검색
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            {newsError ? <p className="form-feedback">{newsError}</p> : null}
            {news?.items.length ? (
              <ul>
                {news.items.map((item) => (
                  <li key={item.link}>
                    <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
                    <span>{item.publisher || news.source}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </footer>
        </div>
      </section>
    </div>
  );
}
