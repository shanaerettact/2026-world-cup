export interface Match {
  id: number
  homeTeam: string
  awayTeam: string
  homeFlag: string
  awayFlag: string
  kickoff: string
  status: 'upcoming' | 'live' | 'finished'
  round?: string
  venue?: string
  /** i18n key for home team (e.g. schedule.teams.MEX) */
  homeTeamKey?: string
  /** i18n key for away team */
  awayTeamKey?: string
  /** i18n key for round (e.g. schedule.round.groupA) */
  roundKey?: string
  /** i18n key for venue (e.g. schedule.venue.mexicoCity) */
  venueKey?: string
  score?: {
    home: number
    away: number
  }
  odds: {
    home: number
    draw: number
    away: number
  }
  markets?: {
    handicap: {
      home: { line: string; odds: number }
      away: { line: string; odds: number }
    }
    overUnder: {
      over: { line: string; odds: number }
      under: { line: string; odds: number }
    }
    oddEven: {
      odd: number
      even: number
    }
  }
}

/** 世足賽程表隊伍代碼 → 旗幟；隊名由 i18n schedule.teams.* 提供 */
const TEAM_FLAG: Record<string, string> = {
  MEX: '🇲🇽', RSA: '🇿🇦', KOR: '🇰🇷', CAN: '🇨🇦', USA: '🇺🇸', PAR: '🇵🇾', QAT: '🇶🇦', SUI: '🇨🇭', BRA: '🇧🇷',
  MAR: '🇲🇦', HAI: '🇭🇹', SCO: '🏴', AUS: '🇦🇺', GER: '🇩🇪', CUW: '🇨🇼', NED: '🇳🇱', JPN: '🇯🇵', CIV: '🇨🇮',
  ECU: '🇪🇨', TUN: '🇹🇳', ESP: '🇪🇸', CPV: '🇨🇻', BEL: '🇧🇪', EGY: '🇪🇬', KSA: '🇸🇦', URU: '🇺🇾', IRN: '🇮🇷',
  NZL: '🇳🇿', FRA: '🇫🇷', SEN: '🇸🇳', NOR: '🇳🇴', ARG: '🇦🇷', ALG: '🇩🇿', AUT: '🇦🇹', JOR: '🇯🇴', POR: '🇵🇹',
  ENG: '🏴', CRO: '🇭🇷', GHA: '🇬🇭', PAN: '🇵🇦', UZB: '🇺🇿', COL: '🇨🇴',
}

/** 依隊名比對 FIFA 代碼或目前語系 `schedule.teams.*` 譯名，回傳 TEAM_FLAG emoji */
export function flagEmojiForTeamTitle(
  teamTitle: string,
  t: (key: string) => string
): string | undefined {
  const raw = teamTitle.trim()
  if (!raw) return undefined
  const upper = raw.toUpperCase()
  for (const code of Object.keys(TEAM_FLAG)) {
    if (upper === code.toUpperCase()) return TEAM_FLAG[code]
    const localized = t(`schedule.teams.${code}`)
    if (localized && raw === localized) return TEAM_FLAG[code]
  }
  return undefined
}

function teamFromCode(code: string): { name: string; flag: string; key: string } {
  const c = code.split('/')[0].trim()
  const flag = TEAM_FLAG[c] ?? '🏳️'
  const key = TEAM_FLAG[c] ? `schedule.teams.${c}` : 'schedule.teams._tbd'
  return { name: c, flag, key }
}
function defaultOdds(): Pick<Match, 'odds' | 'markets'> {
  return {
    odds: { home: 2.10, draw: 3.40, away: 3.00 },
    markets: {
      handicap: { home: { line: '-0.5', odds: 2.55 }, away: { line: '+0.5', odds: 1.55 } },
      overUnder: { over: { line: '2.5', odds: 1.90 }, under: { line: '2.5', odds: 1.90 } },
      oddEven: { odd: 1.87, even: 1.93 }
    }
  }
}

