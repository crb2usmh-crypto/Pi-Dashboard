// ===================== تهيئة Telegram WebApp =====================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const user = tg.initDataUnsafe?.user;
if (user) {
    document.getElementById('user-greeting').textContent = `مرحباً ${user.first_name}! 👋`;
}

// ===================== استخراج chat_id من الرابط =====================
function getChatIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const chatId = params.get('chat_id');
    if (chatId) {
        return parseInt(chatId);
    }
    return null;
}

const CHAT_ID = getChatIdFromUrl();

if (CHAT_ID) {
    document.getElementById('chat-id-display').textContent = CHAT_ID;
} else {
    document.getElementById('chat-id-display').textContent = '⚠️ افتح التطبيق من زر البوت';
    document.getElementById('members-count').textContent = '⚠️ لم يتم التعرف';
    document.getElementById('violations-count').textContent = '⚠️ على المجموعة';
    document.getElementById('bans-count').textContent = '⚠️';
    console.error('⚠️ لم يتم تمرير chat_id في الرابط');
}

// ===================== إعدادات Supabase =====================
const SUPABASE_URL = 'https://vclzkdfoksiyxnzlcqwh.supabase.co';      // ✅ استبدل برابط مشروعك
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbHprZGZva3NpeXhuemxjcXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMjA3ODcsImV4cCI6MjA5NzU5Njc4N30.j1eyDmNDU4U9Zgcqe5Gu6nHjoj1ET_8KpDKMzgGLolE';               // ✅ استبدل بالمفتاح العام

// ===================== جلب سعر Pi =====================
async function fetchPiPrice() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd');
        if (!response.ok) throw new Error('فشل جلب السعر');
        const data = await response.json();
        const price = data['pi-network']?.usd || 0;
        document.getElementById('pi-price').textContent = price.toFixed(6);
        document.getElementById('last-update').textContent = new Date().toLocaleString('ar-EG');
        return price;
    } catch (error) {
        console.error(error);
        document.getElementById('pi-price').textContent = '⚠️ غير متاح';
        return null;
    }
}

