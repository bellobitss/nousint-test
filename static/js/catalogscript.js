let catalogState = {

    mode: window.location.pathname.includes('red') || document.querySelector('.fullscreen-btn[onclick*="red"]') ? 'red' : 'blue',
    nav: 'categories', // categories | subcategories | tools
    cat: null,
    sub: null
};

// JSON for new tools and categories
const db = {

    blue: {
        opsec: {
            meta: { desc: 'Operational Security tools to protect your online presence and identity.' },
            anonymity: [
                { name: 'Tor Browser', url: 'https://www.torproject.org/', cat: 'Browser', desc: 'The standard for anonymous internet browsing.' },
                { name: 'I2P', url: 'https://geti2p.net/', cat: 'Network', desc: 'Anonymous overlay network.' }
            ],
            'vpn-providers': [
                { name: 'Mullvad', url: 'https://mullvad.net/', cat: 'VPN', desc: 'Privacy-focused VPN service.' }
            ]
        },
        encryption: {
            meta: { desc: 'Tools for securing communications and data storage.' },
            messaging: [
                { name: 'Signal', url: 'https://signal.org/', cat: 'Messaging', desc: 'Encrypted instant messaging.' }
            ]
        },
        privacy: {
            meta: { desc: 'Resources for reclaiming and maintaining digital privacy.' },
            email: [
                { name: 'ProtonMail', url: 'https://proton.me/mail', cat: 'Email', desc: 'Secure email based in Switzerland.' }
            ]
        },
        'intelligence-protocols': {
            meta: { desc: 'Standard operating procedures for intelligence gathering.' },
            guides: []
        }
    },

    red: {
        reconnaissance: {
            meta: { desc: 'Information gathering tools and techniques.' },
            username: [
                { name: 'Sherlock', url: 'https://github.com/sherlock-project/sherlock', cat: 'Username', desc: 'Find usernames across social networks.' },
                { name: 'WhatsMyName', url: 'https://whatsmyname.app/', cat: 'Username', desc: 'Username enumeration tool.' },
                { name: 'Maigret', url: 'https://github.com/soxoj/maigret', cat: 'Username', desc: 'Collect a dossier on a person by username.' },
                { name: 'Social Analyzer', url: 'https://github.com/qeeqbox/social-analyzer', cat: 'Username', desc: 'API, CLI & Web App for analyzing profiles.' },
                { name: 'Name-Seeker', url: 'https://github.com/funnyzak/name-seeker', cat: 'Username', desc: 'Username search tool.' },
                { name: 'Snoop', url: 'https://github.com/snoop-project/snoop', cat: 'Username', desc: 'Forensic OSINT tool for searching nicknames.' },
                { name: 'Recon-ng', url: 'https://github.com/lanmaster53/recon-ng', cat: 'Username', desc: 'Web Reconnaissance framework.' },
                { name: 'SocialPath', url: 'https://github.com/Belane/SocialPath', cat: 'Username', desc: 'Tracks users across social media platforms.' }
            ],
            email: [
                { name: 'HaveIBeenPwned', url: 'https://haveibeenpwned.com/', cat: 'Email', desc: 'Check if email has been compromised.' },
                { name: 'Hunter.io', url: 'https://hunter.io/', cat: 'Email', desc: 'Find email addresses for a domain.' }
            ],
            domain: [
                { name: 'Whois', url: 'https://lookup.icann.org/', cat: 'Domain', desc: 'Lookup domain registration info.' },
                { name: 'theHarvester', url: 'https://github.com/laramies/theHarvester', cat: 'Domain', desc: 'E-mails, subdomains and names Harvester.' },
                { name: 'DNSHistory', url: 'https://dnshistory.org/', cat: 'Domain', desc: 'Historical DNS records.' }
            ],
            'source-code': [
                { name: 'PublicWWW', url: 'https://publicwww.com/', cat: 'Source Code', desc: 'Source code search engine.' },
                { name: 'NerdyData', url: 'https://nerdydata.com/', cat: 'Source Code', desc: "Search the web's source code." },
                { name: 'SearchCode', url: 'https://searchcode.com/', cat: 'Source Code', desc: 'Search over 20 billion lines of code.' },
                { name: 'Grep.app', url: 'https://grep.app/', cat: 'Source Code', desc: 'Search across a half million git repos.' }
            ],
            network: [
                { name: 'Censys', url: 'https://search.censys.io/', cat: 'Network', desc: 'Search engine for internet-connected devices.' },
                { name: 'BGP.tools', url: 'https://bgp.tools/', cat: 'Network', desc: 'Real-time BGP data and looking glass.' }
            ]
        },
        'social-engineering': {
            meta: { desc: 'Tools for testing human vulnerabilities.' },
            phishing: [
                { name: 'GoPhish', url: 'https://getgophish.com/', cat: 'Phishing', desc: 'Open-Source Phishing Catalog.' }
            ]
        },
        'vulnerability-analysis': {
            meta: { desc: 'Scanning and identifying weaknesses.' },
            scanners: [
                { name: 'Nmap', url: 'https://nmap.org/', cat: 'Scanner', desc: 'Network Scanner.' }
            ]
        },
        geolocation: {
            meta: { desc: 'Tools for geolocation and mapping.' }
        }
    }
};

