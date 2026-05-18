export function formatProcessingStatus(status?: string) {
  switch (status) {
    case "PENDING_OCR":
      return "Ожидает запуска распознавания";
    case "QUEUED":
      return "В очереди на распознавание";
    case "PROCESSING":
      return "Распознавание выполняется";
    case "OCR_COMPLETED":
      return "Распознавание завершено";
    case "OCR_FAILED":
      return "Ошибка распознавания";
    default:
      return status ?? "—";
  }
}

export function formatReviewStatus(status?: string) {
  switch (status) {
    case "PENDING":
      return "Ожидает проверки";
    case "REVIEWED":
      return "Проверено вручную";
    case "CORRECTED":
      return "Исправлено вручную";
    case "SKIPPED":
      return "Проверка пропущена";
    default:
      return status ?? "—";
  }
}

export function formatMatchType(matchType?: string) {
  switch (matchType) {
    case "EXACT":
    case "EXACT_MATCH":
      return "Точное совпадение";
    case "TOLERANCE_1":
    case "ONE_CHAR_DIFF":
      return "1 символ не совпадает";
    case "TOLERANCE_2":
    case "TWO_CHAR_DIFF":
      return "2 символа не совпадают";
    case "NO_MATCH":
      return "3+ символа не совпадают";
    case "PENDING_SCORING":
      return "Оценивание ещё не завершено";
    default:
      return matchType ?? "—";
  }
}