// ===================== جلب إحصائيات المجموعة من Supabase =====================
async function fetchGroupStats() {
    if (!CHAT_ID) {
        console.warn('⚠️ لا يوجد chat_id، لن يتم جلب الإحصائيات');
        return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('⚠️ Supabase not configured');
        document.getElementById('members-count').textContent = '⚠️ خطأ في الإعدادات';
        document.getElementById('violations-count').textContent = '⚠️ خطأ في الإعدادات';
        document.getElementById('bans-count').textContent = '⚠️ خطأ في الإعدادات';
        return;
    }

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/group_stats?chat_id=eq.${CHAT_ID}&select=*`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        if (!response.ok) throw new Error('فشل جلب الإحصائيات');
        const data = await response.json();
        if (data && data.length > 0) {
            const stats = data[0];
            document.getElementById('members-count').textContent = stats.members_count || 0;
            document.getElementById('violations-count').textContent = stats.violations_count || 0;
            document.getElementById('bans-count').textContent = stats.bans_count || 0;
        } else {
            document.getElementById('members-count').textContent = 'لا توجد بيانات';
            document.getElementById('violations-count').textContent = 'لا توجد بيانات';
            document.getElementById('bans-count').textContent = 'لا توجد بيانات';
        }
    } catch (error) {
        console.error(error);
        document.getElementById('members-count').textContent = '⚠️ خطأ';
        document.getElementById('violations-count').textContent = '⚠️ خطأ';
        document.getElementById('bans-count').textContent = '⚠️ خطأ';
    }
}

// ===================== محول العملات =====================
let currentPrice = null;

function convertPiToUsd(piValue, price) {
    return piValue * price;
}

function convertUsdToPi(usdValue, price) {
    return price > 0 ? usdValue / price : 0;
}

document.getElementById('pi-input').addEventListener('input', function() {
    const piVal = parseFloat(this.value) || 0;
    if (currentPrice !== null) {
        const usdVal = convertPiToUsd(piVal, currentPrice);
        document.getElementById('usd-input').value = usdVal.toFixed(4);
    }
});

document.getElementById('usd-input').addEventListener('input', function() {
    const usdVal = parseFloat(this.value) || 0;
    if (currentPrice !== null) {
        const piVal = convertUsdToPi(usdVal, currentPrice);
        document.getElementById('pi-input').value = piVal.toFixed(6);
    }
});

document.getElementById('convert-btn').addEventListener('click', function() {
    if (currentPrice === null) {
        fetchPiPrice().then(price => {
            currentPrice = price;
            if (price !== null) {
                const piVal = parseFloat(document.getElementById('pi-input').value) || 0;
                const usdVal = convertPiToUsd(piVal, price);
                document.getElementById('usd-input').value = usdVal.toFixed(4);
            }
        });
    } else {
        const piVal = parseFloat(document.getElementById('pi-input').value) || 0;
        const usdVal = convertPiToUsd(piVal, currentPrice);
        document.getElementById('usd-input').value = usdVal.toFixed(4);
    }
});

// ===================== 🆕 تذكير التعدين اليومي =====================
function getNextMiningTime() {
    // يحسب وقت التعدين القادم (كل 24 ساعة من الآن)
    const now = new Date();
    const next = new Date(now);
    next.setHours(now.getHours() + 24);
    next.setMinutes(0);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
}

function updateMiningTimer() {
    const next = getNextMiningTime();
    const now = new Date();
    const diff = next - now;
    
    if (diff <= 0) {
        document.getElementById('mining-timer').textContent = '🟢 جاهز للتعدين!';
        document.getElementById('mining-timer').style.color = '#34c759';
        return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('mining-timer').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('mining-timer').style.color = 'var(--text-color)';
}

function scheduleMiningReminder() {
    // تذكير كل دقيقة
    setInterval(updateMiningTimer, 1000);
    updateMiningTimer();
}

// ===================== 🆕 حساب المكافآت =====================
function calculateRewards() {
    const membersInput = document.getElementById('security-circle');
    let members = parseInt(membersInput.value) || 0;
    if (members < 0) members = 0;
    if (members > 100) members = 100;
    membersInput.value = members;
    
    // معادلة تقديرية (افتراضية) - يمكن تعديلها حسب معلومات Pi الرسمية
    const baseRate = 0.1; // Pi في الساعة
    const bonusPerMember = 0.02; // مكافأة إضافية لكل عضو في دائرة الأمان
    const hourlyRate = baseRate + (members * bonusPerMember);
    const dailyRate = hourlyRate * 24;
    const monthlyRate = dailyRate * 30;
    
    document.getElementById('reward-hourly').textContent = hourlyRate.toFixed(4);
    document.getElementById('reward-daily').textContent = dailyRate.toFixed(4);
    document.getElementById('reward-monthly').textContent = monthlyRate.toFixed(2);
}

// ===================== 🆕 أخبار Pi Network =====================
async function fetchPiNews() {
    const newsContainer = document.getElementById('news-list');
    newsContainer.innerHTML = '<div class="loading">جاري تحميل الأخبار...</div>';
    
    try {
        // مصدر بديل للأخبار (RSS to JSON)
        const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fminepi.com%2Fblog%2Ffeed%2F');
        if (!response.ok) throw new Error('فشل جلب الأخبار');
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            newsContainer.innerHTML = '';
            // عرض آخر 5 أخبار
            data.items.slice(0, 5).forEach(item => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';
                const date = new Date(item.pubDate);
                newsItem.innerHTML = `
                    <div class="news-title">${item.title}</div>
                    <div class="news-date">${date.toLocaleDateString('ar-EG')}</div>
                    <a href="${item.link}" target="_blank" class="news-link">🔗 قراءة المزيد</a>
                `;
                newsContainer.appendChild(newsItem);
            });
        } else {
            newsContainer.innerHTML = '<div class="loading">⚠️ لا توجد أخبار حالياً</div>';
        }
    } catch (error) {
        console.error(error);
        newsContainer.innerHTML = '<div class="loading">⚠️ تعذر تحميل الأخبار</div>';
    }
}

// ===================== أزرار التحديث =====================
document.getElementById('refresh-price').addEventListener('click', async function() {
    currentPrice = await fetchPiPrice();
    if (currentPrice !== null) {
        const piVal = parseFloat(document.getElementById('pi-input').value) || 0;
        const usdVal = convertPiToUsd(piVal, currentPrice);
        document.getElementById('usd-input').value = usdVal.toFixed(4);
    }
});

document.getElementById('refresh-stats').addEventListener('click', function() {
    fetchGroupStats();
});

document.getElementById('refresh-news').addEventListener('click', function() {
    fetchPiNews();
});

// ===================== التهيئة =====================
(async function init() {
    currentPrice = await fetchPiPrice();
    if (currentPrice !== null) {
        const usdVal = convertPiToUsd(1, currentPrice);
        document.getElementById('usd-input').value = usdVal.toFixed(4);
    }
    await fetchGroupStats();
    await fetchPiNews();
    scheduleMiningReminder();
    
    // حساب المكافآت الافتراضي
    calculateRewards();
    
    // ربط حساب المكافآت بتغيير المدخلات
    document.getElementById('security-circle').addEventListener('input', calculateRewards);
})();
