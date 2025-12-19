// === НАЛАШТУВАННЯ ГРИ ===
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Розмір ігрового вікна (як на скріншоті - квадратний)
canvas.width = 400;
canvas.height = 500;

// Змінні гри
let frames = 0;
let score = 0;
let gameState = 'start'; // 'start', 'playing', 'gameover'
const gameSpeed = 2.5; // Швидкість руху пляшок

// === ЗАВАНТАЖЕННЯ ГРАФІКИ ===
// Якщо ви ще не вирізали картинки, код використовуватиме кольорові заглушки.
const sprites = {
    char: new Image(),
    bg: new Image(),
    bottleTop: new Image(),
    bottleBot: new Image(),
    isLoaded: false
};

// Вказуємо шляхи до файлів
sprites.char.src = 'assets/char.png';
sprites.bg.src = 'assets/bg.png';
sprites.bottleTop.src = 'assets/bottle_top.png';
sprites.bottleBot.src = 'assets/bottle_bot.png';

// Перевіряємо, чи завантажились картинки (простий варіант)
// У реальному проєкті потрібен кращий preloader
setTimeout(() => { sprites.isLoaded = true; }, 1000);


// === ОБ'ЄКТ ПЕРСОНАЖА ===
const player = {
    x: 50,
    y: 150,
    width: 32,  // Приблизний розмір піксельного героя
    height: 32,
    velocity: 0,
    gravity: 0.25,
    jumpStrength: -4.5,
    radius: 14, // Для колізій (щоб було чесніше, ніж квадрат)

    draw: function() {
        if (sprites.isLoaded && sprites.char.complete && sprites.char.naturalWidth !== 0) {
             // Малюємо картинку
            ctx.drawImage(sprites.char, this.x, this.y, this.width, this.height);
        } else {
            // Заглушка, якщо картинки немає
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    },

    update: function() {
        // Фізика стрибка
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Перевірка меж підлоги та стелі
        if (this.y + this.height >= canvas.height || this.y < 0) {
             gameState = 'gameover';
        }
    },

    jump: function() {
        this.velocity = this.jumpStrength;
    }
};

// === ОБ'ЄКТ ПЛЯШОК (Перешкоди) ===
const pipes = {
    position: [],
    width: 185, // Ширина пляшки
    gap: 130,  // Відстань між верхньою і нижньою пляшками
    minHeight: 100, // Мінімальна висота пляшки

    draw: function() {
        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            let topY = p.y;
            let bottomY = p.y + this.gap;

            if (sprites.isLoaded && sprites.bottleTop.complete && sprites.bottleTop.naturalWidth !== 0) {
                // Малюємо пляшки
                // Верхня пляшка (потрібно трохи підігнати координати малювання)
                ctx.drawImage(sprites.bottleTop, p.x, topY - sprites.bottleTop.height + 10, this.width, sprites.bottleTop.height);
                // Нижня пляшка
                ctx.drawImage(sprites.bottleBot, p.x, bottomY, this.width, sprites.bottleBot.height);
            } else {
                // Заглушки
                ctx.fillStyle = '#d35400';
                ctx.fillRect(p.x, 0, this.width, topY); // Верхня труба
                ctx.fillRect(p.x, bottomY, this.width, canvas.height - bottomY); // Нижня труба
            }
        }
    },

    update: function() {
        // Додаємо нову пару пляшок кожні 150 кадрів
        if (frames % 150 === 0) {
             // Випадкова позиція проміжку
            const maxY = canvas.height - this.gap - this.minHeight;
            const randomY = Math.floor(Math.random() * (maxY - this.minHeight + 1)) + this.minHeight;

            this.position.push({
                x: canvas.width,
                y: randomY
            });
        }

        for(let i = 0; i < this.position.length; i++) {
            let p = this.position[i];
            
            // Рух пляшок вліво
            p.x -= gameSpeed;

            // Колізії (Зіткнення) - Спрощена модель
            // Перевірка для верхньої пляшки
            if (player.x + player.width > p.x && player.x < p.x + this.width && player.y < p.y) {
                 gameState = 'gameover';
            }
            // Перевірка для нижньої пляшки
            if (player.x + player.width > p.x && player.x < p.x + this.width && player.y + player.height > p.y + this.gap) {
                 gameState = 'gameover';
            }

            // Нарахування балів, якщо персонаж пролетів пляшку
            if (p.x + this.width < player.x && !p.passed) {
                score++;
                p.passed = true;
            }

            // Видалення пляшок, що вийшли за межі екрану
            if(p.x + this.width <= 0) {
                this.position.shift();
                i--; // коригуємо індекс після видалення
            }
        }
    },
    
    reset: function() {
        this.position = [];
    }
};

