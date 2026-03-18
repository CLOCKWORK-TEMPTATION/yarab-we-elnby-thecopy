export interface ResponsiveConfig {
  cardWidth: number
  cardHeight: number
  cardPositions: Array<{ top: string; left: string; rotation: number }>
  scale: number
  surroundingGroups: Array<Array<{ top: string; left: string; width: string; height: string }>>
}

const HEADER_HEIGHT = 96
const TOP_SAFE_AREA = HEADER_HEIGHT + 24
const BOTTOM_SAFE_AREA = 80
const BOTTOM_MARGIN = BOTTOM_SAFE_AREA + 50

class HeroConfiguration {
  private static instance: HeroConfiguration
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
    // Private constructor to prevent direct instantiation (Singleton pattern)
  }
  public static getInstance(): HeroConfiguration {
    if (!HeroConfiguration.instance) {
      HeroConfiguration.instance = new HeroConfiguration()
    }
    return HeroConfiguration.instance
  }

  public getResponsiveValues(width: number): ResponsiveConfig {
    const isDesktop = width >= 1280
    const isTablet = width >= 768 && width < 1280
    const isMobile = width < 768

    let cardWidth: number
    let cardHeight: number
    let scale: number
    let positions: Array<{ left: string; top: string; rotation: number }>

    if (isDesktop) {
      // Desktop: 7 cards - تكتل مضغوط مع دوران بسيط
      cardWidth = 190
      cardHeight = 275
      scale = 0.82
      positions = [
        { left: "30%", top: "34%", rotation: -6 }, // back-left
        { left: "36%", top: "45%", rotation: -3 }, // left
        { left: "43%", top: "56%", rotation: -1 }, // inner-left
        { left: "50%", top: "67%", rotation: 0 },  // center/front (lowest)
        { left: "57%", top: "56%", rotation: 1 },  // inner-right
        { left: "64%", top: "45%", rotation: 3 },  // right
        { left: "70%", top: "34%", rotation: 6 },  // back-right
      ]
    } else if (isTablet) {
      // Tablet: نفس الـ 7 كروت لكن بتوزيع أضيق
      cardWidth = 150
      cardHeight = 215
      scale = 0.8
      positions = [
        { left: "28%", top: "30%", rotation: -6 },
        { left: "34%", top: "36%", rotation: -3 },
        { left: "41%", top: "46%", rotation: -1 },
        { left: "50%", top: "58%", rotation: 0 },
        { left: "59%", top: "46%", rotation: 1 },
        { left: "66%", top: "36%", rotation: 3 },
        { left: "72%", top: "30%", rotation: 6 },
      ]
    } else {
      // Mobile: 7 كروت أيضًا مع أحجام أصغر
      cardWidth = 110
      cardHeight = 165
      scale = 0.78
      positions = [
        { left: "22%", top: "34%", rotation: -8 },
        { left: "32%", top: "42%", rotation: -4 },
        { left: "40%", top: "52%", rotation: -2 },
        { left: "50%", top: "64%", rotation: 0 },
        { left: "60%", top: "52%", rotation: 2 },
        { left: "68%", top: "42%", rotation: 4 },
        { left: "78%", top: "34%", rotation: 8 },
      ]
    }

    const cardPositions = positions.map((pos) => ({
      top: pos.top,
      left: pos.left,
      rotation: pos.rotation,
    }))

    return {
      cardWidth,
      cardHeight,
      scale,
      cardPositions,
      surroundingGroups: [
        [
          { top: "5%", left: "5%", width: "18%", height: "25%" },
          { top: "5%", left: "77%", width: "18%", height: "25%" },
          { top: "15%", left: "28%", width: "12%", height: "18%" },
          { top: "15%", left: "60%", width: "12%", height: "18%" },
        ],
        [
          { top: "40%", left: "2%", width: "16%", height: "22%" },
          { top: "40%", left: "82%", width: "16%", height: "22%" },
          { top: "35%", left: "22%", width: "10%", height: "14%" },
          { top: "35%", left: "68%", width: "10%", height: "14%" },
        ],
        [
          { top: "75%", left: "5%", width: "20%", height: "20%" },
          { top: "75%", left: "75%", width: "20%", height: "20%" },
          { top: "80%", left: "30%", width: "15%", height: "15%" },
          { top: "80%", left: "55%", width: "15%", height: "15%" },
        ],
      ],
    }
  }
}

export const heroConfig = HeroConfiguration.getInstance()