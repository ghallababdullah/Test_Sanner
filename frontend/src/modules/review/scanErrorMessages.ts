export interface ScanErrorInfo {
  title: string;
  details: string;
  nextStep?: string;
}

function normalizeValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function explainScanError(rawError?: string | null): ScanErrorInfo | null {
  if (!rawError) {
    return null;
  }

  const normalized = normalizeValue(rawError);

  if (
    normalized.includes("cannot detect 4 corner markers") ||
    normalized.includes("default roi failed") ||
    normalized.includes("markers")
  ) {
    return {
      title: "Система не нашла угловые маркеры бланка",
      details: "На снимке не удалось уверенно распознать четыре опорных маркера, по которым выравнивается бланк.",
      nextStep: "Переснимите лист целиком, без обрезанных углов, с ровным освещением и без сильного наклона камеры."
    };
  }

  if (
    normalized.includes("cannot find paper boundary") ||
    normalized.includes("paper boundary") ||
    normalized.includes("find paper")
  ) {
    return {
      title: "Система не смогла определить границы листа",
      details: "Фото не позволило надёжно отделить сам лист от фона, поэтому выравнивание не удалось.",
      nextStep: "Положите лист на более контрастный фон, убедитесь, что весь A4 попадает в кадр, и переснимите бланк."
    };
  }

  if (normalized.includes("image_read_failed")) {
    return {
      title: "Система не смогла прочитать изображение",
      details: "Файл изображения оказался повреждённым или в неподдерживаемом состоянии для OCR-обработки.",
      nextStep: "Загрузите этот бланк заново или сделайте новый снимок."
    };
  }

  if (normalized.includes("ocr processing exceeded timeout") || normalized.includes("timeout")) {
    return {
      title: "Обработка заняла слишком много времени",
      details: "OCR не успел завершиться в допустимое время.",
      nextStep: "Попробуйте загрузить бланк ещё раз. Если ошибка повторяется, лучше переснять изображение в более чистом виде."
    };
  }

  if (normalized.includes("ocr payload was not completed") || normalized.includes("returned no result")) {
    return {
      title: "Распознавание не завершилось корректно",
      details: "OCR-процесс был запущен, но не вернул полный результат для этого бланка.",
      nextStep: "Повторите обработку бланка. Если ошибка повторится, лучше переснять или загрузить более чёткое изображение."
    };
  }

  if (normalized.includes("ocr_failed")) {
    return {
      title: "Ошибка при распознавании текста",
      details: "Во время OCR произошёл внутренний сбой на одном из этапов чтения полей.",
      nextStep: "Попробуйте ещё раз. Если ошибка повторяется, проверьте качество снимка и читаемость полей."
    };
  }

  if (normalized.includes("failed to prepare roi preview") || normalized.includes("roi preview")) {
    return {
      title: "Не удалось подготовить предпросмотр полей",
      details: "Система не смогла построить разметку ROI для проверки перед распознаванием.",
      nextStep: "Попробуйте загрузить бланк заново. Если не поможет, используйте более ровный и контрастный снимок."
    };
  }

  if (normalized.includes("failed to publish ocr job") || normalized.includes("failed to queue ocr job")) {
    return {
      title: "Бланк сохранён, но не отправлен в OCR",
      details: "Файл дошёл до сервера, но задача на распознавание не попала в очередь обработки.",
      nextStep: "Проверьте работу OCR worker и очереди, затем повторите запуск обработки."
    };
  }

  if (normalized.includes("failed to store scanned image")) {
    return {
      title: "Не удалось сохранить изображение бланка",
      details: "Сервер не смог записать загруженный файл в хранилище.",
      nextStep: "Попробуйте загрузить изображение ещё раз. Если ошибка повторяется, проверьте хранилище сервера."
    };
  }

  return {
    title: "Не удалось обработать бланк",
    details: rawError,
    nextStep: "Попробуйте переснять или загрузить бланк ещё раз. Если ошибка повторится, проверьте серверные логи OCR."
  };
}
