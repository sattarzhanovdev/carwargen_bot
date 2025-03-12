const { Telegraf } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf('7932658245:AAFq2efubIKMFkVWlJJ0Dytr_wsGqYBK7EA');

bot.start((ctx) => ctx.reply('Привет! Напиши марку и модель машины, например: Toyota Camry'));

bot.on('text', async (ctx) => {
    const query = ctx.message.text.toLowerCase(); // Текст от пользователя
    try {
        const response = await axios.get('https://carwagenapi.pythonanywhere.com/api/cars/');
        const cars = response.data; // Данные с API

        // Фильтруем машины
        const foundCars = cars.filter(car =>
            `${car.brand} ${car.model}`.toLowerCase().includes(query)
        );

        if (foundCars.length > 0) {
            foundCars.forEach(car => {
                ctx.replyWithPhoto(car.photo, {
                    caption: `🚗 ${car.brand} ${car.model}\n📅 Год: ${car.year}\n🗒️ Комплектация: ${car.complectation}\n🔅 Цвет: ${car.color}\n💰 Цена: ${car.price}$`
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

bot.launch();
console.log("Бот запущен!");
