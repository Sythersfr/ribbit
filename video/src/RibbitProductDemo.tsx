import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  TransitionSeries,
  linearTiming,
} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';

const CAM =
  'https://cdn.shopify.com/s/files/1/0910/0505/9106/files/lumen-cam-product.jpg?v=1789841698';
const GUARD =
  'https://cdn.shopify.com/s/files/1/0910/0505/9106/files/lumen-guard-pro-product.jpg?v=1789841699';

const palette = {
  ink: '#07110c',
  panel: '#101d16',
  green: '#8cff9f',
  bright: '#baffc5',
  cream: '#f6f1e8',
  muted: '#a9b8ae',
};

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const base: CSSProperties = {
  fontFamily:
    'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: palette.cream,
};

const Grid = () => (
  <AbsoluteFill
    style={{
      backgroundColor: palette.ink,
      backgroundImage:
        'linear-gradient(rgba(140,255,159,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(140,255,159,.055) 1px, transparent 1px)',
      backgroundSize: '72px 72px',
    }}
  />
);

const Glow = ({x, y, size = 700}: {x: number; y: number; size?: number}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: '50%',
      background:
        'radial-gradient(circle, rgba(83,255,121,.22), rgba(83,255,121,0) 68%)',
      filter: 'blur(16px)',
    }}
  />
);

const Brand = () => (
  <div
    style={{
      position: 'absolute',
      top: 62,
      left: 76,
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      fontWeight: 760,
      fontSize: 34,
      letterSpacing: '-0.03em',
    }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 7,
        background: palette.green,
        boxShadow: `0 0 28px ${palette.green}`,
      }}
    />
    Ribbit
  </div>
);

const Reveal = ({
  children,
  delay = 0,
  distance = 42,
  style,
}: {
  children: ReactNode;
  delay?: number;
  distance?: number;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {damping: 200},
    durationInFrames: 24,
  });
  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * distance}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Pill = ({children}: {children: ReactNode}) => (
  <div
    style={{
      display: 'inline-flex',
      padding: '12px 18px',
      border: '1px solid rgba(140,255,159,.34)',
      borderRadius: 999,
      color: palette.green,
      background: 'rgba(140,255,159,.07)',
      fontWeight: 700,
      fontSize: 19,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const ProductFrame = ({
  src,
  size,
  rotate = 0,
}: {
  src: string;
  size: number;
  rotate?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({
    frame,
    fps,
    durationInFrames: 34,
    config: {damping: 18, stiffness: 120},
  });
  const drift = interpolate(frame, [0, 120], [0, -18], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 52,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.12)',
        boxShadow: '0 45px 110px rgba(0,0,0,.46)',
        transform: `translateY(${(1 - enter) * 80 + drift}px) scale(${0.88 + enter * 0.12}) rotate(${rotate}deg)`,
      }}
    >
      <Img
        src={src}
        style={{width: '100%', height: '100%', objectFit: 'cover'}}
      />
    </div>
  );
};

const HookScene = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [55, 100], [0, 1], clamp);
  return (
    <AbsoluteFill style={base}>
      <Grid />
      <Glow x={1180} y={150} size={760} />
      <Brand />
      <div style={{position: 'absolute', left: 110, top: 250, width: 940}}>
        <Reveal>
          <Pill>Hardware has an LTV problem</Pill>
        </Reveal>
        <Reveal delay={10}>
          <div
            style={{
              marginTop: 34,
              fontSize: 94,
              lineHeight: 0.98,
              fontWeight: 820,
              letterSpacing: '-0.065em',
            }}
          >
            The sale ends
            <br />
            at checkout.
          </div>
        </Reveal>
        <Reveal delay={24}>
          <div
            style={{
              marginTop: 34,
              fontSize: 30,
              color: palette.muted,
              maxWidth: 700,
              lineHeight: 1.35,
            }}
          >
            Ribbit turns one-time products into recurring software revenue.
          </div>
        </Reveal>
        <div
          style={{
            marginTop: 34,
            width: 580 * strike,
            height: 5,
            borderRadius: 99,
            background: palette.green,
            boxShadow: `0 0 28px ${palette.green}`,
          }}
        />
      </div>
      <div style={{position: 'absolute', right: 100, top: 165}}>
        <ProductFrame src={CAM} size={720} rotate={2} />
      </div>
    </AbsoluteFill>
  );
};

