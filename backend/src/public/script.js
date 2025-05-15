// Configuration
const API_BASE_URL = 'http://127.0.0.1:8787';

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

function formatSize(sizeInKB) {
    if (sizeInKB < 1024) {
        return `${sizeInKB} KB`;
    } else if (sizeInKB < 1024 * 1024) {
        return `${(sizeInKB / 1024).toFixed(2)} MB`;
    } else {
        return `${(sizeInKB / (1024 * 1024)).toFixed(2)} GB`;
    }
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    } else if (diffInSeconds < 31536000) {
        return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    } else {
        return `${Math.floor(diffInSeconds / 31536000)} years ago`;
    }
}

// Handle errors in a consistent way
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const errorMessageText = document.getElementById('errorMessageText');
    
    errorMessageText.textContent = message;
    errorMessage.classList.remove('hidden');
    
    document.getElementById('loadingIndicator').classList.add('hidden');
}

// Home page functionality
function initializeHomePage() {
    const repositoriesContainer = document.getElementById('repositoriesContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const refreshButton = document.getElementById('refreshButton');
    const timeframeSelector = document.getElementById('timeframeSelector');
    
    // Initial load of repositories
    loadRepositories(timeframeSelector.value);
    
    // Event listeners
    refreshButton.addEventListener('click', () => {
        loadRepositories(timeframeSelector.value);
    });
    
    timeframeSelector.addEventListener('change', () => {
        loadRepositories(timeframeSelector.value);
    });
    
    function loadRepositories(timeframe) {
        // Reset UI state
        repositoriesContainer.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        document.getElementById('errorMessage').classList.add('hidden');
        
        // Make API request
        axios.get(`${API_BASE_URL}/${timeframe}?enrich=true`)
            .then(response => {
                const data = response.data;
                displayRepositories(data);
            })
            .catch(error => {
                showError(`Failed to load repositories: ${error.message}`);
            });
    }
    
    function displayRepositories(data) {
        // Clear previous content
        repositoriesContainer.innerHTML = '';
        
        if (!data || Object.keys(data).length === 0) {
            repositoriesContainer.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-gray-500 text-lg">No repositories found.</p>
                </div>
            `;
            loadingIndicator.classList.add('hidden');
            repositoriesContainer.classList.remove('hidden');
            return;
        }
        
        // Create and append repository cards
        Object.entries(data).forEach(([repoFullName, repoData]) => {
            const repo = repoData.info?.details || {};
            const score = repoData.score;
            
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 cursor-pointer';
            card.dataset.repo = repoFullName;
            
            // Handle repositories with missing info
            const hasInfo = repoData.info && !repoData.error;
            
            card.innerHTML = `
                <div class="bg-gray-800 text-white p-4">
                    <div class="flex justify-between items-start">
                        <h2 class="text-xl font-semibold truncate" title="${repoFullName}">${repoFullName}</h2>
                        <span class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full ml-2 flex-shrink-0">#${score}</span>
                    </div>
                    ${hasInfo ? `
                    <div class="mt-2 text-sm flex items-center">
                        <img src="${repo.owner?.avatar_url || 'https://via.placeholder.com/30'}" class="w-5 h-5 rounded-full mr-2" alt="Owner avatar">
                        <span>${repo.owner?.login || 'Unknown'}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="p-4">
                    ${hasInfo ? `
                    <p class="text-gray-600 mb-4 line-clamp-3" title="${repo.description || 'No description available'}">
                        ${repo.description || 'No description available'}
                    </p>
                    
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${repo.topics && Array.isArray(repo.topics) ? repo.topics.slice(0, 3).map(topic => 
                            `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${topic}</span>`
                        ).join('') : ''}
                    </div>
                    
                    <div class="flex justify-between text-sm text-gray-500">
                        <div class="flex items-center">
                            <i class="fas fa-star mr-1"></i>
                            <span>${repo.stargazers_count?.toLocaleString() || 0}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-code-branch mr-1"></i>
                            <span>${repo.forks?.toLocaleString() || 0}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-circle mr-1" style="color: ${getLanguageColor(repo.language)}"></i>
                            <span>${repo.language || 'Unknown'}</span>
                        </div>
                    </div>
                    ` : `
                    <p class="text-gray-600 mb-4">
                        ${repoData.error || 'Repository information not available'}
                    </p>
                    <p class="text-sm text-blue-500">Click to attempt to retrieve more details</p>
                    `}
                </div>
            `;
            
            card.addEventListener('click', () => {
                window.location.href = `repo.html?repo=${encodeURIComponent(repoFullName)}`;
            });
            
            repositoriesContainer.appendChild(card);
        });
        
        // Show repositories and hide loading indicator
        loadingIndicator.classList.add('hidden');
        repositoriesContainer.classList.remove('hidden');
    }
    
    // Simplified language color mapping for common languages
    function getLanguageColor(language) {
        if (!language) return '#858585'; // Default gray
        
        const colors = {
            'JavaScript': '#f1e05a',
            'TypeScript': '#2b7489',
            'Python': '#3572A5',
            'Java': '#b07219',
            'Go': '#00ADD8',
            'C++': '#f34b7d',
            'C#': '#178600',
            'PHP': '#4F5D95',
            'Ruby': '#701516',
            'Swift': '#ffac45',
            'Kotlin': '#F18E33',
            'Rust': '#dea584',
            'Dart': '#00B4AB',
            'HTML': '#e34c26',
            'CSS': '#563d7c'
        };
        
        return colors[language] || '#858585';
    }
}

// Detail page functionality
function initializeDetailPage() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const repoDetails = document.getElementById('repoDetails');
    
    // Get repository from URL
    const urlParams = new URLSearchParams(window.location.search);
    const repoFullName = urlParams.get('repo');
    
    if (!repoFullName) {
        showError('No repository specified');
        return;
    }
    
    document.title = `${repoFullName} - Repository Details`;
    
    // Find out which timeframe we're using
    // Try each timeframe in order until we find the repository
    loadRepositoryDetails('day')
        .catch(() => loadRepositoryDetails('week'))
        .catch(() => loadRepositoryDetails('month'))
        .catch(error => {
            showError(`Failed to load repository details: ${error.message}`);
        });
    
    function loadRepositoryDetails(timeframe) {
        return new Promise((resolve, reject) => {
            axios.get(`${API_BASE_URL}/${timeframe}?enrich=true`)
                .then(response => {
                    const data = response.data;
                    
                    // Check if our repository is in the data
                    if (data && data[repoFullName]) {
                        displayRepositoryDetails(data[repoFullName]);
                        resolve();
                    } else {
                        reject(new Error(`Repository not found in ${timeframe} data`));
                    }
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
    
    function displayRepositoryDetails(repoData) {
        // Check if we have enriched data
        if (!repoData.info || repoData.error) {
            showError(`Repository information not available: ${repoData.error || 'Unknown error'}`);
            return;
        }
        
        const repo = repoData.info.details;
        if (!repo) {
            showError('Repository details not available');
            return;
        }
        
        // Fill in repository details
        document.getElementById('repoName').textContent = repo.name;
        document.getElementById('repoRanking').textContent = `#${repoData.score}`;
        
        // Owner info
        const ownerAvatar = document.getElementById('ownerAvatar');
        const ownerName = document.getElementById('ownerName');
        
        if (repo.owner) {
            ownerAvatar.src = repo.owner.avatar_url || 'https://via.placeholder.com/150';
            ownerName.textContent = repo.owner.login;
            ownerName.href = `https://github.com/${repo.owner.login}`;
        }
        
        // Basic information
        document.getElementById('repoDescription').textContent = repo.description || 'No description available';
        document.getElementById('repoStars').textContent = repo.stargazers_count?.toLocaleString() || 0;
        document.getElementById('repoForks').textContent = repo.forks_count?.toLocaleString() || 0;
        document.getElementById('repoIssues').textContent = repo.open_issues?.toLocaleString() || 0;
        document.getElementById('repoWatchers').textContent = repo.watchers_count?.toLocaleString() || 0;
        document.getElementById('repoCreated').textContent = formatDate(repo.created_at);
        document.getElementById('repoUpdated').textContent = formatDate(repo.updated_at);
        document.getElementById('repoBranch').textContent = repo.default_branch || 'master';
        
        // Additional details
        document.getElementById('repoLanguage').textContent = repo.language || 'Not specified';
        document.getElementById('repoLicense').textContent = repo.license?.name || 'Not specified';
        document.getElementById('repoSize').textContent = formatSize(repo.size || 0);
        document.getElementById('repoArchived').textContent = repo.archived ? 'Yes' : 'No';
        document.getElementById('repoPrivate').textContent = repo.private ? 'Yes' : 'No';
        
        // Homepage
        const homepageContainer = document.getElementById('repoHomepageContainer');
        const homepageLink = document.getElementById('repoHomepage');
        
        if (repo.homepage) {
            homepageLink.textContent = repo.homepage;
            homepageLink.href = repo.homepage;
        } else {
            homepageContainer.classList.add('hidden');
        }
        
        // Topics
        const topicsContainer = document.getElementById('repoTopics');
        topicsContainer.innerHTML = '';
        
        if (repo.topics && Array.isArray(repo.topics) && repo.topics.length > 0) {
            repo.topics.forEach(topic => {
                const topicElement = document.createElement('span');
                topicElement.className = 'bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded';
                topicElement.textContent = topic;
                topicsContainer.appendChild(topicElement);
            });
        } else {
            const noTopics = document.createElement('p');
            noTopics.className = 'text-gray-500 italic';
            noTopics.textContent = 'No topics specified';
            topicsContainer.appendChild(noTopics);
        }
        
        // Links
        document.getElementById('repoLink').href = repo.html_url || `https://github.com/${repoFullName}`;
        document.getElementById('issuesLink').href = `${repo.html_url}/issues` || `https://github.com/${repoFullName}/issues`;
        
        // Recent Activity
        displayRecentIssues(repoData.info.issues);
        displayRecentPulls(repoData.info.pulls);
        displayRecentDiscussions(repoData.info.discussions);
        
        // Show repository details and hide loading indicator
        loadingIndicator.classList.add('hidden');
        repoDetails.classList.remove('hidden');
    }
    
    function displayRecentIssues(issues) {
        const issuesContainer = document.getElementById('recentIssues');
        const noIssuesMessage = document.getElementById('noIssuesMessage');
        
        if (!issues || issues.length === 0) {
            return; // Keep the "No recent issues" message visible
        }
        
        // Hide the "no issues" message
        noIssuesMessage.classList.add('hidden');
        
        // Display up to 5 most recent issues
        issues.slice(0, 5).forEach(issue => {
            const issueElement = document.createElement('div');
            issueElement.className = 'border-l-4 border-yellow-500 pl-3 py-2';
            
            issueElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <a href="${issue.html_url || `https://github.com/${repoFullName}/issues/${issue.number}`}" 
                       target="_blank" 
                       class="text-blue-600 hover:underline font-medium">
                        #${issue.number}: ${issue.title}
                    </a>
                    <span class="text-xs text-gray-500">${getTimeAgo(issue.created_at)}</span>
                </div>
                <div class="flex items-center mt-1 text-sm text-gray-600">
                    <img src="${issue.user?.avatar_url || 'https://via.placeholder.com/20'}" class="w-4 h-4 rounded-full mr-1" alt="User avatar">
                    <span>${issue.user?.login || 'Unknown user'}</span>
                    <span class="mx-1">•</span>
                    <span class="${issue.state === 'open' ? 'text-green-600' : 'text-purple-600'}">${issue.state}</span>
                </div>
            `;
            
            issuesContainer.appendChild(issueElement);
        });
    }
    
    function displayRecentPulls(pulls) {
        const pullsContainer = document.getElementById('recentPulls');
        const noPullsMessage = document.getElementById('noPullsMessage');
        
        if (!pulls || pulls.length === 0) {
            return; // Keep the "No recent pull requests" message visible
        }
        
        // Hide the "no pulls" message
        noPullsMessage.classList.add('hidden');
        
        // Display up to 5 most recent pull requests
        pulls.slice(0, 5).forEach(pull => {
            const pullElement = document.createElement('div');
            pullElement.className = 'border-l-4 border-blue-500 pl-3 py-2';
            
            pullElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <a href="${pull.html_url || `https://github.com/${repoFullName}/pull/${pull.number}`}" 
                       target="_blank" 
                       class="text-blue-600 hover:underline font-medium">
                        #${pull.number}: ${pull.title}
                    </a>
                    <span class="text-xs text-gray-500">${getTimeAgo(pull.created_at)}</span>
                </div>
                <div class="flex items-center mt-1 text-sm text-gray-600">
                    <img src="${pull.user?.avatar_url || 'https://via.placeholder.com/20'}" class="w-4 h-4 rounded-full mr-1" alt="User avatar">
                    <span>${pull.user?.login || 'Unknown user'}</span>
                    <span class="mx-1">•</span>
                    <span class="${pull.state === 'open' 
                        ? 'text-green-600' 
                        : (pull.merged_at ? 'text-purple-600' : 'text-red-600')}">
                        ${pull.merged_at ? 'merged' : pull.state}
                    </span>
                </div>
            `;
            
            pullsContainer.appendChild(pullElement);
        });
    }
    
    function displayRecentDiscussions(discussions) {
        const discussionsContainer = document.getElementById('recentDiscussions');
        const noDiscussionsMessage = document.getElementById('noDiscussionsMessage');
        
        if (!discussions || discussions.length === 0) {
            return; // Keep the "No recent discussions" message visible
        }
        
        // Hide the "no discussions" message
        noDiscussionsMessage.classList.add('hidden');
        
        // Display up to 5 most recent discussions
        discussions.slice(0, 5).forEach(discussion => {
            const discussionElement = document.createElement('div');
            discussionElement.className = 'border-l-4 border-green-500 pl-3 py-2';
            
            discussionElement.innerHTML = `
                <div class="flex justify-between items-start">
                    <a href="https://github.com/${repoFullName}/discussions/${discussion.number}" 
                       target="_blank" 
                       class="text-blue-600 hover:underline font-medium">
                        ${discussion.title}
                    </a>
                    <span class="text-xs text-gray-500">${getTimeAgo(discussion.created_at)}</span>
                </div>
                <div class="flex items-center mt-1 text-sm text-gray-600">
                    <img src="${discussion.user?.avatar_url || 'https://via.placeholder.com/20'}" class="w-4 h-4 rounded-full mr-1" alt="User avatar">
                    <span>${discussion.user?.login || 'Unknown user'}</span>
                    ${discussion.category ? `
                    <span class="mx-1">•</span>
                    <span class="flex items-center">
                        ${discussion.category.emoji ? `<span class="mr-1">${discussion.category.emoji}</span>` : ''}
                        ${discussion.category.name}
                    </span>
                    ` : ''}
                </div>
            `;
            
            discussionsContainer.appendChild(discussionElement);
        });
    }
}

// Initialize the correct page functionality based on the current page
document.addEventListener('DOMContentLoaded', () => {
    // Determine which page we're on
    const isHomePage = !window.location.pathname.includes('repo.html');
    
    if (isHomePage) {
        initializeHomePage();
    } else {
        initializeDetailPage();
    }
});
