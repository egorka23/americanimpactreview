# SEO-аудит и план действий: American Impact Review

**Сайт:** americanimpactreview.com
**Тип:** рецензируемый, open-access, мультидисциплинарный журнал
**Издатель:** Global Talent Foundation 501(c)(3)
**Стек:** Next.js 14 (App Router) + Turso + Vercel

---

## Текущее состояние (что уже реализовано)

| Компонент | Статус |
|-----------|--------|
| `citation_*` мета-теги (Highwire Press) | Реализовано (title, author, date, journal, doi, pdf_url, references и др.) |
| Dublin Core мета-теги (DC.*) | Реализовано |
| JSON-LD ScholarlyArticle | Реализовано (ArticleJsonLd.tsx) |
| JSON-LD Organization / WebSite / Periodical | Реализовано (JsonLd.tsx) |
| SiteNavigationElement | Реализовано |
| sitemap.xml (динамический) | Реализовано (статические + статьи + PDF) |
| robots.txt | Реализовано (AI-краулеры разрешены) |
| Canonical URLs | Реализовано |
| Open Graph / Twitter Cards | Реализовано |
| Google Analytics (GA4) | Реализовано |
| Microsoft Clarity | Реализовано |
| Vercel Analytics + Speed Insights | Реализовано |
| Ahrefs Site Verification | Реализовано |
| DOI prefix (10.66308) | Есть |
| ISSN | Заявка подана, ожидание |
| Google Search Console | Подключена (с февраля 2026) |
| Локальные шрифты (font-display: swap) | Реализовано |

---

## ПРИОРИТЕТНЫЙ ПЛАН ДЕЙСТВИЙ

### Приоритет 1 — Критично (влияние на индексацию Google Scholar)

#### 1.1. Google Scholar: проверить соответствие требованиям включения

**Требования Google Scholar (scholar.google.com/intl/en/scholar/inclusion.html):**

- Каждая статья должна иметь **уникальный URL** с HTML-страницей
- HTML-страница должна содержать мета-теги `citation_*`
- PDF должен быть доступен по прямой ссылке из `citation_pdf_url`
- Заголовок статьи на HTML-странице должен быть **самым крупным текстом** на странице (или в `<h1>`)
- Авторы должны быть рядом с заголовком, **шрифтом чуть меньше заголовка** или в `<h3>`
- Библиографическая ссылка на опубликованную версию должна быть отдельной строкой в header-области