const BundleScene = () => {
  const frame = useCurrentFrame();
  const link = interpolate(frame, [48, 82], [0, 1], clamp);
  return (
    <AbsoluteFill style={base}>
      <Grid />
      <Glow x={500} y={170} size={900} />
      <Brand />
      <Reveal
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Pill>One bundled checkout</Pill>
        <div
          style={{
            marginTop: 25,
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-0.055em',
          }}
        >
          Sell the app with the hardware.
        </div>
      </Reveal>

      <div style={{position: 'absolute', left: 260, top: 355}}>
        <ProductFrame src={CAM} size={490} rotate={-2} />
        <div style={{marginTop: 22, textAlign: 'center', fontSize: 27}}>
          Lumen Cam <strong style={{color: palette.green}}>$249 once</strong>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 853,
          top: 552,
          width: 215,
          height: 4,
          transform: `scaleX(${link})`,
          transformOrigin: 'left',
          background: palette.green,
          boxShadow: `0 0 24px ${palette.green}`,
        }}
      />
      <div style={{position: 'absolute', right: 260, top: 355}}>
        <ProductFrame src={GUARD} size={490} rotate={2} />
        <div style={{marginTop: 22, textAlign: 'center', fontSize: 27}}>
          Guard Pro{' '}
          <strong style={{color: palette.green}}>$12 / month</strong>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ApiScene = () => {
  const frame = useCurrentFrame();
  const cursor = Math.floor(frame / 15) % 2 === 0 ? 1 : 0.25;
  const response = spring({
    frame: frame - 65,
    fps: 30,
    durationInFrames: 30,
    config: {damping: 200},
  });
  return (
    <AbsoluteFill style={base}>
      <Grid />
      <Glow x={1000} y={0} size={900} />
      <Brand />
      <div style={{position: 'absolute', left: 110, top: 205, width: 760}}>
        <Reveal>
          <Pill>One API call</Pill>
        </Reveal>
        <Reveal delay={10}>
          <div
            style={{
              marginTop: 28,
              fontSize: 77,
              lineHeight: 1.03,
              fontWeight: 810,
              letterSpacing: '-0.055em',
            }}
          >
            Is this contract
            <br />
            live?
          </div>
        </Reveal>
        <Reveal delay={24}>
          <div
            style={{
              marginTop: 30,
              color: palette.muted,
              fontSize: 29,
              lineHeight: 1.45,
            }}
          >
            Your companion app never needs to understand Shopify billing.
            Ribbit handles the contract and returns entitlements instantly.
          </div>
        </Reveal>
      </div>

      <Reveal
        delay={15}
        style={{
          position: 'absolute',
          right: 105,
          top: 170,
          width: 845,
          height: 740,
          padding: 42,
          boxSizing: 'border-box',
          borderRadius: 34,
          background: 'rgba(16,29,22,.94)',
          border: '1px solid rgba(140,255,159,.22)',
          boxShadow: '0 45px 130px rgba(0,0,0,.55)',
          fontFamily: '"SFMono-Regular", Consolas, monospace',
          fontSize: 24,
          lineHeight: 1.65,
        }}
      >
        <div style={{display: 'flex', gap: 10, marginBottom: 32}}>
          {['#ff6b6b', '#ffd93d', '#6bff95'].map((color) => (
            <div
              key={color}
              style={{width: 14, height: 14, borderRadius: 20, background: color}}
            />
          ))}
        </div>
        <div style={{color: '#7ee7ff'}}>POST</div>
        <div>/api/v1/contracts/verify</div>
        <div style={{marginTop: 24, color: palette.muted}}>
          {'{'}
          <br />
          &nbsp;&nbsp;&quot;license_key&quot;:{' '}
          <span style={{color: '#ffd99a'}}>&quot;RBT-GUARD-9K2P&quot;</span>
          <span style={{opacity: cursor}}>▌</span>
          <br />
          {'}'}
        </div>
        <div
          style={{
            marginTop: 34,
            padding: 28,
            borderRadius: 20,
            opacity: response,
            transform: `translateY(${(1 - response) * 25}px)`,
            background: 'rgba(140,255,159,.08)',
            border: '1px solid rgba(140,255,159,.22)',
          }}
        >
          <span style={{color: palette.green}}>&quot;valid&quot;: true</span>
          <br />
          &quot;plan&quot;: &quot;Guard Pro&quot;,
          <br />
          &quot;seats&quot;: 3,
          <br />
          &quot;features&quot;: [&quot;ai_alerts&quot;, &quot;cloud_archive&quot;]
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};

const EndScene = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const logo = spring({
    frame,
    fps,
    durationInFrames: 32,
    config: {damping: 18, stiffness: 160},
  });
  const halo = interpolate(frame, [0, 120], [0.6, 1.05], clamp);
  return (
    <AbsoluteFill style={{...base, alignItems: 'center', justifyContent: 'center'}}>
      <Grid />
      <div
        style={{
          position: 'absolute',
          width: 920 * halo,
          height: 920 * halo,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(140,255,159,.18), transparent 66%)',
        }}
      />
      <div
        style={{
          position: 'relative',
          textAlign: 'center',
          transform: `scale(${0.8 + logo * 0.2})`,
          opacity: logo,
        }}
      >
        <div
          style={{
            margin: '0 auto 35px',
            width: 74,
            height: 74,
            borderRadius: 21,
            background: palette.green,
            boxShadow: `0 0 60px ${palette.green}`,
          }}
        />
        <div
          style={{
            fontSize: 130,
            fontWeight: 850,
            letterSpacing: '-0.075em',
          }}
        >
          Ribbit
        </div>
        <Reveal delay={18}>
          <div
            style={{
              marginTop: 22,
              fontSize: 38,
              color: palette.bright,
              fontWeight: 650,
            }}
          >
            Sell the app with the hardware.
          </div>
        </Reveal>
        <Reveal delay={34}>
          <div
            style={{
              marginTop: 28,
              fontSize: 25,
              color: palette.muted,
              letterSpacing: '0.02em',
            }}
          >
            Shopify subscriptions · contract verification · recurring LTV
          </div>
        </Reveal>
      </div>
    </AbsoluteFill>
  );
};

const transition = linearTiming({durationInFrames: 15});

export const RibbitProductDemo = () => {
  return (
    <AbsoluteFill style={{backgroundColor: palette.ink}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={135}>
          <HookScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />
        <TransitionSeries.Sequence durationInFrames={165}>
          <BundleScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />
        <TransitionSeries.Sequence durationInFrames={195}>
          <ApiScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={transition}
        />
        <TransitionSeries.Sequence durationInFrames={150}>
          <EndScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