/** 2026 世足賽程 [日期, 時間, 主隊代碼, 客隊代碼, roundKey, venueKey]；階段/場館文案由 i18n schedule.round / schedule.venue 提供 */
const SCHEDULE_2026_RAW: [string, string, string, string, string, string][] = [
  ['2026-06-12', '03:00', 'MEX', 'RSA', 'schedule.round.groupA', 'schedule.venue.mexicoCity'],
  ['2026-06-12', '10:00', 'KOR', 'DEN/MKD/CZE/IRL', 'schedule.round.groupA', 'schedule.venue.guadalajara'],
  ['2026-06-13', '03:00', 'CAN', 'ITA/NIR/WAL/BIH', 'schedule.round.groupB', 'schedule.venue.toronto'],
  ['2026-06-13', '09:00', 'USA', 'PAR', 'schedule.round.groupD', 'schedule.venue.losAngeles'],
  ['2026-06-14', '03:00', 'QAT', 'SUI', 'schedule.round.groupB', 'schedule.venue.sanFrancisco'],
  ['2026-06-14', '06:00', 'BRA', 'MAR', 'schedule.round.groupC', 'schedule.venue.newYorkNewJersey'],
  ['2026-06-14', '09:00', 'HAI', 'SCO', 'schedule.round.groupC', 'schedule.venue.boston'],
  ['2026-06-14', '12:00', 'AUS', 'TUR/ROU/SVK/KOS', 'schedule.round.groupD', 'schedule.venue.vancouver'],
  ['2026-06-15', '01:00', 'GER', 'CUW', 'schedule.round.groupE', 'schedule.venue.houston'],
  ['2026-06-15', '04:00', 'NED', 'JPN', 'schedule.round.groupF', 'schedule.venue.dallas'],
  ['2026-06-15', '07:00', 'CIV', 'ECU', 'schedule.round.groupE', 'schedule.venue.philadelphia'],
  ['2026-06-15', '10:00', 'UKR/SWE/POL/ALB', 'TUN', 'schedule.round.groupF', 'schedule.venue.monterrey'],
  ['2026-06-16', '00:00', 'ESP', 'CPV', 'schedule.round.groupH', 'schedule.venue.atlanta'],
  ['2026-06-16', '03:00', 'BEL', 'EGY', 'schedule.round.groupG', 'schedule.venue.seattle'],
  ['2026-06-16', '06:00', 'KSA', 'URU', 'schedule.round.groupH', 'schedule.venue.miami'],
  ['2026-06-16', '09:00', 'IRN', 'NZL', 'schedule.round.groupG', 'schedule.venue.losAngeles'],
  ['2026-06-17', '03:00', 'FRA', 'SEN', 'schedule.round.groupI', 'schedule.venue.newYorkNewJersey'],
  ['2026-06-17', '06:00', 'BOL/SUR/IRQ', 'NOR', 'schedule.round.groupI', 'schedule.venue.boston'],
  ['2026-06-17', '09:00', 'ARG', 'ALG', 'schedule.round.groupJ', 'schedule.venue.kansasCity'],
  ['2026-06-17', '12:00', 'AUT', 'JOR', 'schedule.round.groupJ', 'schedule.venue.sanFrancisco'],
  ['2026-06-18', '01:00', 'POR', 'NCL/JAM/COD', 'schedule.round.groupK', 'schedule.venue.houston'],
  ['2026-06-18', '04:00', 'ENG', 'CRO', 'schedule.round.groupL', 'schedule.venue.dallas'],
  ['2026-06-18', '07:00', 'GHA', 'PAN', 'schedule.round.groupL', 'schedule.venue.toronto'],
  ['2026-06-18', '10:00', 'UZB', 'COL', 'schedule.round.groupK', 'schedule.venue.mexicoCity'],
  ['2026-06-19', '00:00', 'DEN/MKD/CZE/IRL', 'RSA', 'schedule.round.groupA', 'schedule.venue.atlanta'],
  ['2026-06-19', '03:00', 'SUI', 'ITA/NIR/WAL/BIH', 'schedule.round.groupB', 'schedule.venue.losAngeles'],
  ['2026-06-19', '06:00', 'CAN', 'QAT', 'schedule.round.groupB', 'schedule.venue.vancouver'],
  ['2026-06-19', '09:00', 'MEX', 'KOR', 'schedule.round.groupA', 'schedule.venue.guadalajara'],
  ['2026-06-20', '03:00', 'USA', 'AUS', 'schedule.round.groupD', 'schedule.venue.seattle'],
  ['2026-06-20', '06:00', 'SCO', 'MAR', 'schedule.round.groupC', 'schedule.venue.boston'],
  ['2026-06-20', '09:00', 'BRA', 'HAI', 'schedule.round.groupC', 'schedule.venue.philadelphia'],
  ['2026-06-20', '12:00', 'TUR/ROU/SVK/KOS', 'PAR', 'schedule.round.groupD', 'schedule.venue.sanFrancisco'],
  ['2026-06-21', '01:00', 'NED', 'UKR/SWE/POL/ALB', 'schedule.round.groupF', 'schedule.venue.houston'],
  ['2026-06-21', '04:00', 'GER', 'CIV', 'schedule.round.groupE', 'schedule.venue.toronto'],
  ['2026-06-21', '08:00', 'ECU', 'CUW', 'schedule.round.groupE', 'schedule.venue.kansasCity'],
  ['2026-06-21', '12:00', 'TUN', 'JPN', 'schedule.round.groupF', 'schedule.venue.monterrey'],
  ['2026-06-22', '00:00', 'ESP', 'KSA', 'schedule.round.groupH', 'schedule.venue.atlanta'],
  ['2026-06-22', '03:00', 'BEL', 'IRN', 'schedule.round.groupG', 'schedule.venue.losAngeles'],
  ['2026-06-22', '06:00', 'URU', 'CPV', 'schedule.round.groupH', 'schedule.venue.miami'],
  ['2026-06-22', '09:00', 'NZL', 'EGY', 'schedule.round.groupG', 'schedule.venue.vancouver'],
  ['2026-06-23', '01:00', 'ARG', 'AUT', 'schedule.round.groupJ', 'schedule.venue.dallas'],
  ['2026-06-23', '05:00', 'FRA', 'BOL/SUR/IRQ', 'schedule.round.groupI', 'schedule.venue.philadelphia'],
  ['2026-06-23', '08:00', 'NOR', 'SEN', 'schedule.round.groupI', 'schedule.venue.newYorkNewJersey'],
  ['2026-06-23', '11:00', 'JOR', 'ALG', 'schedule.round.groupJ', 'schedule.venue.sanFrancisco'],
  ['2026-06-24', '01:00', 'POR', 'UZB', 'schedule.round.groupK', 'schedule.venue.houston'],
  ['2026-06-24', '04:00', 'ENG', 'GHA', 'schedule.round.groupL', 'schedule.venue.boston'],
  ['2026-06-24', '07:00', 'PAN', 'CRO', 'schedule.round.groupL', 'schedule.venue.toronto'],
  ['2026-06-24', '10:00', 'COL', 'NCL/JAM/COD', 'schedule.round.groupK', 'schedule.venue.guadalajara'],
  ['2026-06-25', '03:00', 'ITA/NIR/WAL/BIH', 'QAT', 'schedule.round.groupB', 'schedule.venue.seattle'],
  ['2026-06-25', '03:00', 'SUI', 'CAN', 'schedule.round.groupB', 'schedule.venue.vancouver'],
  ['2026-06-25', '06:00', 'MAR', 'HAI', 'schedule.round.groupC', 'schedule.venue.atlanta'],
  ['2026-06-25', '06:00', 'SCO', 'BRA', 'schedule.round.groupC', 'schedule.venue.miami'],
  ['2026-06-25', '09:00', 'RSA', 'KOR', 'schedule.round.groupA', 'schedule.venue.monterrey'],
  ['2026-06-25', '09:00', 'DEN/MKD/CZE/IRL', 'MEX', 'schedule.round.groupA', 'schedule.venue.mexicoCity'],
  ['2026-06-26', '04:00', 'CUW', 'CIV', 'schedule.round.groupE', 'schedule.venue.philadelphia'],
  ['2026-06-26', '04:00', 'ECU', 'GER', 'schedule.round.groupE', 'schedule.venue.newYorkNewJersey'],
  ['2026-06-26', '07:00', 'TUN', 'NED', 'schedule.round.groupF', 'schedule.venue.kansasCity'],
  ['2026-06-26', '07:00', 'JPN', 'UKR/SWE/POL/ALB', 'schedule.round.groupF', 'schedule.venue.dallas'],
  ['2026-06-26', '10:00', 'PAR', 'AUS', 'schedule.round.groupD', 'schedule.venue.sanFrancisco'],
  ['2026-06-26', '10:00', 'TUR/ROU/SVK/KOS', 'USA', 'schedule.round.groupD', 'schedule.venue.losAngeles'],
  ['2026-06-27', '03:00', 'SEN', 'BOL/SUR/IRQ', 'schedule.round.groupI', 'schedule.venue.toronto'],
  ['2026-06-27', '03:00', 'NOR', 'FRA', 'schedule.round.groupI', 'schedule.venue.boston'],
  ['2026-06-27', '08:00', 'URU', 'ESP', 'schedule.round.groupH', 'schedule.venue.guadalajara'],
  ['2026-06-27', '08:00', 'CPV', 'KSA', 'schedule.round.groupH', 'schedule.venue.houston'],
  ['2026-06-27', '11:00', 'NZL', 'BEL', 'schedule.round.groupG', 'schedule.venue.vancouver'],
  ['2026-06-27', '11:00', 'EGY', 'IRN', 'schedule.round.groupG', 'schedule.venue.seattle'],
  ['2026-06-28', '05:00', 'PAN', 'ENG', 'schedule.round.groupL', 'schedule.venue.newYorkNewJersey'],
  ['2026-06-28', '05:00', 'CRO', 'GHA', 'schedule.round.groupL', 'schedule.venue.philadelphia'],
  ['2026-06-28', '07:30', 'NCL/JAM/COD', 'UZB', 'schedule.round.groupK', 'schedule.venue.atlanta'],
  ['2026-06-28', '07:30', 'COL', 'POR', 'schedule.round.groupK', 'schedule.venue.miami'],
  ['2026-06-28', '10:00', 'ALG', 'AUT', 'schedule.round.groupJ', 'schedule.venue.kansasCity'],
  ['2026-06-28', '10:00', 'JOR', 'ARG', 'schedule.round.groupJ', 'schedule.venue.dallas'],
  ['2026-06-29', '03:00', '2A', '2B', 'schedule.round.round32', 'schedule.venue.losAngeles'],
  ['2026-06-30', '01:00', '1C', '2F', 'schedule.round.round32', 'schedule.venue.houston'],
  ['2026-06-30', '04:30', '1E', '3ABCDF', 'schedule.round.round32', 'schedule.venue.boston'],
  ['2026-06-30', '09:00', '1F', '2C', 'schedule.round.round32', 'schedule.venue.monterrey'],
  ['2026-07-01', '01:00', '2E', '2I', 'schedule.round.round32', 'schedule.venue.dallas'],
  ['2026-07-01', '05:00', '1I', '3CDFGH', 'schedule.round.round32', 'schedule.venue.newYorkNewJersey'],
  ['2026-07-01', '09:00', '1A', '3CEFHI', 'schedule.round.round32', 'schedule.venue.mexicoCity'],
  ['2026-07-02', '00:00', '1L', '3EHIJK', 'schedule.round.round32', 'schedule.venue.atlanta'],
  ['2026-07-02', '04:00', '1G', '3AEHIJ', 'schedule.round.round32', 'schedule.venue.seattle'],
  ['2026-07-02', '08:00', '1D', '3BEFIJ', 'schedule.round.round32', 'schedule.venue.sanFrancisco'],
  ['2026-07-03', '03:00', '1H', '2J', 'schedule.round.round32', 'schedule.venue.losAngeles'],
  ['2026-07-03', '07:00', '2K', '2L', 'schedule.round.round32', 'schedule.venue.toronto'],
  ['2026-07-03', '11:00', '1B', '3EFGIJ', 'schedule.round.round32', 'schedule.venue.vancouver'],
  ['2026-07-04', '02:00', '2D', '2G', 'schedule.round.round32', 'schedule.venue.dallas'],
  ['2026-07-04', '06:00', '1J', '2H', 'schedule.round.round32', 'schedule.venue.miami'],
  ['2026-07-04', '09:30', '1K', '3DEIJL', 'schedule.round.round32', 'schedule.venue.kansasCity'],
  ['2026-07-05', '01:00', 'W73', 'W75', 'schedule.round.round16', 'schedule.venue.houston'],
  ['2026-07-05', '05:00', 'W74', 'W77', 'schedule.round.round16', 'schedule.venue.philadelphia'],
  ['2026-07-06', '04:00', 'W76', 'W78', 'schedule.round.round16', 'schedule.venue.newYorkNewJersey'],
  ['2026-07-06', '08:00', 'W79', 'W80', 'schedule.round.round16', 'schedule.venue.mexicoCity'],
  ['2026-07-07', '03:00', 'W83', 'W84', 'schedule.round.round16', 'schedule.venue.dallas'],
  ['2026-07-07', '08:00', 'W81', 'W82', 'schedule.round.round16', 'schedule.venue.seattle'],
  ['2026-07-08', '00:00', 'W86', 'W88', 'schedule.round.round16', 'schedule.venue.atlanta'],
  ['2026-07-08', '04:00', 'W85', 'W87', 'schedule.round.round16', 'schedule.venue.vancouver'],
  ['2026-07-10', '04:00', 'W89', 'W90', 'schedule.round.quarter', 'schedule.venue.boston'],
  ['2026-07-11', '03:00', 'W93', 'W94', 'schedule.round.quarter', 'schedule.venue.losAngeles'],
  ['2026-07-12', '05:00', 'W91', 'W92', 'schedule.round.quarter', 'schedule.venue.miami'],
  ['2026-07-12', '09:00', 'W95', 'W96', 'schedule.round.quarter', 'schedule.venue.kansasCity'],
  ['2026-07-15', '03:00', 'W97', 'W98', 'schedule.round.semifinal', 'schedule.venue.dallas'],
  ['2026-07-16', '03:00', 'W99', 'W100', 'schedule.round.semifinal', 'schedule.venue.atlanta'],
  ['2026-07-19', '05:00', 'RU101', 'RU102', 'schedule.round.thirdPlace', 'schedule.venue.miami'],
  ['2026-07-20', '03:00', 'W101', 'W102', 'schedule.round.final', 'schedule.venue.newYorkNewJersey'],
]

const mockMatches: Match[] = SCHEDULE_2026_RAW.map(([date, time, homeCode, awayCode, roundKey, venueKey], i) => {
  const home = teamFromCode(homeCode)
  const away = teamFromCode(awayCode)
  return {
    id: i + 1,
    homeTeam: home.name,
    awayTeam: away.name,
    homeFlag: home.flag,
    awayFlag: away.flag,
    kickoff: `${date} ${time}`,
    status: 'upcoming' as const,
    roundKey,
    venueKey,
    homeTeamKey: home.key,
    awayTeamKey: away.key,
    ...defaultOdds()
  }
})

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const matchApi = {
  async getMatches(): Promise<Match[]> {
    await delay(800)
    return mockMatches
  },

  async getMatch(id: number): Promise<Match | undefined> {
    await delay(500)
    return mockMatches.find(m => m.id === id)
  },

  async getLiveMatches(): Promise<Match[]> {
    await delay(600)
    return mockMatches.filter(m => m.status === 'live')
  },

  async getUpcomingMatches(): Promise<Match[]> {
    await delay(600)
    return mockMatches.filter(m => m.status === 'upcoming')
  }
}
