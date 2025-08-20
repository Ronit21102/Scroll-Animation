/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/videos/l-optimal',
        destination: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/l-optimal-miCCsBcdvfXlbTuJfnhS99dKkx4YyK.mp4'
      },
      {
        source: '/videos/near-optimal', 
        destination: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/near-optimal-wflDaYfzkxx7dxVocCKY1tBEVmpGNm.mp4'
      },
      {
        source: '/videos/misa-optimal',
        destination: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/misa-optimal-L980Pf7WSr6Iwt7IhRMNpcXRHgGTgE.mp4'
      },
      {
        source: '/videos/kira-optimal',
        destination: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kira-optimal-8Nd0RnmFdhaQOlMXmVNiLUkm0pYl0P.mp4'
      },
      {
        source: '/videos/ryuk-optimal',
        destination: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ryuk-optimal-r3riP6qJQhN96xmuJzOiDlVSdaXsRJ.mp4'
      },
      {
        source: '/videos/jd-optimal',
        destination: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jd-optimal-gsupu5UMBt9hrXKfy4PRG2qlLdgouh.mp4'
      }
    ]
  },
  async headers() {
    return [
      {
        source: '/videos/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  }
}

export default nextConfig
