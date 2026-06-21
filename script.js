// ===================== تهيئة Telegram WebApp =====================
const tg = window.Telegram.WebApp;
tg.expand();  // توسيع التطبيق لملء الشاشة
tg.ready();   // إعلام تيليجرام بأن التطبيق جاهز

// عرض اسم المستخدم
const user = tg.initDataUnsafe?.user;
if (user) {
    document.getElementById('user-greeting').textContent = `مرحباً ${user.first_name}! 👋`;
}

// ===================== الحصول على سعر Pi Coin =====================
const PI_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=usd';

async function fetchPiPrice() {
    try {
        const response = await fetch(PI_PRICE_URL);
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

document.getElementById('convert-btn').addEventListener('click', async function() {
    if (currentPrice === null) {
        currentPrice = await fetchPiPrice();
    }
    // تحفيز التحديث التلقائي
    const piVal = parseFloat(document.getElementById('pi-input').value) || 0;
    const usdVal = convertPiToUsd(piVal, currentPrice);
    document.getElementById('usd-input').value = usdVal.toFixed(4);
});

// ===================== إحصائيات المجموعة (من Supabase) =====================
async function fetchGroupStats() {
    // يمكنك ربط هذا بـ Supabase لجلب البيانات الحقيقية
    // حالياً نستخدم بيانات تجريبية
    try {
        // مثلاً: استدعاء API خاص بك
        // const res = await fetch('https://your-api.com/stats');
        // const data = await res.json();
        // document.getElementById('members-count').textContent = data.members || 0;
        // document.getElementById('violations-count').textContent = data.violations || 0;
        // document.getElementById('bans-count').textContent = data.bans || 0;

        // بيانات مؤقتة للعرض
        document.getElementById('members-count').textContent = '135';
        document.getElementById('violations-count').textContent = '12';
        document.getElementById('bans-count').textContent = '3';
    } catch (error) {
        console.error(error);
    }
}

// ===================== زر التحديث =====================
document.getElementById('refresh-btn').addEventListener('click', async function() {
    currentPrice = await fetchPiPrice();
    // إعادة تحويل القيم الحالية
    const piVal = parseFloat(document.getElementById('pi-input').value) || 0;
    if (currentPrice !== null) {
        const usdVal = convertPiToUsd(piVal, currentPrice);
        document.getElementById('usd-input').value = usdVal.toFixed(4);
    }
});

// ===================== التهيئة =====================
(async function init() {
    currentPrice = await fetchPiPrice();
    // تحويل 1 Pi افتراضياً
    if (currentPrice !== null) {
        const usdVal = convertPiToUsd(1, currentPrice);
        document.getElementById('usd-input').value = usdVal.toFixed(4);
    }
    await fetchGroupStats();

    // إغلاق التطبيق عند الضغط على زر الرجوع (اختياري)
    tg.onEvent('backButtonClicked', function() {
        tg.close();
    });
})();
