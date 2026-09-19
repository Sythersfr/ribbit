import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';

const CAM =
  'https://cdn.shopify.com/s/files/1/0910/0505/9106/files/lumen-cam-product.jpg?v=1789841698';
const GUARD =
  'https://cdn.shopify.com/s/files/1/0910/0505/9106/files/lumen-guard-pro-product.jpg?v=1789841699';

const C = {
  bg: '#f7f8f5',
  ink: '#0b110d',
  muted: '#667069',
  green: '#16a34a',
  panel: '#ffffff',
  line: 'rgba(11,17,13,.10)',
};

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const type: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: C.ink,
};

type IconName = 'user' | 'checkout' | 'repeat' | 'key' | 'trend';

const IconGlyph = ({name}: {name: IconName}) => {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'user') {
    return (
      <svg viewBox="0 0 24 24" width="48" height="48" {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5.5 20c.7-4 3-6 6.5-6s5.8 2 6.5 6" />
        <circle cx="12" cy="12" r="10" opacity=".25" />
      </svg>
    );
  }
  if (name === 'checkout') {
    return (
      <svg viewBox="0 0 24 24" width="48" height="48" {...common}>
        <path d="M3 5h2l2.2 10h10.9l2-7H7" />
        <circle cx="9" cy="19" r="1.5" />
        <circle cx="17" cy="19" r="1.5" />
      </svg>
    );
  }
  if (name === 'repeat') {
    return (
      <svg viewBox="0 0 24 24" width="48" height="48" {...common}>
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a3 3 0 013-3h15" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v2a3 3 0 01-3 3H3" />
      </svg>
    );
  }
  if (name === 'key') {
    return (
      <svg viewBox="0 0 24 24" width="48" height="48" {...common}>
        <circle cx="8" cy="15" r="4.5" />
        <path d="M11.5 12L21 2.5M17 6.5l2 2M14.5 9l2 2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="48" height="48" {...common}>
      <path d="M3 20h18" opacity=".3" />
      <path d="M5 16l5-5 4 3 6-8" />
      <path d="M16 6h4v4" />
    </svg>
  );
};

const GlowIcon = ({
  name,
  size = 88,
  delay = 0,
}: {
  name: IconName;
  size?: number;
  delay?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    durationInFrames: 24,
    config: {damping: 200},
  });
  const pulse = interpolate(frame, [0, 45, 90], [0.35, 0.7, 0.35], clamp);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        display: 'grid',
        placeItems: 'center',
        color: C.green,
        background: 'rgba(22,163,74,.06)',
        border: '1px solid rgba(22,163,74,.25)',
        boxShadow: `0 0 ${30 + pulse * 34}px rgba(22,163,74,${pulse * 0.55})`,
        opacity: enter,
        transform: `scale(${0.72 + enter * 0.28})`,
      }}
    >
      <IconGlyph name={name} />
    </div>
  );
};

const Backdrop = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(circle at 72% 115%, rgba(22,163,74,.08), transparent 42%), #f7f8f5',
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        top: 92,
        height: 1,
        background: C.line,
      }}
    />
    <div
      style={{
        position: 'absolute',
        left: 88,
        right: 88,
        bottom: 80,
        height: 1,
        background: C.line,
      }}
    />
  </AbsoluteFill>
);

const Header = ({step}: {step: string}) => (
  <>
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        fontWeight: 770,
        fontSize: 28,
        letterSpacing: '-0.035em',
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          background: C.green,
          boxShadow: '0 0 24px rgba(22,163,74,.45)',
        }}
      />
      Ribbit
    </div>
    <div
      style={{
        position: 'absolute',
        right: 96,
        top: 43,
        fontSize: 18,
        fontWeight: 650,
        color: C.muted,
        letterSpacing: '.08em',
      }}
    >
      {step}
    </div>
  </>
);

const OutcomeLockup = () => (
  <div
    style={{
      position: 'absolute',
      right: 96,
      bottom: 29,
      display: 'flex',
      gap: 15,
      alignItems: 'center',
      fontSize: 21,
      fontWeight: 700,
    }}
  >
    <span style={{color: C.muted}}>CAC = SAME</span>
    <span style={{color: C.green}}>→</span>
    <span>LTV ↑</span>
  </div>
);

