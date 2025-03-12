const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf('YOUR_BOT_TOKEN');

const userWatchlist = {}; // Список отслеживаемых машин пользователями
const priceHistory = {}; // Хранение старых цен

bot.start((ctx) => ctx.reply('Привет! Напиши марку и модель машины, например: Toyota Camry. \nДоп. команды: /compare, /credit, /watchlist'));

bot.on('text', async (ctx) => {
    const query = ctx.message.text.toLowerCase();
    try {
        const response = await axios.get('https://carwagenapi.pythonanywhere.com/api/cars/');
        const cars = response.data;

        if (query.startsWith('/compare')) {
            return handleComparison(ctx, cars, query);
        }
        if (query.startsWith('/credit')) {
            return handleCredit(ctx, query);
        }
        if (query.startsWith('/watchlist')) {
            return handleWatchlist(ctx, query);
        }

        const foundCars = cars.filter(car => `${car.brand} ${car.model}`.toLowerCase().includes(query));

        if (foundCars.length > 0) {
            foundCars.forEach(car => sendCarInfo(ctx, car));
        } else {
            ctx.reply('❌ Машина не найдена.');
        }
    } catch (error) {
        console.error('Ошибка запроса:', error);
        ctx.reply('Ошибка сервера. Попробуй позже.');
    }
});

function sendCarInfo(ctx, car) {
    ctx.replyWithPhoto(car.photo, {
        caption: `🚗 ${car.brand} ${car.model}\n📅 Год: ${car.year}\n🗒️ Комплектация: ${car.complectation}\n🔅 Цвет: ${car.color}\n💰 Цена: ${car.price}$\n⭐ Рейтинг: ${getRandomRating()} / 5`
    });
}

async function checkPriceChanges() {
    try {
        const response = await axios.get('https://carwagenapi.pythonanywhere.com/api/cars/');
        const cars = response.data;

        for (const userId in userWatchlist) {
            userWatchlist[userId].forEach(model => {
                const car = cars.find(c => `${c.brand} ${c.model}`.toLowerCase().includes(model.toLowerCase()));
                if (car) {
                    const prevPrice = priceHistory[car.model];
                    if (prevPrice && prevPrice !== car.price) {
                        bot.telegram.sendMessage(userId, `⚠️ Цена на ${car.brand} ${car.model} изменилась! Было: ${prevPrice}$, стало: ${car.price}$`);
                        sendCarInfo({ replyWithPhoto: (photo, options) => bot.telegram.sendPhoto(userId, photo, options) }, car);
                    }
                    priceHistory[car.model] = car.price;
                }
            });
        }
    } catch (error) {
        console.error('Ошибка проверки цен:', error);
    }
}

setInterval(checkPriceChanges, 5000); // Проверка цен каждые 5 секунд

bot.launch();
console.log("Бот запущен!");
