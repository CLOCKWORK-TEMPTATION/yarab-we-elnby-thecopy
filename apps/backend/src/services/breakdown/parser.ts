import type { ParsedScene, ParsedScreenplay, SceneHeader, SceneType, TimeOfDay } from './types';
import { estimateScenePageCount, validateSceneHeader } from './utils';

const ENGLISH_SCENE_HEADING_PATTERN =
  /^(?:INT|EXT|INT\/EXT|I\/E|EST)\.?\s+/i;
const ARABIC_SCENE_HEADING_PATTERN = /^(?:مشهد(?:\s+(?:داخلي|خارجي))?|م)(?:\s|\.|$)/i;
const LOCATION_PREFIX_PATTERN = /^(?:موقع|مكان|المكان|المنطقة)\s*:\s*/;
const HEADER_METADATA_PATTERN =
  /^(?:داخلي|خارجي|ليل|نهار|صباح|مساء|فجر|مغرب|day|night|dawn|dusk|morning|evening|location|موقع|مكان|INT|EXT)/i;
const STRUCTURED_UPPERCASE_PATTERN = /^[A-Z0-9\s\-–—/.]+$/;
const TRANSITION_PATTERN =
  /^(?:CUT\s+TO|FADE\s+IN|FADE\s+OUT|DISSOLVE\s+TO|SMASH\s+CUT|MATCH\s+CUT|JUMP\s+CUT|WIPE\s+TO|IRIS\s+(?:IN|OUT)|قطع\s+إلى|تلاشي\s+(?:دخول|خروج)|ذوبان\s+إلى|قطع\s+مفاجئ|قطع\s+مطابق)\s*:?\s*$/i;
