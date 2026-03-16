export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            notifications: { // <-- EKLENEN KISIM
                Row: {
                    id: string
                    title: string
                    type: 'emergency' | 'info' | 'event' | 'system' | null
                    badge_text: string | null
                    created_at: string
                    content_pre: string | null
                    info_box_title: string | null
                    info_box_text: string | null
                    content_post: string | null
                    image_url: string | null
                    action_label: string | null
                    action_url: string | null
                    action_type: 'route' | 'link' | null
                    signature: string | null
                }
            }
            categories: {
                Row: {
                    id: string
                    label: string
                    icon: string | null
                    type: string | null
                    color: string | null // <-- YENİ EKLENEN
                    created_at: string
                }
            }
            places: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    address: string | null
                    phone: string | null
                    category_id: string | null
                    image_url: string | null
                    latitude: number | null
                    longitude: number | null
                    rating: number | null
                    created_at: string
                    locationLink : string
                }
            }
            market_items: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    price: number
                    category: string
                    image_url: string | null
                    seller_name: string
                    seller_avatar_url: string | null
                    contact_info: string | null
                    is_sold: boolean | null
                    created_at: string
                }
            }
            products: {
                Row: {
                    id: string
                    place_id: string
                    name: string
                    description: string | null
                    price: number | null
                    image_url: string | null
                    is_available: boolean | null
                    created_at: string
                }
            }
            campaigns: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    badge: string | null
                    start_date: string | null
                    end_date: string | null
                    image_url: string | null
                    code: string | null
                    terms: Json | null
                    created_at: string
                }
            }
            campaign_places: {
                Row: {
                    campaign_id: string
                    place_id: string
                }
            }
            news: {
                Row: {
                    id: string
                    title: string
                    excerpt: string | null
                    category_id: string | null
                    image_url: string | null
                    source: string | null
                    reporter: string | null
                    content: Json | null
                    is_headline: boolean | null
                    published_at: string | null
                    created_at: string
                }
            }
            taxi_stands: {
                Row: {
                    id: string
                    name: string
                    phone: string | null
                    whatsapp: string | null // Yeni
                    image_url: string | null
                    address: string | null
                    district: string | null // Yeni
                    is_open: boolean
                    location_link: string | null // Yeni
                    features: string[] | null // JSONB array -> string[]
                    drivers: { name: string; status: string; image: string }[] | null // JSONB array -> Object[]
                    rating: number
                    review_count: number
                    created_at: string
                }
            }
            outages: {
                Row: {
                    id: string
                    type: string
                    title: string
                    description: string | null
                    location: string | null
                    status: string | null
                    start_time: string | null
                    end_time: string | null
                    authority: string | null
                    created_at: string
                }
            }
            jobs: {
                Row: {
                    id: string
                    title: string
                    company_name: string
                    type: string | null
                    category: string | null // <-- YENİ EKLENDİ
                    location: string | null
                    salary_range: string | null
                    description: string | null
                    requirements: Json | null
                    contact_phone: string | null
                    is_active: boolean | null
                    created_at: string
                }
            }
            institutions: {
                Row: {
                    id: string
                    name: string
                    category: string | null
                    address: string | null
                    phone: string | null
                    website: string | null
                    image_url: string | null
                    working_hours: Json | null
                    latitude: number | null
                    longitude: number | null
                    created_at: string
                }
            }
            culture_dialect: {
                Row: {
                    id: string;
                    word: string;
                    meaning: string;
                    type: string | null;
                    example: string | null;
                    category: string | null;
                    is_popular: boolean;
                };
            };
            culture_artists: {
                Row: {
                    id: string;
                    name: string;
                    title: string | null;
                    years: string | null;
                    bio: string | null;
                    image_url: string | null;
                };
            };
            culture_songs: {
                Row: {
                    id: string;
                    artist_id: string | null;
                    title: string;
                    duration: string | null;
                    views: string | null;
                    image_url: string | null;
                    media_url: string | null;
                    is_featured: boolean;
                };
            };
            culture_places: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    category: string;
                    date_label: string | null;
                    population: number | null;
                    distance: string | null;
                    image_url: string | null;
                    location_link: string | null;
                };
            };
            culture_recipes: {
                Row: {
                    id: string;
                    title: string;
                    description: string | null;
                    time: string | null;
                    difficulty: string | null;
                    servings: string | null;
                    image_url: string | null;
                    is_popular: boolean;
                };
            };
            culture_arts: {
                Row: {
                    id: string;
                    title: string;
                    subtitle: string | null;
                    content: string | null;
                    author: string | null;
                    type: string;
                    image_url: string | null;
                };
            };
            culture_nostalgia: {
                Row: {
                    id: string;
                    title: string;
                    year: string;
                    image_url: string;
                    type: string;
                    compare_image_url: string | null;
                };
            };
        };
        surveys: {
            Row: {
                id: string
                title: string
                category: string | null
                publisher_name: string | null
                publisher_logo: string | null
                image_url: string | null
                short_description: string | null
                full_description: string | null
                bullet_points: string[] | null // JSONB array olarak gelecek
                survey_url: string | null
                start_date: string | null
                end_date: string | null
                is_active: boolean
                created_at: string
            }
        }
        pharmacies: {
            Row: {
                id: string
                name: string
                address: string | null
                phone: string | null
                location_url: string | null
                duty_date: string // YYYY-MM-DD
                distance_text: string | null
                created_at: string
            }
        }
        prayer_times: {
            Row: {
                id: string
                date: string
                imsak: string
                gunes: string
                ogle: string
                ikindi: string
                aksam: string
                yatsi: string
                created_at: string
            }
        }
        weather_forecasts: {
            Row: {
                id: string
                date: string
                day_name: string
                temp_current: number | null
                temp_min: number | null
                temp_max: number | null
                description: string | null
                icon: string | null
                details: { humidity: string; wind: string; rain: string; visibility: string } | null
                hourly_forecast: { time: string; temp: number; icon: string; isNow: boolean }[] | null
                created_at: string
            }
        }
    }
}
