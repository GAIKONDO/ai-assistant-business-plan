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
    
    return config;
  },
}

module.exports = nextConfig