const CHARACTER_PATTERN = /^.{1,40}\s*:\s*$/;
const ACTION_PREFIX_PATTERN = /^[\-–—(]/;

function normalizeLine(line: string): string {
  return line.replace(/\u00A0/g, ' ').trim();
}

function looksLikeSceneHeading(line: string): boolean {
  const trimmed = normalizeLine(line);

  if (!trimmed) {
    return false;
  }

  if (ENGLISH_SCENE_HEADING_PATTERN.test(trimmed)) {
    return true;
  }

  if (!ARABIC_SCENE_HEADING_PATTERN.test(trimmed)) {
    return false;
  }

  return trimmed.length <= 180;
}

function looksLikeHeaderContinuation(line: string, currentHeader: string): boolean {
  const trimmed = normalizeLine(line);

  if (!trimmed || looksLikeSceneHeading(trimmed)) {
    return false;
  }

  if (
    TRANSITION_PATTERN.test(trimmed) ||
    CHARACTER_PATTERN.test(trimmed) ||
    ACTION_PREFIX_PATTERN.test(trimmed)
  ) {
    return false;
  }

  if (LOCATION_PREFIX_PATTERN.test(trimmed)) {
    return true;
  }

  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const currentLooksStructured =
    /^(?:مشهد|م)\s*\d+/i.test(currentHeader) ||
    /^(?:مشهد|م)(?:\s|$)/i.test(currentHeader);

  return (
    currentLooksStructured &&
    wordCount > 0 &&
    wordCount <= 6 &&
    !/[.!?،؛]/.test(trimmed) &&
    (HEADER_METADATA_PATTERN.test(trimmed) ||
      STRUCTURED_UPPERCASE_PATTERN.test(trimmed))
  );
}

function inferSceneType(header: string): SceneType {
  if (/(?:^|\s)(?:EXT|خارجي)/i.test(header)) {
    return 'EXT';
  }

  return 'INT';
}

function inferTimeOfDay(header: string): TimeOfDay {
  if (/(?:ليل|night)/i.test(header)) {
    return 'NIGHT';
  }

  if (/(?:فجر|dawn|شروق)/i.test(header)) {
    return 'DAWN';
  }

  if (/(?:غروب|dusk|مغرب)/i.test(header)) {
    return 'DUSK';
  }

  if (/(?:صباح|morning)/i.test(header)) {
    return 'MORNING';
  }

  if (/(?:مساء|evening)/i.test(header)) {
    return 'EVENING';
  }

  if (/(?:نهار|day)/i.test(header)) {
    return 'DAY';
  }

  return 'UNKNOWN';
}

function inferStoryDay(header: string): number {
  const arabicMatch = header.match(/يوم\s+(\d+)/i);
  if (arabicMatch) {
    return Number(arabicMatch[1]);
  }

  const englishMatch = header.match(/day\s+(\d+)/i);
  if (englishMatch) {
    return Number(englishMatch[1]);
  }

  return 1;
}

function inferSceneNumber(header: string, fallback: number): number {
  const arabicMatch = header.match(/(?:^|\s)(?:مشهد|م)\s*(\d+)/i);
  if (arabicMatch) {
    return Number(arabicMatch[1]);
  }

  const englishMatch = header.match(/(?:scene)\s*(\d+)/i);
  if (englishMatch) {
    return Number(englishMatch[1]);
  }

  return fallback;
}

function inferLocation(header: string): string {
  const normalizedHeader = normalizeLine(header);

  const englishMatch = normalizedHeader.match(
    /^(?:INT|EXT|INT\/EXT|I\/E|EST)\.?\s*([^-|]+)/i
  );
  if (englishMatch?.[1]) {
    return englishMatch[1].trim();
  }

  const arabicMatch = normalizedHeader.match(
    /^(?:مشهد(?:\s+(?:داخلي|خارجي))?\.?\s*)?(.+?)(?:\s*[-–—]\s*(?:ليل|نهار|فجر|مغرب|day|night|dawn|dusk|morning|evening).*)?$/i
  );
  if (arabicMatch?.[1]) {
    const candidate = arabicMatch[1]
      .replace(/^(?:داخلي|خارجي)\.?\s*/i, '')
      .trim();
    if (candidate) {
      return candidate;
    }
  }

  return 'موقع غير محدد';
}

function buildHeaderData(header: string, content: string, sceneNumber: number): SceneHeader {
  const sceneHeader: SceneHeader = {
    sceneNumber: inferSceneNumber(header, sceneNumber),
    sceneType: inferSceneType(header),
    location: inferLocation(header),
    timeOfDay: inferTimeOfDay(header),
    pageCount: estimateScenePageCount(content),
    storyDay: inferStoryDay(header),
    rawHeader: header,
  };

  const errors = validateSceneHeader(sceneHeader);
  if (errors.length > 0 && sceneHeader.location === 'موقع غير محدد') {
    sceneHeader.location = `مشهد ${sceneHeader.sceneNumber}`;
  }

  return sceneHeader;
}

function buildScene(
  headerLines: string[],
  contentLines: string[],
  fallbackSceneNumber: number
): ParsedScene | null {
  const header = headerLines.map(normalizeLine).filter(Boolean).join(' | ');
  const content = contentLines.join('\n').trim();

  if (!header || !content) {
    return null;
  }

  const headerData = buildHeaderData(header, content, fallbackSceneNumber);
  const warnings = validateSceneHeader(headerData);

  return {
    header,
    content,
    headerData,
    warnings,
  };
}

export function parseScreenplay(
  scriptText: string,
  title = 'مشروع تفكيك سينمائي'
): ParsedScreenplay {
  const lines = scriptText.split(/\r?\n/);
  const scenes: ParsedScene[] = [];
  const warnings: string[] = [];

  let currentHeaderLines: string[] = [];
  let currentContentLines: string[] = [];
  let hasStartedScene = false;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const trimmed = normalizeLine(rawLine);

    if (looksLikeSceneHeading(trimmed)) {
      if (hasStartedScene) {
        const scene = buildScene(
          currentHeaderLines,
          currentContentLines,
          scenes.length + 1
        );
        if (scene) {
          scenes.push(scene);
          warnings.push(...scene.warnings);
        }
      }

      currentHeaderLines = [trimmed];
      currentContentLines = [];
      hasStartedScene = true;

      const nextLine = lines[index + 1];
      const normalizedNextLine = nextLine ? normalizeLine(nextLine) : '';

      if (
        normalizedNextLine &&
        looksLikeHeaderContinuation(normalizedNextLine, trimmed)
      ) {
        currentHeaderLines.push(normalizedNextLine);
        index += 1;
      }

      continue;
    }

    if (!hasStartedScene) {
      continue;
    }

    currentContentLines.push(rawLine.trimEnd());
  }

  if (hasStartedScene) {
    const scene = buildScene(currentHeaderLines, currentContentLines, scenes.length + 1);
    if (scene) {
      scenes.push(scene);
      warnings.push(...scene.warnings);
    }
  }

  return {
    title,
    scenes,
    totalPages: scenes.reduce((sum, scene) => sum + scene.headerData.pageCount, 0),
    warnings,
  };
}