// DONT REMOVE TS: formats messy keys
const formatName = (str) => str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// updates screen
function renderCatalog() {

    const filterDiv = document.querySelector('.category-filter');
    const gridDiv = document.querySelector('.tools-grid');
    if (!filterDiv || !gridDiv) return;

    let gridHtml = "";
    let currentDb = db[catalogState.mode];

    let breadcrumb = `<button class="breadcrumb-btn" onclick="catalogState.nav='categories'; renderCatalog()">Categories</button>`;
    if (catalogState.cat) {
        breadcrumb += ` <span class="breadcrumb-separator">></span> <button class="breadcrumb-btn" onclick="catalogState.nav='subcategories'; renderCatalog()">${formatName(catalogState.cat)}</button>`;
    }
    if (catalogState.sub) {
        breadcrumb += ` <span class="breadcrumb-separator">></span> <span class="breadcrumb-current">${formatName(catalogState.sub)}</span>`;
    }
    
    // Only show breadcrumbs if not at the root
    filterDiv.innerHTML = catalogState.nav !== 'categories' ? `<div class="breadcrumb-nav">${breadcrumb}</div>` : '';

    // Render Categories
    if (catalogState.nav === 'categories') {

        gridHtml = `<div class="filter-buttons-container">`;
        for (let cat in currentDb) {
            gridHtml += `
                <div class="category-card" onclick="catalogState.cat='${cat}'; catalogState.nav='subcategories'; renderCatalog()">
                    <div class="category-cover"><div class="logo-placeholder"></div></div>
                    <div class="category-content">
                        <div class="category-name">${formatName(cat)}</div>
                        <div class="category-description">${currentDb[cat].meta?.desc || ''}</div>
                    </div>
                </div>`;
        }
        gridHtml += `</div>`;

    } 
    // Render subcategories
    else if (catalogState.nav === 'subcategories') {

        gridHtml = `<div class="subcategory-grid">`;
        let subs = currentDb[catalogState.cat];
        let hasSubs = false;

        for (let sub in subs) {
            if(sub === 'meta') 
                continue;
            hasSubs = true;
            let toolCount = subs[sub].length || 0;
            gridHtml += `
                <div class="subcategory-card" onclick="catalogState.sub='${sub}'; catalogState.nav='tools'; renderCatalog()">
                    <div class="subcategory-name">${formatName(sub)}</div>
                    <div class="subcategory-count">${toolCount} tools</div>
                    <div class="subcategory-description">Click to explore tools</div>
                </div>`;
        }
        
        if (!hasSubs) gridHtml = '<div class="selection-prompt">No subcategories found.</div>';
        gridHtml += `</div>`;

    } 
    // Render Tools
    else if (catalogState.nav === 'tools') {
        gridHtml = `<div class="tool-category-grid">`;
        let tools = currentDb[catalogState.cat][catalogState.sub] || [];
        
        if (tools.length === 0) {
            gridHtml += '<div style="color:white; padding:20px;">No tools found in this subcategory.</div>';
        }

        tools.forEach(t => {
            // Lazy domain grabber to fetch favicons dynamically
            let domain = "google.com";
            try { domain = new URL(t.url).hostname; } catch(e) {}
            let icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            
            gridHtml += `
                <div class="tool-item" onclick="window.open('${t.url}', '_blank')">
                    <div class="tool-name">${t.name}</div>
                    <div class="tool-category-badge">${t.cat || 'General'}</div>
                    <div class="tool-description">${t.desc || ''}</div>
                    <img class="tool-logo" src="${icon}" onerror="this.style.display='none'" style="width:100%; height:100%; object-fit:contain;">
                </div>`;
        });
        gridHtml += `</div>`;
    }

    gridDiv.innerHTML = `<div class="tools-scroll-container">${gridHtml}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.catalog-preview') || document.querySelector('.catalog-fullscreen')) {
        renderCatalog();
    }
});