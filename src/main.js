// 1. Konfiguracja połączenia REST API Supabase (Wklej swoje dane!)
const SUPABASE_URL = 'https://qwhllyhyuototsblcbfj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CxiofzhTekg9-iJSo84Fgg_bNDKw9T9';

// Wspólne nagłówki dla każdego zapytania Fetch (Zastępują SDK)
const HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
};

// Elementy DOM
const articlesList = document.getElementById('articles-list');
const addArticleForm = document.getElementById('add-article-form');
const filterDateInput = document.getElementById('filter-date');
const clearFilterBtn = document.getElementById('clear-filter');

// Główna funkcja pobierająca dane (GET) z opcjonalnym filtrem daty
async function fetchArticles(selectedDate = '') {
    try {
        // Podstawowy URL z sortowaniem od najnowszych
        let url = `${SUPABASE_URL}/rest/v1/article?order=created_at.desc`;

        // DODATKOWY PUNKT: Filtrowanie po dacie utworzenia (created_at)
        // Jeśli użytkownik wybrał datę, filtrujemy rekordy "większe lub równe" (gte) wybranemu dniowi od godziny 00:00
        if (selectedDate) {
            const isoDate = new Date(selectedDate).toISOString();
            url += `&created_at=gte.${isoDate}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: HEADERS
        });

        if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
        
        const articles = await response.json();
        renderArticles(articles);

    } catch (error) {
        console.error('Błąd pobierania:', error);
        articlesList.innerHTML = `<p style="color: red;">Nie udało się pobrać danych: ${error.message}</p>`;
    }
}

// Funkcja renderująca elementy HTML
function renderArticles(articles) {
    articlesList.innerHTML = '';

    if (articles.length === 0) {
        articlesList.innerHTML = '<p>Brak artykułów spełniających kryteria.</p>';
        return;
    }

    articles.forEach(article => {
        const articleElement = document.createElement('article');
        articleElement.className = 'article';
        
        const articleDate = new Date(article.created_at).toLocaleString('pl-PL', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        articleElement.innerHTML = `
            <h2>${escapeHtml(article.title)}</h2>
            ${article.subtitle ? `<h3>${escapeHtml(article.subtitle)}</h3>` : ''}
            <div class="meta">Autor: <strong>${escapeHtml(article.author)}</strong> | Dodano: ${articleDate}</div>
            <div class="content"><p>${escapeHtml(article.content).replace(/\n/g, '<br>')}</p></div>
        `;
        articlesList.appendChild(articleElement);
    });
}

// Obsługa wysyłania formularza (POST przez czysty Fetch)
addArticleForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const bodyData = {
        title: document.getElementById('title').value,
        subtitle: document.getElementById('subtitle').value,
        author: document.getElementById('author').value,
        content: document.getElementById('content').value
    };

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/article`, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) throw new Error(`Nie udało się dodać artykułu: ${response.status}`);

        addArticleForm.reset();
        filterDateInput.value = ''; // Reset filtra przy nowym wpisie
        await fetchArticles(); 
        alert('Artykuł został pomyślnie dodany bez użycia SDK!');

    } catch (error) {
        console.error('Błąd wysyłania:', error);
        alert(`Błąd: ${error.message}`);
    }
});

// Eventy do obsługi filtrowania daty
filterDateInput.addEventListener('change', (e) => {
    fetchArticles(e.target.value);
});

clearFilterBtn.addEventListener('click', () => {
    filterDateInput.value = '';
    fetchArticles();
});

// Pomocnicze zabezpieczenie przed XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Uruchomienie na starcie strony
fetchArticles();