// === ФОН ТА ІНТЕРФЕЙС ===
function drawBackground() {
     if (sprites.isLoaded && sprites.bg.complete && sprites.bg.naturalWidth !== 0) {
        // Малюємо фон (можна додати паралакс ефект пізніше)
        ctx.drawImage(sprites.bg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#70c5ce'; // Колір неба, якщо фону немає
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawScore() {
    ctx.fillStyle = "#FFF";
    ctx.strokeStyle = "#000";
    ctx.textAlign = "center"; // Ця команда автоматично центрує текст
    
    if(gameState === 'playing') {
        ctx.font = "30px Impact";
        ctx.lineWidth = 2;
        // Виводимо рахунок по центру зверху
        ctx.fillText(score, canvas.width / 2, 50);
        ctx.strokeText(score, canvas.width / 2, 50);
        
        // Скидаємо вирівнювання для інших елементів (якщо потрібно)
        ctx.textAlign = "start"; 
    } else if (gameState === 'gameover') {
        // Темний фон
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0,0,canvas.width, canvas.height);

        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        
        // Великий напис
        ctx.font = "40px Impact";
        ctx.fillText("ОЙ, ВСЕ!", canvas.width / 2, 180); // Можна залишити GAME OVER, якщо хочете
        
        // Ваша фраза про пляшки
        ctx.font = "22px Impact";
        ctx.fillText("Саєнко випив " + score + " пляшок", canvas.width / 2, 230);
        
        // Підказка про рестарт
        ctx.font = "20px Tahoma";
        ctx.fillText("Клікни, щоб почати знову", canvas.width / 2, 300);
        
    } else if (gameState === 'start') {
    } else if (gameState === 'start') {
        ctx.fillStyle = "#FFD700"; // Золотий колір для заголовка
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.textAlign = "center";

        // Перший рядок назви
        ctx.font = "40px Impact";
        ctx.fillText("САЄНКО", canvas.width / 2, 180);
        ctx.strokeText("САЄНКО", canvas.width / 2, 180);

        // Другий рядок назви (меншим шрифтом, щоб влізло)
        ctx.font = "24px Impact";
        ctx.fillStyle = "#FFF";
        ctx.fillText("ЧУГАЇВСЬКИЙ ЛЕТЮЧИЙ ВОЇН", canvas.width / 2, 220);
        ctx.strokeText("ЧУГАЇВСЬКИЙ ЛЕТЮЧИЙ ВОЇН", canvas.width / 2, 220);

        ctx.font = "20px Tahoma";
        ctx.fillStyle = "#FFF";
        ctx.fillText("Тисни пробіл або екран", canvas.width / 2, 280);
    }
    // Повертаємо стандартне вирівнювання, щоб не зламати іншу логіку
    ctx.textAlign = "start";
}
// === ГОЛОВНИЙ ЦИКЛ ГРИ ===
function loop() {
    // Очищення екрану перед кожним кадром
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    player.draw();
    pipes.draw();
    drawScore();

    if (gameState === 'playing') {
        pipes.update();
        player.update();
        frames++;
    }

    requestAnimationFrame(loop);
}

// === КЕРУВАННЯ ===
function inputHandler() {
    switch(gameState) {
        case 'start':
            gameState = 'playing';
            player.jump();
            break;
        case 'playing':
            player.jump();
            break;
        case 'gameover':
            // Скидання гри
            gameState = 'start';
            pipes.reset();
            player.y = 150;
            player.velocity = 0;
            score = 0;
            frames = 0;
            break;
    }
}

// Слухаємо натискання пробілу або клік мишкою/пальцем
document.addEventListener('keydown', function(e) {
    if(e.code === 'Space') inputHandler();
});
canvas.addEventListener('click', inputHandler);

// ЗАПУСК ГРИ
loop();
