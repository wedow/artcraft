// // Current Mac version (update this when a new version is released)
// // If a rollback is necessary, roll back to the last known good date.
// // const MAC_VERSION = "2025.06.04";
// // const MAC_VERSION = "2025.07.13";
// // const MAC_VERSION = "2025.07.17";
// // const MAC_VERSION = "2025.07.28";
// // const MAC_VERSION = "2025.08.23"; // NB: The "08.22 (twenty two)" release is broken.
// // const MAC_VERSION = "2025.09.23";
// // const MAC_VERSION = "2025.09.24"; // Works! Good release.
// // const MAC_VERSION = "2025.09.27";
// //export const MAC_VERSION = "2025.10.04"; // Sora 2
// //export const MAC_VERSION = "2025.12.01"; // Grok
// export const MAC_VERSION = "2025.12.19"; // WorldLabs v1
// 
// // Current Windows version (update this when a new version is released)
// // If a rollback is necessary, roll back to the last known good date.
// // const WINDOWS_VERSION = "2025.06.04";
// // const WINDOWS_VERSION = "2025.07.13";
// // const WINDOWS_VERSION = "2025.07.17";
// // const WINDOWS_VERSION = "2025.07.28";
// // const WINDOWS_VERSION = "2025.08.22";
// // const WINDOWS_VERSION = "2025.09.23";
// // const WINDOWS_VERSION = "2025.09.24"; // Works! Good release.
// // const WINDOWS_VERSION = "2025.09.27";
// //export const WINDOWS_VERSION = "2025.12.01"; // Grok
// export const WINDOWS_VERSION = "2025.12.19"; // WorldLabs v1
// 
// const R2_BASE = "https://pub-3b58c874772a4e04b9c291815224128c.r2.dev";
// 
// export const DOWNLOAD_LINKS = {
//   WINDOWS: `${R2_BASE}/windows/ArtCraft_0.0.1_x64-setup_${WINDOWS_VERSION}.exe`,
//   MACOS: `${R2_BASE}/mac/ArtCraft_0.0.1_universal_${MAC_VERSION}.dmg`,
// } as const;

export const DOWNLOAD_LINKS = {
  //WINDOWS: 'https://github.com/storytold/artcraft/releases/download/artcraft-windows-v0.2.0/ArtCraft_0.2.0_x64-setup.exe',
  //WINDOWS: 'https://github.com/storytold/artcraft/releases/download/artcraft-windows-v0.4.0/ArtCraft_0.4.0_x64-setup.exe', // BROKEN (NX)
  //WINDOWS: 'https://github.com/storytold/artcraft/releases/download/artcraft-windows-v0.5.0/ArtCraft_0.5.0_x64-setup.exe',
  WINDOWS: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.7.0/ArtCraft_0.7.0_x64-setup.exe', // 2026-02-23 Seedance
  //MACOS: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.2.0/ArtCraft_0.2.0_universal.dmg',
  //MACOS: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.4.0/ArtCraft_0.4.0_universal.dmg', // BROKEN (NX)
  //MACOS: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.5.0/ArtCraft_0.5.0_universal.dmg',
  MACOS: 'https://github.com/storytold/artcraft/releases/download/artcraft-v0.7.0/ArtCraft_0.7.0_universal.dmg', // 2026-02-23 Seedance
} as const;
