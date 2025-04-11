import React, { createContext, useContext, useState } from "react";

interface AudioPlayerContextProps {
  children: React.ReactNode;
}

const AudioPlayerContext = createContext({
  currentPlayingId: null,
  setCurrentPlayingId: (id: any) => {},
});

export const useAudioPlayerContext = () => useContext(AudioPlayerContext);

export default function AudioPlayerProvider({
  children,
}: AudioPlayerContextProps) {
  const [currentPlayingId, setCurrentPlayingId] = useState(null);

  return (
    <AudioPlayerContext.Provider
      value={{ currentPlayingId, setCurrentPlayingId }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}
