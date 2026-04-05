/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    // Prevents webpack from bundling pdf-parse (avoids test-file side-effect)
    serverComponentsExternalPackages: ['pdf-parse', 'msedge-tts'],
  },
  webpack: (webpackConfig, { isServer }) => {
    if (isServer) {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        canvas: false,
        encoding: false,
      }
    }
    return webpackConfig
  },
}

export default config
