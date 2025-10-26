<template>
  <div>
    <!-- Global auth loader - shows immediately on page load -->
    <ClientOnly>
      <div
        id="global-auth-loader"
        style="
          position: fixed;
          inset: 0;
          background-color: rgb(249 250 251);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        "
      >
        <div style="text-align: center">
          <svg
            style="
              width: 3rem;
              height: 3rem;
              color: rgb(79 70 229);
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            "
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style="opacity: 0.25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              style="opacity: 0.75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p
            style="
              font-size: 1.125rem;
              font-weight: 600;
              color: rgb(17 24 39);
              margin-bottom: 0.5rem;
            "
          >
            Smart Homes
          </p>
          <p style="font-size: 0.875rem; color: rgb(75 85 99)">Loading...</p>
        </div>
      </div>
    </ClientOnly>

    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  #global-auth-loader {
    background-color: rgb(17 24 39) !important;
  }
  #global-auth-loader p:first-of-type {
    color: rgb(255 255 255) !important;
  }
  #global-auth-loader p:last-of-type {
    color: rgb(209 213 219) !important;
  }
}
</style>
