import { useState } from "react";

interface Repo {
    id: number;
    node_id: string;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      type: string;
      user_view_type: string;
      site_admin: boolean;
    };
    description: string;
    fork: boolean;
    url: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    homepage: string;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string;
    has_issues: boolean;
    has_projects: boolean;
    has_downloads: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    has_discussions: boolean;
    forks_count: number;
    archived: boolean;
    disabled: boolean;
    open_issues_count: number;
    license: {
      key: string;
      name: string;
      spdx_id: string;
      url: string;
      node_id: string;
    };
    allow_forking: boolean;
    is_template: boolean;
    web_commit_signoff_required: boolean;
    topics: Record<string, unknown>;
    visibility: string;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    permissions: {
      admin: boolean;
      maintain: boolean;
      push: boolean;
      triage: boolean;
      pull: boolean;
    };
    temp_clone_token: string;
    custom_properties: {
      currentRepoStatus: string;
      "global-rulesets-opt-out": string;
    };
    organization: {
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      type: string;
      user_view_type: string;
      site_admin: boolean;
    };
    network_count: number;
    subscribers_count: number;
}
  


const getNewReposToday = () => {
    const [first, setFirst] = useState<any>(null);
    const [second, setSecond] = useState<any>(null);
    const [third, setThird] = useState<any>(null);
    const [topRepoList, setTopRepoList] = useState<any>(null);
    const [error, setError] = useState<string>("");

    const handleRetrieve = async () => {
        try {
            const endpoint = "https://popular.forgithub.com/index.json"
            const response = await fetch(endpoint)
            const data: Repo[] = await response.json();
            setTopRepoList(data);

            if (data.length >= 3) {
                setFirst(data[0]);
                setSecond(data[1]);
                setThird(data[2]);
            }

        }catch (err) {
            setError("Failed to retrieve list of repos :)))).");
            setTopRepoList(null);
        }    
        
    }




}