/**
 * Dashboard copy and taxonomy — adjust here instead of hunting through components.
 * Category tabs filter events by keywords in name/description (backend has no category field yet).
 */
export const DASHBOARD_BRAND = "THE KINETIC";

export type EventCategoryId = "movies" | "sports" | "concerts" | "travel";

export interface EventCategoryDefinition {
  id: EventCategoryId;
  /** Shown in top nav (mockup uses uppercase styling in CSS). */
  label: string;
  keywords: string[];
  /** Placeholder visuals when you swap the image system later. */
  imageHints: {
    featured: string;
    thumb: string[];
    hero: string;
  };
}

export const EVENT_CATEGORIES: EventCategoryDefinition[] = [
  {
    id: "movies",
    label: "Movies",
    keywords: [
      "movie",
      "film",
      "cinema",
      "premiere",
      "screen",
      "theater",
      "theatre",
    ],
    imageHints: {
      featured:
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80",
      thumb: [
        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80",
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80",
        "https://images.unsplash.com/photo-1598899134739-24c46f58b8c4?w=400&q=80",
      ],
      hero: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1600&q=80",
    },
  },
  {
    id: "sports",
    label: "Sports",
    keywords: [
      "sport",
      "game",
      "stadium",
      "marathon",
      "tennis",
      "f1",
      "grand prix",
      "match",
      "league",
    ],
    imageHints: {
      featured:
        "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=80",
      thumb: [],
      hero: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1600&q=80",
    },
  },
  {
    id: "concerts",
    label: "Concerts",
    keywords: [
      "concert",
      "music",
      "tour",
      "band",
      "dj",
      "festival",
      "arena",
      "live",
    ],
    imageHints: {
      featured:
        "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80",
      thumb: [
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80",
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80",
        "https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&q=80",
      ],
      hero: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1600&q=80",
    },
  },
  {
    id: "travel",
    label: "Travel",
    keywords: [
      "travel",
      "tour",
      "expedition",
      "trip",
      "flight",
      "nordic",
      "voyage",
    ],
    imageHints: {
      featured:
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
      thumb: [],
      hero: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80",
    },
  },
];
