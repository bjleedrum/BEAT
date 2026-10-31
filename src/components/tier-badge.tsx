/** 티어 배지: 티어 색 육각형 + 단계 숫자 */
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { F } from '@/constants/beat-theme';
import { tierIndex, TIERS } from '@/lib/league';

const hex = (cx: number, cy: number, r: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    return `${k ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ') + 'Z';

export function TierBadge({ tier, size = 48, dim }: { tier: string; size?: number; dim?: boolean }) {
  const i = tierIndex(tier), t = TIERS[i];
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" opacity={dim ? 0.3 : 1}>
      <Path d={hex(24, 24, 22)} fill={t.color} />
      <Path d={hex(24, 24, 16)} fill="#ffffff" opacity={0.22} />
      <SvgText x={24} y={31} textAnchor="middle" fontSize={20} fontFamily={F.display} fill="#ffffff">{i + 1}</SvgText>
    </Svg>
  );
}
