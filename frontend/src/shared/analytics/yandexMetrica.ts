const YANDEX_METRICA_COUNTER_ID = Number(import.meta.env.VITE_YANDEX_METRICA_ID ?? "109570899");
const YANDEX_METRICA_SCRIPT_SRC = `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRICA_COUNTER_ID}`;

declare global {
  interface Window {
    ym?: ((counterId: number, method: string, ...args: unknown[]) => void) & {
      a?: unknown[];
      l?: number;
    };
  }
}

type YandexMetricaFunction = NonNullable<Window["ym"]>;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function initYandexMetrica() {
  if (!isBrowser() || !Number.isFinite(YANDEX_METRICA_COUNTER_ID)) {
    return;
  }

  if (!window.ym) {
    const ym = ((counterId: number, method: string, ...args: unknown[]) => {
      const currentYm = window.ym as YandexMetricaFunction | undefined;
      const queue = currentYm?.a ?? [];
      queue.push([counterId, method, ...args]);
      if (currentYm) {
        currentYm.a = queue;
      }
    }) as YandexMetricaFunction;
    ym.a = [];
    ym.l = Date.now();
    window.ym = ym;
  }

  const hasScript = Array.from(document.scripts).some((script) => script.src === YANDEX_METRICA_SCRIPT_SRC);
  if (!hasScript) {
    const script = document.createElement("script");
    script.async = true;
    script.src = YANDEX_METRICA_SCRIPT_SRC;
    document.head.appendChild(script);
  }

  window.ym?.(YANDEX_METRICA_COUNTER_ID, "init", {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    referrer: document.referrer,
    url: window.location.href,
    accurateTrackBounce: true,
    trackLinks: true
  });
}

export function trackYandexPageView(url?: string) {
  if (!isBrowser() || !window.ym || !Number.isFinite(YANDEX_METRICA_COUNTER_ID)) {
    return;
  }

  window.ym(YANDEX_METRICA_COUNTER_ID, "hit", url ?? window.location.href, {
    title: document.title,
    referer: document.referrer
  });
}

export function reachYandexGoal(goalId: string, params?: Record<string, unknown>) {
  if (!isBrowser() || !window.ym || !goalId || !Number.isFinite(YANDEX_METRICA_COUNTER_ID)) {
    return;
  }

  window.ym(YANDEX_METRICA_COUNTER_ID, "reachGoal", goalId, params);
}
