const express = require('express');
const axios = require('axios');

const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Функция для извлечения всех примет из структуры данных
function extractOmens(data) {
  let allOmens = [];
  
  if (data.content && data.content.inner_blocks) {
    data.content.inner_blocks.forEach(block => {
      // Проверяем наличие omens_list
      if (block.omens_list && block.omens_list.omens) {
        allOmens = allOmens.concat(block.omens_list.omens);
      }
      
      // Проверяем наличие omens_by_tags
      if (block.omens_by_tags) {
        block.omens_by_tags.forEach(tag => {
          if (tag.omens) {
            allOmens = allOmens.concat(tag.omens);
          }
        });
      }
    });
  }
  
  return allOmens;
}

// Функция для получения завтрашней даты в формате YYYY-MM-DD
function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Главная страница
app.get('/', (req, res) => {
  res.json({ 
    message: 'API примет работает!',
    endpoints: {
      today: '/api/omens',
      tomorrow: '/api/omens/tomorrow',
      date: '/api/omens/date/:date (формат: YYYY-MM-DD)'
    }
  });
});

// ✅ API для примет на сегодня
app.get('/api/omens', async (req, res) => {
  try {
    console.log('📡 Получение примет на сегодня...');
    
    const response = await axios.get('https://horoscopes.rambler.ru/api/front/v3/omens/main/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const allOmens = extractOmens(response.data);
    
    console.log(`✅ Получено ${allOmens.length} примет на сегодня`);
    res.json(allOmens);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ 
      error: 'Не удалось получить приметы',
      message: error.message 
    });
  }
});

// ✅ API для примет на ЗАВТРА
app.get('/api/omens/tomorrow', async (req, res) => {
  try {
    const tomorrowDate = getTomorrowDate();
    console.log(`📡 Получение примет на завтра (${tomorrowDate})...`);
    
    const response = await axios.get(
      `https://horoscopes.rambler.ru/api/front/v3/omens/calendar/${tomorrowDate}/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    );
    
    const allOmens = extractOmens(response.data);
    
    console.log(`✅ Получено ${allOmens.length} примет на завтра (${tomorrowDate})`);
    res.json(allOmens);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ 
      error: 'Не удалось получить приметы на завтра',
      message: error.message 
    });
  }
});

// ✅ БОНУС: API для примет на конкретную дату
app.get('/api/omens/date/:date', async (req, res) => {
  try {
    const date = req.params.date;
    
    // Валидация формата даты (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ 
        error: 'Неверный формат даты. Используйте YYYY-MM-DD (например, 2025-11-22)' 
      });
    }
    
    console.log(`📡 Получение примет на ${date}...`);
    
    const response = await axios.get(
      `https://horoscopes.rambler.ru/api/front/v3/omens/calendar/${date}/`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    );
    
    const allOmens = extractOmens(response.data);
    
    console.log(`✅ Получено ${allOmens.length} примет на ${date}`);
    res.json(allOmens);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    res.status(500).json({ 
      error: `Не удалось получить приметы на ${req.params.date}`,
      message: error.message 
    });
  }
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    tomorrow: getTomorrowDate()
  });
});

// Экспорт для Vercel
module.exports = app;

// Для локального запуска
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📡 Endpoints:`);
    console.log(`   - GET /api/omens (приметы на сегодня)`);
    console.log(`   - GET /api/omens/tomorrow (приметы на завтра)`);
    console.log(`   - GET /api/omens/date/:date (приметы на конкретную дату)`);
    console.log(`\n`);
  });
}