import '@coinbase/onchainkit/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

// Import dynamically to ensure it's loaded as a client component
const ClientWrapper = dynamic(() => import('../components/providers/ClientWrapper'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'Pixie Wallet',
  description: 'An embedded EVM smart wallet powered by Coinbase CDP SDK',
  manifest: '/manifest.json',
  themeColor: '#312e81',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pixie Wallet',
  },
  icons: {
    icon: '/fairy.png',
    apple: [
      { url: '/fairy.png' },
      { url: '/fairy.png', sizes: '512x512' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/fairy.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/fairy.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background dark">
        <ClientWrapper>
          {children}
        </ClientWrapper>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
              
              // Fairy cursor sparkle effect
              document.addEventListener('DOMContentLoaded', function() {
                // Apply cursor: none to html and body to completely hide the default cursor
                document.documentElement.style.cursor = 'none';
                document.body.style.cursor = 'none';
                
                // Create a custom fairy cursor that follows the mouse
                const fairyCursor = document.createElement('div');
                fairyCursor.style.position = 'fixed';
                fairyCursor.style.width = '32px';
                fairyCursor.style.height = '32px';
                fairyCursor.style.backgroundImage = 'url(/fairy.png)';
                fairyCursor.style.backgroundSize = 'contain';
                fairyCursor.style.backgroundRepeat = 'no-repeat';
                fairyCursor.style.backgroundPosition = 'center';
                fairyCursor.style.pointerEvents = 'none';
                fairyCursor.style.zIndex = '10000';
                fairyCursor.style.transition = 'transform 0.05s ease';
                document.body.appendChild(fairyCursor);
                
                // Create sparkle particles container
                const sparkleContainer = document.createElement('div');
                sparkleContainer.style.position = 'fixed';
                sparkleContainer.style.pointerEvents = 'none';
                sparkleContainer.style.zIndex = '9999';
                document.body.appendChild(sparkleContainer);
                
                // Function to create a single sparkle particle
                function createSparkle(x, y) {
                  const sparkle = document.createElement('div');
                  
                  // Random sparkle properties
                  const size = Math.random() * 8 + 4; // Random size between 4-12px
                  const angle = Math.random() * 360; // Random angle for position
                  const distance = Math.random() * 30 + 20; // Random distance from cursor (20-50px)
                  const duration = Math.random() * 600 + 400; // Random duration (400-1000ms)
                  const hue = Math.random() * 60 + 280; // Random hue (purples/pinks)
                  
                  // Calculate position around the cursor
                  const radian = angle * (Math.PI / 180);
                  const offsetX = Math.cos(radian) * distance;
                  const offsetY = Math.sin(radian) * distance;
                  
                  // Set sparkle style
                  sparkle.style.position = 'absolute';
                  sparkle.style.width = \`\${size}px\`;
                  sparkle.style.height = \`\${size}px\`;
                  sparkle.style.left = \`\${x + offsetX}px\`;
                  sparkle.style.top = \`\${y + offsetY}px\`;
                  sparkle.style.backgroundColor = \`hsl(\${hue}, 100%, 75%)\`;
                  sparkle.style.borderRadius = '50%';
                  sparkle.style.pointerEvents = 'none';
                  sparkle.style.boxShadow = \`0 0 \${size/2}px \${size/4}px rgba(\${hue}, 100%, 75%, 0.5)\`;
                  sparkle.style.transform = 'scale(0)';
                  sparkle.style.opacity = '1';
                  
                  // Set animation with transform and opacity
                  sparkle.animate([
                    { transform: 'scale(0)', opacity: 0 },
                    { transform: 'scale(1)', opacity: 1, offset: 0.2 },
                    { transform: 'scale(0.8)', opacity: 0.8, offset: 0.4 },
                    { transform: 'scale(0.5)', opacity: 0.5, offset: 0.7 },
                    { transform: 'scale(0)', opacity: 0 }
                  ], {
                    duration: duration,
                    easing: 'ease-out',
                    fill: 'forwards'
                  });
                  
                  // Add to container and remove when animation completes
                  sparkleContainer.appendChild(sparkle);
                  setTimeout(() => {
                    sparkle.remove();
                  }, duration);
                  
                  return sparkle;
                }
                
                // Track mouse movement
                let lastMoveTime = 0;
                let isMoving = false;
                let mouseX = 0;
                let mouseY = 0;
                let lastX = 0;
                let lastY = 0;
                let sparkleInterval = null;
                
                function updateCursor(e) {
                  mouseX = e.clientX;
                  mouseY = e.clientY;
                  
                  // Calculate mouse velocity
                  const dx = mouseX - lastX;
                  const dy = mouseY - lastY;
                  const distance = Math.sqrt(dx*dx + dy*dy);
                  
                  // Update the main fairy cursor position
                  fairyCursor.style.left = (mouseX - 16) + 'px';
                  fairyCursor.style.top = (mouseY - 16) + 'px';
                  
                  if (!isMoving && distance > 5) {
                    isMoving = true;
                    fairyCursor.style.transform = 'scale(1.1)';
                    
                    // Start creating sparkles at interval while moving
                    if (!sparkleInterval) {
                      sparkleInterval = setInterval(() => {
                        if (isMoving && distance > 8) {
                          const sparkleCount = Math.min(3, Math.floor(distance / 10)); // More sparkles for faster movement
                          for (let i = 0; i < sparkleCount; i++) {
                            createSparkle(mouseX, mouseY);
                          }
                        }
                      }, 50);
                    }
                  }
                  
                  // Clear any existing timeout
                  clearTimeout(window.fairyMovementTimeout);
                  
                  // Set a timeout to detect when movement stops
                  window.fairyMovementTimeout = setTimeout(() => {
                    isMoving = false;
                    fairyCursor.style.transform = 'scale(1)';
                    
                    // Stop sparkle interval when not moving
                    if (sparkleInterval) {
                      clearInterval(sparkleInterval);
                      sparkleInterval = null;
                    }
                  }, 100);
                  
                  // Only create sparkles when the mouse moves quickly
                  const now = Date.now();
                  if (distance > 15 && now - lastMoveTime > 30) {
                    const sparkleCount = Math.min(5, Math.floor(distance / 8)); // More sparkles for faster movement
                    for (let i = 0; i < sparkleCount; i++) {
                      createSparkle(mouseX, mouseY);
                    }
                    lastMoveTime = now;
                  }
                  
                  lastX = mouseX;
                  lastY = mouseY;
                }
                
                // Listen for mouse movement
                document.addEventListener('mousemove', updateCursor);
                
                // Initial cursor positioning
                updateCursor({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
                                
                // Force cursor:none on all elements through a style tag
                const styleElement = document.createElement('style');
                styleElement.textContent = '* { cursor: none !important; }';
                document.head.appendChild(styleElement);
                
                // Also apply it to any new elements that might be added dynamically
                const observer = new MutationObserver(function(mutations) {
                  mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                      mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                          node.style.cursor = 'none';
                          const children = node.querySelectorAll('*');
                          children.forEach(el => {
                            el.style.cursor = 'none';
                          });
                        }
                      });
                    }
                  });
                });
                
                observer.observe(document.body, { 
                  childList: true, 
                  subtree: true 
                });
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