const Reveal = ({
  children,
  delay = 0,
  y = 32,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame: frame - delay,
    fps,
    durationInFrames: 25,
    config: {damping: 200},
  });
  return (
    <div
      style={{
        opacity: enter,
        transform: `translateY(${(1 - enter) * y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Kicker = ({children}: {children: ReactNode}) => (
  <div
    style={{
      color: C.green,
      textTransform: 'uppercase',
      letterSpacing: '.16em',
      fontWeight: 750,
      fontSize: 18,
      marginBottom: 24,
    }}
  >
    {children}
  </div>
);

const AcquisitionScene = () => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [38, 96], [0, 1], clamp);
  return (
    <AbsoluteFill style={type}>
      <Backdrop />
      <Header step="01 / THE CUSTOMER" />
      <OutcomeLockup />
      <div style={{position: 'absolute', left: 180, top: 265, width: 1350}}>
        <Reveal>
          <Kicker>Acquisition</Kicker>
          <div
            style={{
              fontSize: 102,
              lineHeight: 1.02,
              letterSpacing: '-.065em',
              fontWeight: 800,
            }}
          >
            You paid for the customer.
          </div>
        </Reveal>
        <Reveal delay={22}>
          <div
            style={{
              marginTop: 35,
              fontSize: 29,
              color: C.muted,
              maxWidth: 900,
              lineHeight: 1.4,
            }}
          >
            CAC is already spent.
          </div>
        </Reveal>
      </div>
      <div style={{position: 'absolute', right: 255, top: 345}}>
        <GlowIcon name="user" size={170} delay={12} />
        <div
          style={{
            position: 'absolute',
            left: -360,
            top: 84,
            width: 360 * line,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.green})`,
            transformOrigin: 'right',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const CeilingScene = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [30, 100], [0, 1], clamp);
  return (
    <AbsoluteFill style={type}>
      <Backdrop />
      <Header step="02 / THE LTV CEILING" />
      <OutcomeLockup />
      <div style={{position: 'absolute', left: 180, top: 245, width: 1180}}>
        <Reveal>
          <Kicker>The LTV ceiling</Kicker>
          <div
            style={{
              fontSize: 98,
              lineHeight: 1.02,
              letterSpacing: '-.065em',
              fontWeight: 800,
            }}
          >
            Don’t stop at checkout.
          </div>
        </Reveal>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 180,
          top: 250,
          width: 760,
          height: 510,
          borderLeft: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 140,
            width: 560 * progress,
            height: 4,
            background: C.ink,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 540 * progress,
            bottom: 105,
          }}
        >
          <GlowIcon name="checkout" size={78} delay={28} />
        </div>
        <Reveal
          delay={60}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 245,
            width: 300,
            color: C.muted,
            fontSize: 24,
            lineHeight: 1.35,
          }}
        >
          One sale caps LTV.
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

const EquationCard = ({
  icon,
  label,
  value,
  accent = false,
  delay,
}: {
  icon: IconName;
  label: string;
  value: string;
  accent?: boolean;
  delay: number;
}) => (
  <Reveal
    delay={delay}
    style={{
      width: 900,
      height: 430,
      padding: 58,
      boxSizing: 'border-box',
      borderRadius: 30,
      border: `1px solid ${accent ? 'rgba(22,163,74,.30)' : C.line}`,
      background: accent
        ? 'linear-gradient(145deg, rgba(22,163,74,.09), rgba(22,163,74,.015))'
        : C.panel,
      boxShadow: accent ? '0 0 80px rgba(22,163,74,.08)' : undefined,
    }}
  >
    <GlowIcon name={icon} size={92} delay={delay + 5} />
    <div
      style={{
        marginTop: 50,
        color: C.muted,
        textTransform: 'uppercase',
        fontSize: 18,
        letterSpacing: '.15em',
        fontWeight: 740,
      }}
    >
      {label}
    </div>
    <div
      style={{
        marginTop: 11,
        fontSize: 76,
        letterSpacing: '-.055em',
        fontWeight: 820,
        color: accent ? C.green : C.ink,
      }}
    >
      {value}
    </div>
  </Reveal>
);

const MechanismScene = () => (
  <AbsoluteFill style={type}>
    <Backdrop />
    <Header step="03 / THE MECHANISM" />
    <OutcomeLockup />
    <div
      style={{
        position: 'absolute',
        left: 180,
        top: 165,
        right: 180,
        textAlign: 'center',
      }}
    >
      <Reveal>
        <Kicker>The growth lever</Kicker>
        <div
          style={{
            fontSize: 74,
            fontWeight: 790,
            letterSpacing: '-.05em',
          }}
        >
          Same CAC. More revenue.
        </div>
      </Reveal>
    </div>
    <div
      style={{
        position: 'absolute',
        left: 300,
        right: 300,
        top: 395,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 80,
      }}
    >
      <EquationCard
        icon="user"
        label="Customer acquisition cost"
        value="CAC: SAME"
        delay={14}
      />
      <div style={{fontSize: 65, color: C.green, fontWeight: 300}}>+</div>
      <EquationCard
        icon="repeat"
        label="Recurring app revenue"
        value="LTV: ↑ MONTHLY"
        accent
        delay={28}
      />
    </div>
  </AbsoluteFill>
);

