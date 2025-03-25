.getElementById("fetchRepos")?.addEventListener("click", () => {
    fetch("https://api.github.com/search/repositories?q=stars:>10000&sort=stars&order=desc") // Fetch popular repos
        .then((response: Response) => response.json())
        .then((data: { items: { full_name: string }[] }) => {
            const repoList = document.getElementById("repoList") as HTMLUListElement;
            if (!repoList) return;

            repoList.innerHTML = ""; // Clear previous entries

            data.items.slice(0, 10).forEach((repo) => { // Display top 10 repositories
                const listItem = document.createElement("li");
                const link = document.createElement("a");

                link.href = `repo.html?repo=${encodeURIComponent(repo.full_name)}`; // Pass repo name in URL
                link.textContent = repo.full_name;
                link.target = "_blank"; // Open in a new tab

                listItem.appendChild(link);
                repoList.appendChild(listItem);
            });
        })
        .catch((error: Error) => console.error("Error fetching repos:", error));
});
