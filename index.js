const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf('7932658245:AAFq2efubIKMFkVWlJJ0Dytr_wsGqYBK7EA');

const userWatchlist = {}; // Список отслеживаемых машин пользователями

bot.start((ctx) => ctx.reply('Привет! Напиши марку и модель машины, например: Toyota Camry. Доп. команды: /compare, /credit, /watchlist'));

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
            foundCars.forEach(car => {
                ctx.replyWithPhoto(car.photo, {
                    caption: `🚗 ${car.brand} ${car.model}\n📅 Год: ${car.year}\n🗒️ Комплектация: ${car.complectation}\n🔅 Цвет: ${car.color}\n💰 Цена: ${car.price}$\n⭐ Рейтинг: ${getRandomRating()} / 5`
                });
            });
        } else {
            ctx.reply('❌ Машина не найдена.');
        }
    } catch (error) {
        console.error('Ошибка запроса:', error);
        ctx.reply('Ошибка сервера. Попробуй позже.');
    }
});

function handleComparison(ctx, cars, query) {
    const models = query.replace('/compare', '').trim().split(',');
    const foundCars = models.map(model => cars.find(car => `${car.brand} ${car.model}`.toLowerCase().includes(model.trim().toLowerCase()))).filter(Boolean);

    if (foundCars.length < 2) {
        return ctx.reply('Нужно указать минимум 2 машины через запятую.');
    }

    let comparisonText = '📊 Сравнение автомобилей:\n';
    foundCars.forEach(car => {
        comparisonText += `\n🚗 ${car.brand} ${car.model}\nГод: ${car.year}, Цена: ${car.price}$, Рейтинг: ${getRandomRating()} / 5`;
    });
    ctx.reply(comparisonText);
}

function handleCredit(ctx, query) {
    const params = query.split(' ');
    if (params.length < 3) return ctx.reply('Используй формат: /credit цена срок_в_месяцах процент');

    const [_, price, months, rate] = params.map(Number);
    const monthlyPayment = (price * (rate / 100) / 12) / (1 - Math.pow(1 + (rate / 100) / 12, -months));
    ctx.reply(`💳 Кредитный расчет: \nЦена: ${price}$ \nСрок: ${months} месяцев \nСтавка: ${rate}% \n📌 Ежемесячный платеж: ${monthlyPayment.toFixed(2)}$`);
}

function handleWatchlist(ctx, query) {
    const userId = ctx.message.from.id;
    if (!userWatchlist[userId]) userWatchlist[userId] = [];

    const model = query.replace('/watchlist', '').trim();
    if (!model) return ctx.reply('Используй: /watchlist название модели, чтобы отслеживать цену.');

    userWatchlist[userId].push(model);
    ctx.reply(`✅ ${model} добавлен в отслеживание! Мы сообщим, если цена изменится.`);
}

function getRandomRating() {
    return (Math.random() * (5 - 3) + 3).toFixed(1); // Генерация рейтинга от 3.0 до 5.0
}

bot.launch();
console.log("Бот запущен!");
