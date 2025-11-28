const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Vega/Vega-Liteのcanvas依存関係を処理
    if (!isServer) {
      // クライアントサイドではcanvas関連を無視
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        'canvas': false,
      };
    }
    
    // vega-canvasを空のモジュールとして提供（ブラウザでは不要）
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
      'vega-canvas': false,
    };
    
    // vega-canvasモジュールを無視（IgnorePluginを使用）
    if (!isServer) {
      // クライアントサイドでのみ適用
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /^vega-canvas$/,
          require.resolve('./lib/vega-canvas-stub.js')
        ),
        new webpack.IgnorePlugin({
          resourceRegExp: /^canvas$/,
        })
      );
    }
    
    // @tanstack/react-queryのvendor-chunks問題を解決
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: false,
            vendors: false,
            '@tanstack': {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'vendor-chunks/@tanstack',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }
    
    return config;
  },
}

module.exports = nextConfig

