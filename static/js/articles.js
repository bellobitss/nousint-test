function filterArticles(tag) { 
    const cards = document.querySelectorAll('.article-card');
    const filterDiv = document.querySelector('.category-filter');

    if (!tag) {
        cards.forEach(card => card.style.display = 'block');
        if (filterDiv) {
            filterDiv.innerHTML = `
                <div class="breadcrumb-nav"> 
                    <span class="breadcrumb-current">All Articles</span>
                </div>`;
        }
        window.location.hash = ''; 
        return; 
    }

    window.location.hash = `tag:${tag}`;
    let matchCount = 0;
 
    cards.forEach(card => {
        const tags = Array.from(card.querySelectorAll('.article-tag')).map(t => t.innerText.trim().toLowerCase());
        
        if (tags.includes(tag.toLowerCase())) {
            card.style.display = 'block';
            matchCount++; 
        } else { 
            card.style.display = 'none'; 
        }
    });

    if (filterDiv) {  
        
        filterDiv.innerHTML = `
            <div class="breadcrumb-nav">
                <button class="breadcrumb-btn" onclick="filterArticles('')">All Articles</button>
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-current">Tag: ${tag} (${matchCount})</span>
            </div>
        `;
    }
} 

document.addEventListener('DOMContentLoaded', () => {

    const hash = window.location.hash; 
    if (hash.startsWith('#tag:')) {
        filterArticles(decodeURIComponent(hash.substring(5))); 
    }

    document.querySelectorAll('.article-tag').forEach(tagEl => {
        tagEl.onclick = (e) => {
            e.stopPropagation();
            filterArticles(tagEl.innerText.trim());
        };
    });
}); 