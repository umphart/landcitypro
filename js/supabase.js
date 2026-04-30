// ============================================
// LANDCITY PROPERTIES - SUPABASE CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://epjrvxbbppumrprofgbo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwanJ2eGJicHB1bXJwcm9mZ2JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0Nzc4NzQsImV4cCI6MjA5MzA1Mzg3NH0.ZZXjP-aBI4cdgR0IHJOVPvQdkI42GNveNurxI40K4tE';

// Initialize Supabase client
let landcitySupabase = null;

if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    landcitySupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');
} else {
    console.warn('Supabase CDN not loaded. Database features disabled.');
}