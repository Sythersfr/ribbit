import {Composition} from 'remotion';
import {RibbitAwarenessVideo} from './RibbitAwarenessVideo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="RibbitProductDemo"
      component={RibbitAwarenessVideo}
      durationInFrames={540}
      fps={30}
      width={2560}
      height={1080}
    />
  );
};
