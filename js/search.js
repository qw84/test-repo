document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-wide');
    const searchButton = document.getElementById('search-button');
    const postsList = document.querySelector('.posts-list');
    const postsCount = document.getElementById('posts-count');
    const projectsCount = document.getElementById('projects-count');
    const toggleTagsBtn = document.getElementById('toggle-tags');
    const selectedTagsContainer = document.getElementById('selected-tags');
    const availableTagsDropdown = document.getElementById('available-tags-dropdown');
    const availableTagsContainer = document.getElementById('available-tags');
    if (!searchInput || !searchButton || !postsList) return;
    const isPostsPage = window.location.pathname.includes('/posts.html');
    const isProjectsPage = window.location.pathname.includes('/projects.html');
    
    const originalHTML = postsList.innerHTML;
    let allPosts = [];
    let allProjects = [];
    let allTags = new Set();
    let selectedTags = new Set();
    let shouldSearch = false;
    const savedQuery = sessionStorage.getItem('searchQuery');
    if (savedQuery) {
        sessionStorage.removeItem('searchState');
        searchInput.value = savedQuery;
        sessionStorage.removeItem('searchQuery');
        shouldSearch = true;
    } else {
        shouldSearch = restoreSearchState();
    }
    document.querySelectorAll('#search-tabs a').forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            saveSearchState();
            setTimeout(() => {
                window.location.href = this.href;
            }, 100);
        });
    });
    function saveSearchState() {
        const state = {
            query: searchInput.value,
            tags: Array.from(selectedTags)
        };
        sessionStorage.setItem('searchState', JSON.stringify(state));
    }
    function restoreSearchState() {
        const savedState = sessionStorage.getItem('searchState');
        if (savedState) {
            const state = JSON.parse(savedState);
            searchInput.value = state.query || '';
            selectedTags = new Set(state.tags || []);
            renderSelectedTags();
            return true;
        }
        return false;
    }
    fetch('/test-repo/data.json')
    .then(res => res.json())
    .then(data => {
        allPosts = data.posts || [];
        allProjects = data.projects || [];
        [...allPosts, ...allProjects].forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => allTags.add(tag));
            }
        });
        if (postsCount) postsCount.textContent = allPosts.length;
        if (projectsCount) projectsCount.textContent = allProjects.length;
        renderAvailableTags();
        if (shouldSearch) {
            setTimeout(() => {
                performSearch();
                searchInput.classList.add('highlight-search');
                setTimeout(() => {
                    searchInput.classList.remove('highlight-search');
                }, 2000);
            }, 100);
        }
    });
    function renderAvailableTags() {
        if (!availableTagsContainer) return;
        availableTagsContainer.innerHTML = '';
        const tagsArray = Array.from(allTags).sort();
        const columns = 2;
        const perColumn = Math.ceil(tagsArray.length / columns);
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'tags-column';
            tagsArray.slice(i * perColumn, (i + 1) * perColumn).forEach(tag => {
                const tagElement = document.createElement('div');
                tagElement.className = 'available-tag';
                tagElement.textContent = tag;
                tagElement.onclick = () => {
                    selectedTags.add(tag);
                    renderSelectedTags();
                    performSearch();
                    if (availableTagsDropdown) {
                        availableTagsDropdown.style.display = 'none';
                    }
                };
                column.appendChild(tagElement);
            });
            availableTagsContainer.appendChild(column);
        }
    }
    function renderSelectedTags() {
        if (!selectedTagsContainer) return;
        selectedTagsContainer.innerHTML = '';
        selectedTags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'selected-tag';
            tagElement.textContent = tag;
            tagElement.onclick = () => {
                selectedTags.delete(tag);
                renderSelectedTags();
                performSearch();
            };
            selectedTagsContainer.appendChild(tagElement);
        });
    }
    function filterItems(items) {
        const query = searchInput.value.trim().toLowerCase();
        return items.filter(item => {
            const matchesText = item.title.toLowerCase().includes(query);
            if (selectedTags.size === 0) {
                return matchesText;
            }
            const matchesTags = item.tags && 
                               Array.from(selectedTags).every(tag => 
                                   item.tags.includes(tag)
                               );
            return matchesText && matchesTags;
        });
    }
    function performSearch() {
        const filteredPosts = filterItems(allPosts);
        const filteredProjects = filterItems(allProjects);
        if (isPostsPage) {
            renderResults(filteredPosts);
            if (postsCount) postsCount.textContent = filteredPosts.length;
            if (projectsCount) projectsCount.textContent = filteredProjects.length;
        } 
        else if (isProjectsPage) {
            renderResults(filteredProjects);
            if (postsCount) postsCount.textContent = filteredPosts.length;
            if (projectsCount) projectsCount.textContent = filteredProjects.length;
        }
        saveSearchState();
    }
    function renderResults(results) {
        let newHTML = '';
        results.forEach(item => {
            newHTML += `
                <a class="post-item-link" href="${item.url}">
                    <div class="post-content">
                        <span class="post-title">${item.title}</span>
                        <span class="date">${item.date}</span>
                    </div>
                </a>
            `;
        });
        postsList.innerHTML = newHTML || `<p>No matching ${isPostsPage ? 'posts' : 'projects'} found</p>`;
    }
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', e => e.key === 'Enter' && performSearch());
    if (toggleTagsBtn && availableTagsDropdown) {
        toggleTagsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = availableTagsDropdown.style.display === 'block';
            availableTagsDropdown.style.display = isOpen ? 'none' : 'block';
        });
    }
    document.addEventListener('click', (e) => {
        if (availableTagsDropdown && 
            !availableTagsDropdown.contains(e.target) && 
            e.target !== toggleTagsBtn) {
            availableTagsDropdown.style.display = 'none';
        }
    });
    renderSelectedTags();
});