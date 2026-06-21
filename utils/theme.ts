export const theme = {
  colors: {
    // Основные брутальные цвета
    background: '#F0F1F5',      // Плотный технологичный фон
    surface: '#FFFFFF',         // Белый для карточек, но с жестким контуром
    primary: '#000000',         // Все главные элементы и текст — глубокий черный
    accent: '#CCFF00',          // Кислотно-желтый (Volt / Neon Lime) для главного фокуса
    
    // Макронутриенты (плотные, спортивные цвета)
    protein: '#FF3B30',         // Агрессивный красный (Мышцы / Сила)
    fat: '#FFCC00',             // Плотный желтый (Энергия)
    carbs: '#007AFF',           // Яркий синий (Гликоген / Топливо)
    
    textPrimary: '#000000',
    textSecondary: '#555555',
    border: '#000000',          // Жесткий черный контур для всего
  },
  brutalshading: {
    // Кастомная жесткая брутальная тень
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5, // Для Android
  }
};