const ProductTile = ({
  src,
  title,
  caption,
  delay,
}: {
  src: string;
  title: string;
  caption: string;
  delay: number;
}) => (
  <Reveal delay={delay}>
    <div
      style={{
        width: 440,
        borderRadius: 26,
        overflow: 'hidden',
        border: `1px solid ${C.line}`,
        background: C.panel,
      }}
    >
      <Img
        src={src}
        style={{display: 'block', width: 440, height: 325, objectFit: 'cover'}}
      />
      <div style={{padding: '25px 28px 28px'}}>
        <div style={{fontWeight: 740, fontSize: 29}}>{title}</div>
        <div style={{color: C.muted, fontSize: 21, marginTop: 7}}>{caption}</div>
      </div>
    </div>
  </Reveal>
);

const ProductScene = () => (
  <AbsoluteFill style={type}>
    <Backdrop />
    <Header step="04 / RIBBIT" />
    <OutcomeLockup />
    <div style={{position: 'absolute', left: 170, top: 180, width: 970}}>
      <Reveal>
        <Kicker>Ribbit</Kicker>
        <div
          style={{
            fontSize: 86,
            lineHeight: 1.03,
            letterSpacing: '-.06em',
            fontWeight: 810,
          }}
        >
          Bundle hardware
          <br />
          + software.
        </div>
      </Reveal>
      <Reveal delay={26}>
        <div
          style={{
            marginTop: 32,
            width: 800,
            color: C.muted,
            fontSize: 27,
            lineHeight: 1.42,
          }}
        >
          One checkout. One API. Monthly revenue.
        </div>
      </Reveal>
      <Reveal
        delay={42}
        style={{display: 'flex', alignItems: 'center', gap: 20, marginTop: 38}}
      >
        <GlowIcon name="key" size={76} delay={44} />
        <div>
          <div style={{fontSize: 19, color: C.muted}}>VERIFY CONTRACT</div>
          <div
            style={{
              marginTop: 4,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 24,
              color: C.green,
            }}
          >
            {'{ "valid": true }'}
          </div>
        </div>
      </Reveal>
    </div>
    <div
      style={{
        position: 'absolute',
        right: 145,
        top: 215,
        display: 'flex',
        alignItems: 'center',
        gap: 30,
      }}
    >
      <ProductTile
        src={CAM}
        title="Lumen Cam"
        caption="$249 once"
        delay={15}
      />
      <div style={{color: C.green, fontSize: 46}}>+</div>
      <ProductTile
        src={GUARD}
        title="Guard Pro"
        caption="$12 every month"
        delay={27}
      />
    </div>
  </AbsoluteFill>
);

const DecisionScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    durationInFrames: 32,
    config: {damping: 200},
  });
  const line = interpolate(frame, [48, 112], [0, 1], clamp);
  return (
    <AbsoluteFill style={type}>
      <Backdrop />
      <Header step="05 / THE OUTCOME" />
      <div
        style={{
          position: 'absolute',
          left: 200,
          top: 220,
          width: 1500,
          opacity: scale,
          transform: `scale(${0.95 + scale * 0.05})`,
          transformOrigin: 'left center',
        }}
      >
        <Kicker>The outcome</Kicker>
        <div
          style={{
            fontSize: 130,
            lineHeight: 0.97,
            letterSpacing: '-.075em',
            fontWeight: 840,
          }}
        >
          Keep your CAC.
          <br />
          <span style={{color: C.green}}>Raise your LTV.</span>
        </div>
        <div
          style={{
            marginTop: 43,
            display: 'inline-flex',
            padding: '18px 25px',
            borderRadius: 14,
            border: '1px solid rgba(22,163,74,.28)',
            background: 'rgba(22,163,74,.07)',
            color: C.green,
            fontSize: 23,
            fontWeight: 730,
          }}
        >
          Start with Ribbit
        </div>
      </div>
      <div style={{position: 'absolute', right: 240, top: 320}}>
        <GlowIcon name="trend" size={220} delay={18} />
        <div
          style={{
            position: 'absolute',
            right: 105,
            top: 220,
            width: 2,
            height: 280 * line,
            background: `linear-gradient(${C.green}, transparent)`,
            transform: 'rotate(34deg)',
            transformOrigin: 'top',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 96,
          bottom: 29,
          color: C.muted,
          fontSize: 20,
        }}
      >
        Shopify subscriptions · contract verification
      </div>
      <OutcomeLockup />
    </AbsoluteFill>
  );
};

const transition = linearTiming({durationInFrames: 8});

export const RibbitAwarenessVideo = () => (
  <AbsoluteFill style={{backgroundColor: C.bg}}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={100}>
        <AcquisitionScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={transition} />
      <TransitionSeries.Sequence durationInFrames={105}>
        <CeilingScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={transition} />
      <TransitionSeries.Sequence durationInFrames={120}>
        <MechanismScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={transition} />
      <TransitionSeries.Sequence durationInFrames={132}>
        <ProductScene />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={transition} />
      <TransitionSeries.Sequence durationInFrames={115}>
        <DecisionScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
