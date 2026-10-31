/** BEAT 색상 토큰 (웹 버전과 같은 값). 연습패드 회색 + 코발트 포인트, 판정 색은 피드백에만 */
import { useColorScheme } from 'react-native';

const light = {
  bg: '#F2F3F6', surface: '#FFFFFF', surface2: '#E9EBF0', ink: '#151922', muted: '#666D7C', line: '#DADDE4',
  accent: '#2C47D8', accentInk: '#FFFFFF', accentSoft: '#E3E7FB',
  perfect: '#159A55', good: '#6FA81E', off: '#D98A0B', miss: '#D2443A',
};
const dark: typeof light = {
  bg: '#0E1015', surface: '#171A21', surface2: '#22262F', ink: '#ECEEF3', muted: '#949AA8', line: '#2B303B',
  accent: '#7088FF', accentInk: '#0E1015', accentSoft: '#232B4D',
  perfect: '#34C27A', good: '#9ACB45', off: '#F0A93A', miss: '#F06A5F',
};
export const BeatColors = { light, dark };
export type BeatPalette = typeof light;

export function useBeat(): BeatPalette {
  return useColorScheme() === 'dark' ? dark : light;
}


/**
 * 글꼴 (프로토타입과 같음). 안드로이드는 fontWeight로 굵기를 고르지 못해서 굵기마다 이름을 따로 쓴다.
 * display: 제목용 Black Han Sans / body: IBM Plex Sans KR / mono: JetBrains Mono
 */
export const F = {
  display: 'BlackHanSans_400Regular',
  body: 'IBMPlexSansKR_400Regular',
  medium: 'IBMPlexSansKR_500Medium',
  semi: 'IBMPlexSansKR_600SemiBold',
  bold: 'IBMPlexSansKR_700Bold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_700Bold',
} as const;