**Действия:**
- [ ] Проверить, что PDF-файлы реально доступны по URL из `citation_pdf_url` (не 404)
- [ ] Проверить, что `citation_pdf_url` ведет на прямой PDF, а не на HTML-страницу
- [ ] Убедиться, что `<h1>` с заголовком статьи — самый крупный текст на странице
- [ ] Подать заявку на включение через [Google Scholar Inclusion Registration](https://scholar.google.com/intl/en/scholar/inclusion.html#request)
- [ ] После подачи ждать 6-9 месяцев — это нормально для новых журналов

#### 1.2. ISSN — получить и внедрить

- После получения ISSN добавить `citation_issn` мета-тег на все страницы статей
- Добавить ISSN в JSON-LD Periodical (`"issn": "XXXX-XXXX"`)
- ISSN критичен для индексации в Scopus, DOAJ, Crossref

#### 1.3. DOI — обеспечить работоспособность

- [ ] Проверить, что DOI реально резолвятся (https://doi.org/10.66308/...)
- [ ] Убедиться, что Crossref metadata корректна (заголовок, авторы, ссылки)
- [ ] Регистрировать DOI для каждой новой статьи
- [ ] Добавить `citation_doi` на все статьи, где есть DOI

#### 1.4. DOAJ (Directory of Open Access Journals) — подать заявку

- DOAJ — ключевой индекс для open-access журналов
- Требования: минимум 5 опубликованных статей, четкая OA-политика, ISSN
- [ ] Подготовить документы: editorial policies, peer review policy, copyright/licensing
- [ ] Убедиться, что Creative Commons лицензия указана явно (CC BY 4.0 рекомендуется)
- [ ] Подать заявку на https://doaj.org/apply

---

### Приоритет 2 — Высокий (Техническое SEO)

#### 2.1. Core Web Vitals

**Целевые показатели 2026:**
- **LCP** (Largest Contentful Paint): ≤ 2.5 секунд
- **INP** (Interaction to Next Paint): ≤ 200 мс
- **CLS** (Cumulative Layout Shift): ≤ 0.1

**Действия для Next.js:**
- [ ] Запустить PageSpeed Insights для ключевых страниц (главная, статья, explore)
- [ ] Оптимизировать изображения: использовать `<Image>` из next/image с lazy loading
- [ ] Проверить, что шрифты не блокируют рендер (font-display: swap уже есть)
- [ ] Defer/async для GA, Clarity, рекламных скриптов (уже `afterInteractive`)
- [ ] Preconnect для Google Fonts (если используются внешние)
- [ ] Минимизировать CLS: задать явные размеры для изображений и embed-элементов
- [ ] Включить Next.js `@next/bundle-analyzer` для анализа размера бандла
- [ ] Использовать React Suspense/lazy для тяжелых клиентских компонентов

#### 2.2. Индексация и краулинг

- [ ] Проверить в Google Search Console: Coverage report → ошибки индексации
- [ ] Убедиться, что sitemap.xml генерирует корректные URL (без дублей, без 404)
- [ ] В sitemap: `<lastmod>` должен содержать реальную дату, а не `new Date()` для статических страниц (текущий код ставит сегодняшнюю дату каждый раз — это плохо, Google может начать игнорировать lastmod)
- [ ] Добавить `hreflang` если планируется многоязычность
- [ ] Проверить canonical URL на каждой статье (уже есть)
- [ ] Убедиться, что нет `noindex` на нужных страницах

#### 2.3. Структура URL

- Текущая структура `/article/[slug]` — хорошая
- [ ] Убедиться, что slug человекочитаемый и содержит ключевые слова
- [ ] Не менять URL опубликованных статей (301 redirect если необходимо)

#### 2.4. HTTPS и безопасность

- Vercel обеспечивает HTTPS автоматически
- [ ] Проверить, что нет mixed content (HTTP ресурсы на HTTPS странице)

---

### Приоритет 3 — Средний (Schema Markup и структурированные данные)

#### 3.1. Улучшить ScholarlyArticle JSON-LD

Текущая реализация хорошая, но можно расширить:

```json
{
  "@type": "ScholarlyArticle",
  "mainEntityOfPage": "URL статьи",
  "pageStart": "1",
  "pageEnd": "15",
  "pagination": "1-15",
  "wordCount": 5000,
  "abstract": "полный абстракт",
  "citation": [
    {
      "@type": "ScholarlyArticle",
      "name": "Cited article title",
      "author": "Author Name"
    }
  ],
  "funding": {
    "@type": "Grant",
    "funder": { "@type": "Organization", "name": "..." }
  }
}
```

**Действия:**
- [ ] Добавить `mainEntityOfPage` в ArticleJsonLd
- [ ] Добавить `abstract` в JSON-LD (сейчас только в мета-тегах)
- [ ] Добавить `wordCount` если доступен
- [ ] Рассмотреть добавление `citation` массива (ссылки на цитируемые работы)
- [ ] Добавить `copyrightHolder`, `copyrightYear`, `license` в каждую статью
- [ ] Валидировать JSON-LD через Google Rich Results Test

#### 3.2. Добавить BreadcrumbList schema

```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://americanimpactreview.com" },
    { "@type": "ListItem", "position": 2, "name": "Articles", "item": "https://americanimpactreview.com/explore" },
    { "@type": "ListItem", "position": 3, "name": "Article Title" }
  ]
}
```

#### 3.3. Добавить FAQPage schema

- На страницах `/for-authors`, `/for-reviewers`, `/getting-started` если есть FAQ-секции

---

### Приоритет 4 — Средний (Контентное SEO)

#### 4.1. Оптимизация страниц статей

- [ ] Каждая статья должна иметь уникальный, содержательный `<title>` (уже есть через template)
- [ ] Meta description: первые 150-160 символов абстракта (уже есть)
- [ ] Ключевые слова в заголовке, абстракте, первом параграфе
- [ ] Alt-текст для всех изображений, графиков, таблиц
- [ ] Внутренние ссылки между связанными статьями ("Related Articles")
- [ ] Якорные ссылки к разделам статьи (Introduction, Methods, Results, etc.)

#### 4.2. Оптимизация информационных страниц

- [ ] `/about-journal` — подробное описание scope, mission, истории
- [ ] `/editorial-board` — профили с ORCID, институциональной принадлежностью
- [ ] `/for-authors` — полные Author Guidelines (это один из самых посещаемых типов страниц для журналов)
- [ ] `/policies` — четкие OA, peer review, ethics, copyright policies

#### 4.3. Блог / News

- [ ] Рассмотреть добавление раздела новостей/блога (анонсы выпусков, конференции, CFP)
- Регулярный свежий контент — сильный сигнал для Google

#### 4.4. E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

Google в 2025-2026 усилил значимость E-E-A-T, особенно для научного контента:

- [ ] Страницы авторов с их credentials, публикациями, ORCID
- [ ] Страницы редакторов с биографиями и институциональной принадлежностью
- [ ] Четкое указание процесса peer review
- [ ] Прозрачная информация о 501(c)(3) статусе
- [ ] About Us с контактной информацией, физическим адресом

---

### Приоритет 5 — Средний (Линкбилдинг)

#### 5.1. Академические директории и базы

- [ ] Подать в DOAJ (после получения ISSN)
- [ ] Crossref — убедиться, что все DOI активны
- [ ] Подать в BASE (Bielefeld Academic Search Engine)
- [ ] Подать в ROAD (Directory of OA scholarly resources)
- [ ] Подать в Dimensions
- [ ] Подать в Semantic Scholar
- [ ] Регистрация в WorldCat
- [ ] Подать в SHERPA/RoMEO (информация о OA-политиках)

#### 5.2. Социальные академические сети

- [ ] Создать профиль журнала на ResearchGate
- [ ] Создать профиль на Academia.edu
- [ ] Добавить журнал в Google Scholar Profiles

#### 5.3. Стратегии линкбилдинга для академического журнала

1. **Авторские профили** — попросить авторов ссылаться на свои статьи из AIR с институциональных страниц и ORCID-профилей
2. **Университетские библиотеки** — обратиться к библиотекарям для включения в каталоги (особенно если авторы из этих университетов)
3. **Пресс-релизы** — для выдающихся статей выпускать пресс-релизы
4. **Участие в конференциях** — спонсорство или партнерство с академическими конференциями
5. **Guest posts и колонки** — писать о тенденциях в OA-публикациях на профильных блогах (Scholarly Kitchen, LSE Impact Blog)
6. **Создание полезных ресурсов** — калькулятор цитирования, гайды по академическому письму, шаблоны
7. **Unlinked mentions** — через Ahrefs находить упоминания "American Impact Review" без ссылок и просить добавить ссылку
8. **HARO / Connectively / Qwoted** — отвечать на запросы журналистов от имени редакторов

---

### Приоритет 6 — Настройка Ahrefs Alerts

#### 6.1. Мониторинг бренда (Mentions Alerts)

1. Перейти в **Ahrefs → Alerts → Mentions**
2. Создать алерты для следующих запросов:
   - `"American Impact Review"` — все упоминания бренда
   - `"americanimpactreview.com"` — все упоминания домена
   - `"Global Talent Foundation" journal` — упоминания издателя
   - `"Am. Impact Rev."` — сокращенное название
3. Настройки:
   - **Mode:** Everywhere (title + content)
   - **Frequency:** Weekly (для начала)
   - **Highlight unlinked:** вставить `americanimpactreview.com` — это выделит упоминания, где НЕТ ссылки на сайт (потенциал для outreach)

#### 6.2. Мониторинг бэклинков (Backlinks Alerts)

1. Перейти в **Ahrefs → Alerts → Backlinks**
2. Создать алерт:
   - **Domain:** `americanimpactreview.com`
   - **Mode:** Domain (prefix)
   - **Scope:** New backlinks
   - **Frequency:** Weekly
3. Дополнительно — мониторинг конкурентов:
   - Добавить домены аналогичных журналов для отслеживания их новых бэклинков (идеи для своего линкбилдинга)

#### 6.3. Мониторинг ключевых слов (New Keywords Alert)

1. **Ahrefs → Alerts → New keywords**
2. Отслеживать, по каким новым запросам сайт начинает ранжироваться
3. Frequency: Weekly

#### 6.4. Использование Brand Radar (новая функция Ahrefs 2025)

- **Brand Radar** теперь работает как Site Explorer с Overview и отчетами
- Позволяет видеть, как бренд появляется в AI-ответах и веб-упоминаниях
- Настроить для мониторинга появления AIR в AI Overviews Google

---

### Приоритет 7 — Технические улучшения (быстрые победы)

#### 7.1. Исправить lastmod в sitemap

**Проблема:** Для статических страниц `lastModified: new Date()` генерирует сегодняшнюю дату при каждом запросе. Google может перестать доверять lastmod.

**Решение:** Использовать фиксированные даты для статических страниц:

```typescript
const staticPages = [
  { path: "", lastModified: "2026-01-15" },
  { path: "/about-journal", lastModified: "2026-02-01" },
  // ...
];
```

#### 7.2. Добавить `<link rel="alternate" type="application/pdf">` на страницы статей

Помогает Google Scholar найти связь между HTML и PDF версиями:
```html
<link rel="alternate" type="application/pdf" href="/articles/slug.pdf" />
```

#### 7.3. Оптимизировать OG-image для статей

- [ ] Генерировать уникальные OG-images для каждой статьи (с заголовком и авторами)
- Next.js ImageResponse API позволяет делать это динамически

#### 7.4. Добавить structured data testing в CI/CD

- [ ] Валидировать JSON-LD в тестах (schema.org ScholarlyArticle)
- [ ] Запускать Lighthouse CI на PR

---

### Приоритет 8 — Долгосрочные стратегии

#### 8.1. Scopus / Web of Science

- Scopus требует: минимум 2 года регулярных публикаций, ISSN, международный editorial board, peer review
- Web of Science (Emerging Sources Citation Index) — аналогичные требования
- **Timeline:** подавать заявку через 2-3 года после запуска

#### 8.2. PubMed Central (для медицинских статей)

- Если AIR публикует biomedical/health sciences статьи
- Требуется одобрение NLM

#### 8.3. AI-оптимизация (GEO — Generative Engine Optimization)

В 2025-2026 важно быть видимым в AI-ответах:
- [ ] Обеспечить четкую структуру контента (H1 → H2 → H3)
- [ ] Использовать списки и таблицы для структурированных данных
- [ ] Отвечать на конкретные вопросы в начале секций
- [ ] Schema markup помогает LLM извлекать структурированную информацию
- [ ] Разрешить AI-краулерам доступ (уже сделано в robots.txt)

---

## Чеклист для Ahrefs-аудита

### Site Audit (запустить в Ahrefs → Site Audit)
- [ ] Crawl errors (4xx, 5xx)
- [ ] Broken internal links
- [ ] Orphan pages (страницы без внутренних ссылок)
- [ ] Duplicate content / thin pages
- [ ] Missing/duplicate title tags
- [ ] Missing/duplicate meta descriptions
- [ ] Missing alt attributes
- [ ] Pages with slow load time
- [ ] HTTP → HTTPS issues
- [ ] Canonical issues
- [ ] Hreflang issues (если applicable)
- [ ] Schema validation errors

### Site Explorer (проверить в Ahrefs)
- [ ] Domain Rating (DR) — текущий показатель
- [ ] Referring domains — количество и качество
- [ ] Organic keywords — по каким запросам ранжируется
- [ ] Top pages — какие страницы получают трафик
- [ ] Broken backlinks — восстановить ценные ссылки

### Content Gap Analysis
- [ ] Сравнить с конкурентами (аналогичные OA-журналы)
- [ ] Найти ключевые слова, по которым конкуренты ранжируются, а AIR нет
- [ ] Создать контент для этих тем

---

## Топ-10 действий на ближайший месяц

1. **Проверить доступность PDF** по URL из `citation_pdf_url` для каждой статьи
2. **Подать заявку в Google Scholar** через форму включения
3. **Исправить lastmod** в sitemap.ts для статических страниц
4. **Запустить Ahrefs Site Audit** и исправить критические ошибки
5. **Настроить Ahrefs Alerts** (mentions + backlinks + keywords)
6. **Добавить ISSN** во все мета-теги сразу после получения
7. **Запустить PageSpeed Insights** и оптимизировать Core Web Vitals
8. **Добавить BreadcrumbList** JSON-LD на страницы статей
9. **Подать в DOAJ** и академические директории
10. **Начать outreach** к авторам для ссылок с институциональных страниц

---

*Документ создан: 10 марта 2026*
*Следующий review: апрель 2026*
