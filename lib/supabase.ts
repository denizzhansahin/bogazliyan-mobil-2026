import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // Az önce oluşturduğumuz dosya

// Bu bilgileri Supabase panelinden (Settings > API) alabilirsin
const supabaseUrl = 'https://supabase.co';
const supabasePublicnKey = 'sb_';

export const supabase = createClient<Database>(supabaseUrl, supabasePublicnKey, {
  auth: {
    //storage: AsyncStorage,
    storage: typeof window !== "undefined" ? AsyncStorage : null,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});