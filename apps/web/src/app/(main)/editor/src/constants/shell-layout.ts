/**
 * @module constants/shell-layout
 * @description ثوابت غلاف المحرر المرجعي على سطح المكتب.
 *   هذه القيم تضبط مواضع الشريط الجانبي، الشريط العائم، ومسرح التخطيط،
 *   بحيث يظل التوزيع ثابتًا عند تغيّر عرض النافذة.
 */

export const EDITOR_SHELL_STAGE_WIDTH_PX = 1820;
export const EDITOR_SHELL_HEADER_HEIGHT_PX = 60;
export const EDITOR_SHELL_SIDEBAR_WIDTH_PX = 288;
export const EDITOR_SHELL_SIDEBAR_TOP_PX = 84;
export const EDITOR_SHELL_SIDEBAR_RIGHT_PX = 24;
export const EDITOR_SHELL_SIDEBAR_BOTTOM_PX = 24;
export const EDITOR_SHELL_DOCK_TOP_PX = 84;
export const EDITOR_SHELL_DOCK_HEIGHT_PX = 64;
export const EDITOR_SHELL_DOCK_TO_CANVAS_GAP_PX = 24;
export const EDITOR_CANVAS_WIDTH_PX = 850;

export const EDITOR_CANVAS_TOP_OFFSET_PX =
  EDITOR_SHELL_DOCK_TOP_PX -
  EDITOR_SHELL_HEADER_HEIGHT_PX +
  EDITOR_SHELL_DOCK_HEIGHT_PX +
  EDITOR_SHELL_DOCK_TO_CANVAS_GAP_PX;

export const EDITOR_CANVAS_LEFT_PADDING_PX = 96;

export const EDITOR_CANVAS_RIGHT_PADDING_PX =
  EDITOR_SHELL_SIDEBAR_WIDTH_PX +
  EDITOR_SHELL_SIDEBAR_RIGHT_PX +
  48;
