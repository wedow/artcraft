// Currently supported styles.
// These are the API names.
export type VstStyle =
  | "anime_2_5d"
  | "anime_2d_flat"
  | "anime_ghibli"
  | "anime_retro_neon"
  | "anime_standard"
  | "cartoon_3d"
  | "comic_book"
  | "ink_bw_style"
  | "ink_punk"
  | "ink_splash"
  | "jojo_style"
  | "paper_origami"
  | "pixel_art"
  | "pop_art"
  | "realistic_1"
  | "realistic_2"
  | "hr_giger"
  | "simpsons"
  | "carnage"
  | "pastel_cute_anime"
  | "bloom_lighting"
  | "25d_horror"
  | "creepy"
  | "creepy_vhs"
  | "trail_cam_footage"
  | "old_black_white_movie"
  | "horror_noir_black_white"
  | "techno_noir_black_white"
  | "black_white_20s"
  | "cyberpunk_anime"
  | "dragonball"
  | "realistic_matrix"
  | "realistic_cyberpunk";

// Definition of the different options.
export interface StyleOption {
  // Human-readable name
  label: string;

  // Optional animated webm preview (not all styles have previews yet)
  image?: string;

  // The API name of the style
  // NB: Named "value" so it's compatible with react-select
  value: VstStyle;
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    label: "Anime Flat",
    value: "anime_2d_flat",
    image: "/images/styles/gif/2d_flat_anime.gif",
  },
  {
    label: "Fantasy 2.5D",
    value: "anime_2_5d",
    image: "/images/styles/gif/2_5d_anime.gif",
  },
  {
    label: "Anime Ghibli",
    value: "anime_ghibli",
    image: "/images/styles/gif/ghibli.gif",
  },
  {
    label: "Anime Retro Neon",
    value: "anime_retro_neon",
    image: "/images/styles/gif/anime_retro_neon.gif",
  },
  {
    label: "Anime Standard",
    value: "anime_standard",
    image: "/images/styles/gif/anime.gif",
  },
  {
    label: "Cartoon 3D",
    value: "cartoon_3d",
    image: "/images/styles/gif/3d_cartoon.gif",
  },
  {
    label: "Comic Book",
    value: "comic_book",
    image: "/images/styles/gif/comic_book.gif",
  },
  {
    label: "Ink B&W",
    value: "ink_bw_style",
    image: "/images/styles/gif/ink_bw.gif",
  },
  {
    label: "Ink Punk",
    value: "ink_punk",
    image: "/images/styles/gif/ink_punk.gif",
  },
  {
    label: "Ink Splash",
    value: "ink_splash",
    image: "/images/styles/gif/ink_splash.gif",
  },
  {
    label: "JoJo Style",
    value: "jojo_style",
    image: "/images/styles/gif/jojo.gif",
  },
  {
    label: "Paper Origami",
    value: "paper_origami",
    image: "/images/styles/gif/origami_paper.gif",
  },
  // NB(bt,2024-04-02): Broken style for now
  //{
  //	label: "Pixel Art",
  //	value: "pixel_art",
  //	image: "/images/styles/gif/pixel.gif",
  //},
  {
    label: "Pop Art",
    value: "pop_art",
    image: "/images/styles/gif/pop_art.gif",
  },
  {
    label: "Realistic 1",
    value: "realistic_1",
    image: "/images/styles/gif/realistic_1.gif",
  },
  {
    label: "Realistic 2",
    value: "realistic_2",
    image: "/images/styles/gif/realistic_2.gif",
  },
  {
    label: "HR Giger",
    value: "hr_giger",
    image: "/images/styles/gif/hr_giger.gif",
  },
  {
    label: "Simpsons",
    value: "simpsons",
    image: "/images/styles/gif/simpsons.gif",
  },
  {
    label: "Carnage",
    value: "carnage",
    image: "/images/styles/gif/carnage.gif",
  },
  {
    label: "Anime Pastel Cute",
    value: "pastel_cute_anime",
    image: "/images/styles/gif/pastel_cute_anime.gif",
  },
  {
    label: "Bloom Lighting",
    value: "bloom_lighting",
    image: "/images/styles/gif/bloom_lighting.gif",
  },
  {
    label: "Horror 2.5D",
    value: "25d_horror",
    image: "/images/styles/gif/2_5d_horror.gif",
  },
  {
    label: "Creepy",
    value: "creepy",
    image: "/images/styles/gif/creepy.gif",
  },
  {
    label: "Creepy VHS",
    value: "creepy_vhs",
    image: "/images/styles/gif/creepy_vhs.gif",
  },
  {
    label: "Trail Cam Footage",
    value: "trail_cam_footage",
    image: "/images/styles/gif/trail_cam_footage.gif",
  },
  {
    label: "Old Black B&W",
    value: "old_black_white_movie",
    image: "/images/styles/gif/old_bw_movie.gif",
  },
  {
    label: "Horror Noir B&W",
    value: "horror_noir_black_white",
    image: "/images/styles/gif/horror_noir_bw.gif",
  },
  {
    label: "Techno Noir B&W",
    value: "techno_noir_black_white",
    image: "/images/styles/gif/techno_noir_bw.gif",
  },
  {
    label: "Black White 20s",
    value: "black_white_20s",
    image: "/images/styles/gif/bw_20s.gif",
  },
  {
    label: "Anime Cyberpunk",
    value: "cyberpunk_anime",
    image: "/images/styles/gif/anime_cyberpunk.gif",
  },
  {
    label: "Dragonball",
    value: "dragonball",
    image: "/images/styles/gif/dragonball.gif",
  },
  {
    label: "Realistic Matrix",
    value: "realistic_matrix",
    image: "/images/styles/gif/realistic_matrix.gif",
  },
  {
    label: "Realistic Cyberpunk",
    value: "realistic_cyberpunk",
    image: "/images/styles/gif/realistic_cyberpunk.gif",
  },
];

export const STYLES_BY_KEY: Map<string, StyleOption> = new Map(
  STYLE_OPTIONS.map(opt => [opt.value, opt])
);
