// Repository fetching script for frontend category page
document.addEventListener('DOMContentLoaded', function() {
    // Container for the repositories
    const reposContainer = document.querySelector('.space-y-4');
    
    // Show loading state
    reposContainer.innerHTML = `
      <div class="bg-slate-800 rounded-xl p-6 flex justify-center">
        <div class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xl font-medium text-gray-300">Loading repositories...</span>
        </div>
      </div>
    `;
  
    // Function to fetch repos from the API
    async function fetchRepos() {
      try {
        const response = await fetch('http://localhost:45943');
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching repositories:', error);
        reposContainer.innerHTML = `
          <div class="bg-slate-800 rounded-xl p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-xl font-bold text-red-400">Error Loading Repositories</h3>
            <p class="text-gray-400 mt-2">Could not connect to the repository API. Please try again later.</p>
            <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 transition-colors" onclick="location.reload()">
              Retry
            </button>
          </div>
        `;
        return null;
      }
    }
  
    // Function to get language color
    function getLanguageColor(language) {
      const colors = {
        'JavaScript': '#f1e05a',
        'TypeScript': '#3178c6',
        'HTML': '#e34c26',
        'CSS': '#563d7c',
        'Python': '#3572A5',
        'Java': '#b07219',
        'PHP': '#4F5D95',
        'C#': '#178600',
        'Ruby': '#701516',
        'Go': '#00ADD8',
        'Swift': '#F05138',
        'Kotlin': '#A97BFF',
        'Rust': '#DEA584',
        'Dart': '#00B4AB',
        'Shell': '#89e051',
        'Vue': '#41B883'
      };
      
      return colors[language] || '#8f8f8f'; // Default gray color if language not found
    }
  
    // Function to format date
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  
    // Function to render repos
    function renderRepos(repos) {
      if (!repos || repos.length === 0) {
        reposContainer.innerHTML = `
          <div class="bg-slate-800 rounded-xl p-6 text-center">
            <h3 class="text-xl font-bold">No repositories found</h3>
            <p class="text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
          </div>
        `;
        return;
      }
  
      // Clear the loading indicator
      reposContainer.innerHTML = '';
  
      // Create HTML for each repo
      repos.forEach(repo => {
        // Extract required data
        const {
          name,
          owner,
          description,
          watchers_count,
          language,
          has_wiki,
          forks_count,
          updated_at,
          subscribers_count
        } = repo;
        
        // Create repo card element
        const repoElement = document.createElement('div');
        repoElement.className = 'bg-slate-800 rounded-xl p-6 card-hover';
        
        repoElement.innerHTML = `
          <div class="flex justify-between">
            <div class="flex items-start">
              <div class="w-12 h-12 rounded-md flex items-center justify-center mr-4 overflow-hidden">
                <img src="${owner.avatar_url}" alt="${owner.login}" class="w-full h-full object-cover">
              </div>
              <div class="flex-1">
                <div class="flex items-center flex-wrap gap-2">
                  <h3 class="text-lg font-bold">${owner.login}/${name}</h3>
                  ${has_wiki ? '<span class="px-2 py-1 text-xs font-medium rounded-full bg-purple-900 text-purple-300">Wiki</span>' : ''}
                </div>
                <p class="text-gray-400 mt-1">${description || 'No description available'}</p>
                
                <div class="flex items-center mt-4 space-x-6 flex-wrap">
                  ${language ? `
                  <div class="flex items-center">
                    <span class="lang-dot" style="background-color: ${getLanguageColor(language)}"></span>
                    <span class="text-sm text-gray-400">${language}</span>
                  </div>
                  ` : ''}
                  
                  <div class="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span class="font-bold">${watchers_count.toLocaleString()}</span>
                  </div>
                  
                  <div class="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>${forks_count.toLocaleString()}</span>
                  </div>
                  
                  <div class="flex items-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>${subscribers_count.toLocaleString()}</span>
                  </div>
                </div>
                
                <div class="text-sm text-gray-500 mt-3">
                  Updated on ${formatDate(updated_at)}
                </div>
              </div>
            </div>
          </div>
        `;
        
        reposContainer.appendChild(repoElement);
      });
    }
  
    // Initialize: fetch and render repos
    fetchRepos().then(repos => {
      if (repos) {
        renderRepos(repos);
        
        // Update the repository count in the category header if present
        const categoryHeader = document.querySelector('.category-header-count');
        if (categoryHeader) {
          categoryHeader.textContent = `${repos.length} repositories`;
        }
        
        // Setup filter functionality
        setupFilters(repos);
      }
    });
  
    // Setup filter functionality
    function setupFilters(allRepos) {
      // Language filter
      const languageFilter = document.querySelector('select[class*="bg-transparent"][class*="border-none"]:nth-of-type(1)');
      if (languageFilter) {
        // Clear existing options
        languageFilter.innerHTML = '<option value="all">All</option>';
        
        // Get unique languages
        const languages = [...new Set(allRepos.filter(repo => repo.language).map(repo => repo.language))];
        
        // Add options for each language
        languages.forEach(language => {
          const option = document.createElement('option');
          option.value = language;
          option.textContent = language;
          languageFilter.appendChild(option);
        });
        
        // Add event listener
        languageFilter.addEventListener('change', function() {
          const selectedLanguage = this.value;
          const filteredRepos = selectedLanguage === 'all' 
            ? allRepos 
            : allRepos.filter(repo => repo.language === selectedLanguage);
          renderRepos(filteredRepos);
        });
      }
      
      // Sort by filter
      const sortFilter = document.querySelector('select[class*="bg-transparent"][class*="border-none"]:nth-of-type(2)');
      if (sortFilter) {
        sortFilter.addEventListener('change', function() {
          const sortValue = this.value;
          let sortedRepos = [...allRepos];
          
          switch(sortValue) {
            case 'stars':
              sortedRepos.sort((a, b) => b.watchers_count - a.watchers_count);
              break;
            case 'forks':
              sortedRepos.sort((a, b) => b.forks_count - a.forks_count);
              break;
            case 'updated':
              sortedRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
              break;
            case 'created':
              // If created_at exists in the data
              if (sortedRepos[0].created_at) {
                sortedRepos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              }
              break;
          }
          
          renderRepos(sortedRepos);
        });
      }
    }
  });