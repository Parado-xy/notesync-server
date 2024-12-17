// Cache version management
const CACHE_VERSION = 'v3.5';
const CACHE_NAME = `NoteSync-${CACHE_VERSION}`;

// Separate cache names
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const EXTERNAL_CACHE = `${CACHE_NAME}-external`;

// Local assets that should be cached immediately
const STATIC_ASSETS = [
    '/logo.svg',
    '/manifest.json',
    '/offline.html',  
    '/notepad.js',
    '/application-classes.js',
    '/notepad-voice.js',
    '/notepad-to-pdf.js',
    '/notepad-save.js',
    '/notepad-auto-read.js',
    '/application-data-sync.js',
    '/home-load.js',
    '/home-search.js',
    '/home.js',
    '/lucide.js'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.quilljs.com/1.3.7/quill.min.js',
    'https://cdn.jsdelivr.net/npm/quill-image-resize@3.0.0/image-resize.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

// HTML and dynamic resources configuration
const DYNAMIC_PATHS = [
    '/',
    '/index',
    '/notepad.js',
    '/application-classes.js',
    '/notepad-voice.js',
    '/notepad-to-pdf.js',
    '/notepad-save.js',
    '/notepad-auto-read.js',
    '/application-data-sync.js',
    '/home-load.js',
    '/home-search.js',
    '/home.js',
    '/api/user'
];


// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(async (cache) => {
                console.log('Caching local static assets');
                
                // Cache local assets
                await cache.addAll(STATIC_ASSETS);
                
                // Fetch external resources separately
                const externalFetches = EXTERNAL_RESOURCES.map(async (url) => {
                    try {
                        // First, check if resource is already in cache
                        const cachedResponse = await caches.match(url);
                        if (cachedResponse) {
                            console.log(`Using cached external resource: ${url}`);
                            return;
                        }

                        // If not in cache, fetch the resource
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`Cached new external resource: ${url}`);
                        } else {
                            console.warn(`Could not cache external resource: ${url}`);
                        }
                    } catch (error) {
                        console.warn(`Failed to fetch external resource: ${url}`, error);
                    }
                });
                
                await Promise.allSettled(externalFetches);
            })
            .then(() => self.skipWaiting())
            .catch(error => {
                console.error('Installation cache error:', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(
                cacheNames
                    .filter(name => 
                        // Keep only the current version caches
                        ![STATIC_CACHE, DYNAMIC_CACHE, EXTERNAL_CACHE].includes(name)
                    )
                    .map(name => {
                        console.log(`Deleting old cache: ${name}`);
                        return caches.delete(name);
                    })
            )
        )
        .then(() => self.clients.claim())
        .catch(error => {
            console.error('Activation cache cleanup error:', error);
        })
    );
});

// Cache-first strategy
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        } else {
            console.log('No Cached Response');
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        // Cache the network response
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn(`Cache-first strategy failed for ${request.url}:`, error);
        
        // Fallback to offline page for HTML requests
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html') || 
                new Response('Offline - Please check your connection', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
        }
        
        throw error;
    }
}

// Network-first strategy
async function networkFirstStrategy(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful network response
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('Network request failed:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to offline page for HTML
        if (request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html') || 
                new Response('Offline - Please check your connection', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
        }
        
        throw error;
    }
}

// Fetch event - handle requests
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Static assets cache-first strategy
    if (STATIC_ASSETS.includes(url.pathname)) {
        event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
        return;
    }
    
    // External resources cache-first strategy
    if (EXTERNAL_RESOURCES.includes(event.request.url)) {
        event.respondWith(cacheFirstStrategy(event.request, EXTERNAL_CACHE));
        return;
    }
    
    // Dynamic paths network-first strategy
    if (DYNAMIC_PATHS.includes(url.pathname) || 
        event.request.headers.get('accept').includes('text/html')) {
        event.respondWith(networkFirstStrategy(event.request));
        return;
    }
    
    // Default to network for other requests
    event.respondWith(fetch(event.request));
});

// Handle service worker updates
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
