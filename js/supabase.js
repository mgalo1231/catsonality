// ===== Supabase 初期化 =====

const SUPABASE_URL = 'https://ldfmzblrlonuakgcfdyk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZm16YmxybG9udWFrZ2NmZHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTE0MTgsImV4cCI6MjA4NTY4NzQxOH0.vfn08gfVcdHge24D6Db2Roj0G7hn7JZsUdVtIWHkteY';

// Supabase クライアント初期化
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// グローバルに公開
window.supabaseClient = supabaseClient;

// ===== 認証状態の管理 =====

// 現在のユーザーを取得
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// ログイン状態の変化を監視
supabaseClient.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user.email);
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
    }
});

// ===== 接続テスト（開発用） =====
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabaseClient.from('profiles').select('count').limit(1);
        if (error) {
            console.error('Supabase 接続エラー:', error.message);
            return false;
        }
        console.log('✅ Supabase 接続成功！');
        return true;
    } catch (err) {
        console.error('Supabase 接続エラー:', err);
        return false;
    }
}

// ページ読み込み時に接続テスト
document.addEventListener('DOMContentLoaded', () => {
    testSupabaseConnection();
});
