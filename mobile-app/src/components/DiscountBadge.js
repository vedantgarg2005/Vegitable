import React from 'react';
import Svg, { Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

// W=46, H=58 — tag body + scalloped bottom
const W = 38;
const BODY_H = 34;
const SCALLOP_H = 9;
const TOTAL_H = BODY_H + SCALLOP_H;
const R = 7; // corner radius
const HOLE_R = 3.5;
const SCALLOPS = 5;
const SW = W / SCALLOPS; // each scallop width

// Scalloped bottom: arcs curving downward from body bottom
function scallopPath() {
  let d = `M 0 ${BODY_H}`;
  for (let i = 0; i < SCALLOPS; i++) {
    const x0 = SW * i;
    const x1 = SW * (i + 1);
    const cx = (x0 + x1) / 2;
    d += ` Q ${cx} ${BODY_H + SCALLOP_H} ${x1} ${BODY_H}`;
  }
  // close: right side, top rounded rect, left side
  d += ` V 0`; // won't use — build full path below
  return d;
}

// Full combined path: rounded-top rectangle + scalloped bottom
function tagPath() {
  let d = `M ${R} 0`;
  d += ` H ${W - R}`;
  d += ` Q ${W} 0 ${W} ${R}`;
  d += ` V ${BODY_H}`;
  // scalloped bottom right→left
  for (let i = SCALLOPS; i > 0; i--) {
    const x0 = SW * i;
    const x1 = SW * (i - 1);
    const cx = (x0 + x1) / 2;
    d += ` Q ${cx} ${BODY_H + SCALLOP_H} ${x1} ${BODY_H}`;
  }
  d += ` V ${R}`;
  d += ` Q 0 0 ${R} 0 Z`;
  return d;
}

export default function DiscountBadge({ discount }) {
  return (
    <Svg width={W} height={TOTAL_H}>
      <Defs>
        <LinearGradient id="tagGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E7D32" />
          <Stop offset="1" stopColor="#1A4D2E" />
        </LinearGradient>
      </Defs>

      {/* Drop shadow offset */}
      <Path d={tagPath()} fill="rgba(0,0,0,0.2)" x={1.5} y={2} />

      {/* Tag body */}
      <Path d={tagPath()} fill="url(#tagGrad)" />

      {/* Top shine */}
      <Path
        d={`M ${R} 0 H ${W - R} Q ${W} 0 ${W} ${R} V ${BODY_H * 0.35} H 0 V ${R} Q 0 0 ${R} 0 Z`}
        fill="rgba(255,255,255,0.18)"
      />

      {/* String hole */}
      <Circle cx={W / 2} cy={7} r={HOLE_R} fill="rgba(0,0,0,0.3)" />
      <Circle cx={W / 2} cy={7} r={HOLE_R - 1.5} fill="#1A4D2E" />

      {/* Discount % */}
      <SvgText
        x={(W / 2) - 5}
        y={21}
        fontSize={11}
        fontWeight="900"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {discount}%
      </SvgText>

      {/* OFF */}
      <SvgText
        x={W / 2}
        y={30}
        fontSize={8}
        fontWeight="800"
        fill="rgba(255,255,255,0.92)"
        textAnchor="middle"
        letterSpacing={1.5}
      >
        OFF
      </SvgText>
    </Svg>
  );
}
