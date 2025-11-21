const express = require('express');
const axios = require('axios');

const app = express();

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Главная страница
app.get('/', (req, res) => {
  res.json({ 
    message: 'API примет работает!',
    endpoint: '/api/omens'
  });
});

// Ваш API endpoint
app.get('/api/omens', async (req, res) => {
  try {
    const response = await axios.get('https://horoscopes.rambler.ru/api/front/v3/omens/main/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const data = response.data;
    let allOmens = [];
    
    if (data.content && data.content.inner_blocks) {
      data.content.inner_blocks.forEach(block => {
        if (block.omens_list && block.omens_list.omens) {
          allOmens = allOmens.concat(block.omens_list.omens);
        }
        if (block.omens_by_tags) {
          block.omens_by_tags.forEach(tag => {
            if (tag.omens) {
              allOmens = allOmens.concat(tag.omens);
            }
          });
        }
      });
    }
    
    res.json(allOmens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Важно! Экспортируем для Vercel
module.exports = app;

// Для локального запуска
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Сервер на порту ${PORT}`));
}