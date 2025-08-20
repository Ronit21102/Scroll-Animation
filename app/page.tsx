"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Use direct blob URLs in development, rewritten URLs in production
const isDevelopment = process.env.NODE_ENV !== "production"

const videos = [
  {
    name: "L",
    src: isDevelopment
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/l-optimal-miCCsBcdvfXlbTuJfnhS99dKkx4YyK.mp4"
      : "/videos/l-optimal",
  },
  {
    name: "Near",
    src: isDevelopment
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/near-optimal-wflDaYfzkxx7dxVocCKY1tBEVmpGNm.mp4"
      : "/videos/near-optimal",
  },
  {
    name: "Misa",
    src: isDevelopment
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/misa-optimal-L980Pf7WSr6Iwt7IhRMNpcXRHgGTgE.mp4"
      : "/videos/misa-optimal",
  },
  {
    name: "Kira",
    src: isDevelopment
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kira-optimal-8Nd0RnmFdhaQOlMXmVNiLUkm0pYl0P.mp4"
      : "/videos/kira-optimal",
  },
  {
    name: "Ryuk",
    src: isDevelopment
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ryuk-optimal-r3riP6qJQhN96xmuJzOiDlVSdaXsRJ.mp4"
      : "/videos/ryuk-optimal",
  },
  {
    name: "JD",
    src: isDevelopment
      ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jd-optimal-gsupu5UMBt9hrXKfy4PRG2qlLdgouh.mp4"
      : "/videos/jd-optimal",
  },
]

export default function ScrollVideoPlayer() {
  const [areVideosLoading, setAreVideosLoading] = useState(true)
  const [isContentLoaded, setIsContentLoaded] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isBatterySavingMode, setIsBatterySavingMode] = useState(false)
  const [showBatteryWarning, setShowBatteryWarning] = useState(false)
  const [hasVideoPlaybackStarted, setHasVideoPlaybackStarted] = useState(false)

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [dragProgress, setDragProgress] = useState(0) // Start at beginning for battery saving mode
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoDurations, setVideoDurations] = useState<number[]>([])

  // Touch/drag state
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [startProgress, setStartProgress] = useState(0)

  // Detect touch device and battery saving mode on mount
  useEffect(() => {
    const touchSupported =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
    setIsTouchDevice(touchSupported)

    // More robust battery saving mode detection
    if (touchSupported) {
      // Check multiple indicators of battery saving mode
      const checkBatterySavingMode = async () => {
        let batterySavingIndicators = 0

        // 1. Check if we're on iOS Safari with Low Power Mode
        const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
        if (isIOSSafari) {
          // Check for reduced motion preference (often enabled in low power mode)
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            batterySavingIndicators++
          }
        }

        // 2. Test autoplay with a minimal video
        try {
          const testVideo = document.createElement("video")
          testVideo.muted = true
          testVideo.playsInline = true
          testVideo.preload = "none"
          testVideo.style.position = "absolute"
          testVideo.style.left = "-9999px"
          testVideo.style.width = "1px"
          testVideo.style.height = "1px"

          // Use one of our actual video sources for testing
          testVideo.src = videos[0].src
          document.body.appendChild(testVideo)

          const playPromise = testVideo.play()

          if (playPromise) {
            try {
              await playPromise
              // If we get here, autoplay worked
              testVideo.pause()
              document.body.removeChild(testVideo)
            } catch (error) {
              // Autoplay failed
              batterySavingIndicators += 2
              document.body.removeChild(testVideo)
            }
          } else {
            // Very old browser
            batterySavingIndicators++
            document.body.removeChild(testVideo)
          }
        } catch (error) {
          batterySavingIndicators++
        }

        // 3. Check connection type (if available)
        if ("connection" in navigator) {
          const connection = (navigator as any).connection
          if (connection && connection.saveData) {
            batterySavingIndicators++
          }
        }

        // Only enable battery saving mode if we have strong indicators
        if (batterySavingIndicators >= 2) {
          setIsBatterySavingMode(true)
          setShowBatteryWarning(true)
          setDragProgress(0) // Start at beginning
        } else {
          setIsBatterySavingMode(false)
        }
      }

      // Delay the check to avoid interfering with initial load
      setTimeout(checkBatterySavingMode, 1000)
    }

    if (touchSupported && !isBatterySavingMode) {
      document.documentElement.style.scrollSnapType = "y proximity"
      document.documentElement.style.overscrollBehavior = "none"
      document.body.style.overscrollBehavior = "none"
    } else {
      document.documentElement.style.scrollSnapType = ""
      document.documentElement.style.overscrollBehavior = ""
      document.body.style.overscrollBehavior = ""
    }
  }, [isBatterySavingMode])

  // 1. Load video metadata
  useEffect(() => {
    if (videos.length === 0) {
      setAreVideosLoading(false)
      setIsContentLoaded(true)
      return
    }
    const durations: number[] = []
    let loadedCount = 0
    videos.forEach((videoData, i) => {
      const video = document.createElement("video")
      video.src = videoData.src
      video.preload = "metadata"
      video.crossOrigin = "anonymous"
      const onLoadedMetadata = () => {
        durations[i] = video.duration
        loadedCount++
        if (loadedCount === videos.length) {
          setVideoDurations(durations)
          setTotalDuration(durations.reduce((sum, d) => sum + (d || 0), 0))
          setAreVideosLoading(false)
        }
        video.removeEventListener("loadedmetadata", onLoadedMetadata)
      }
      video.addEventListener("loadedmetadata", onLoadedMetadata)
      video.addEventListener("error", () => {
        console.error("Error loading video metadata:", videoData.src)
        durations[i] = 0
        loadedCount++
        if (loadedCount === videos.length) {
          setVideoDurations(durations)
          setTotalDuration(durations.reduce((sum, d) => sum + (d || 0), 0))
          setAreVideosLoading(false)
        }
        video.removeEventListener("loadedmetadata", onLoadedMetadata)
      })
    })
  }, [])

  // 2. "Wake up" videos
  useEffect(() => {
    if (!areVideosLoading) {
      if (videos.length === 0) {
        setIsContentLoaded(true)
        return
      }
      const allVideoElements = videoRefs.current.filter(Boolean) as HTMLVideoElement[]
      if (allVideoElements.length === videos.length) {
        const wakeUpPromises = allVideoElements.map((video) =>
          video
            .play()
            .then(() => {
              video.pause()
              video.currentTime = 0
            })
            .catch(() => {
              video.currentTime = 0
            }),
        )
        Promise.all(wakeUpPromises)
          .then(() => {
            requestAnimationFrame(() => setIsContentLoaded(true))
          })
          .catch((error) => {
            console.error("Error during video wake-up:", error)
            requestAnimationFrame(() => setIsContentLoaded(true))
          })
      }
    }
  }, [areVideosLoading])

  // Handle touch events for battery saving mode
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isBatterySavingMode || !isTouchDevice) return
      setIsDragging(true)
      setStartY(e.touches[0].clientY)
      setStartProgress(dragProgress)
    },
    [isBatterySavingMode, isTouchDevice, dragProgress],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !isBatterySavingMode || !isTouchDevice) return
      e.preventDefault()
      const deltaY = e.touches[0].clientY - startY
      const sensitivity = 0.0005 // Halved sensitivity for twice as many frames
      const newProgress = Math.max(0, Math.min(1, startProgress - deltaY * sensitivity))
      setDragProgress(newProgress)

      if (!hasVideoPlaybackStarted && newProgress !== 0) {
        setHasVideoPlaybackStarted(true)
        setShowBatteryWarning(false)
      }
    },
    [isDragging, isBatterySavingMode, isTouchDevice, startY, startProgress, hasVideoPlaybackStarted],
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isBatterySavingMode && isTouchDevice) {
      document.addEventListener("touchstart", handleTouchStart, { passive: false })
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)

      return () => {
        document.removeEventListener("touchstart", handleTouchStart)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isBatterySavingMode, isTouchDevice, handleTouchStart, handleTouchMove, handleTouchEnd])

  // 3. Handle scroll (normal mode)
  const handleScroll = useCallback(() => {
    if (areVideosLoading || !isContentLoaded || !containerRef.current || isBatterySavingMode) return
    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    const maxScroll = documentHeight - windowHeight
    if (maxScroll <= 0) return
    const progress = Math.min(scrollTop / maxScroll, 1)
    setScrollProgress(progress)
    if (showScrollHint && progress > 0.005) {
      setShowScrollHint(false)
    }
  }, [areVideosLoading, isContentLoaded, isBatterySavingMode, showScrollHint])

  useEffect(() => {
    if (!isBatterySavingMode) {
      window.addEventListener("scroll", handleScroll, { passive: true })
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll, isBatterySavingMode])

  // Update video based on progress (works for both modes)
  useEffect(() => {
    if (areVideosLoading || !isContentLoaded || totalDuration === 0) return

    const progress = isBatterySavingMode ? dragProgress : scrollProgress
    const totalVideoTime = totalDuration * progress
    let accumulatedTime = 0
    let targetVideoIndex = 0
    let timeInTargetVideo = 0

    for (let i = 0; i < videoDurations.length; i++) {
      const currentVideoDuration = videoDurations[i] || 0
      if (totalVideoTime <= accumulatedTime + currentVideoDuration) {
        targetVideoIndex = i
        timeInTargetVideo = totalVideoTime - accumulatedTime
        break
      }
      accumulatedTime += currentVideoDuration
    }

    if (progress === 1 && videoDurations.length > 0) {
      targetVideoIndex = videoDurations.length - 1
      timeInTargetVideo = videoDurations[targetVideoIndex] || 0
    }

    setCurrentVideoIndex(targetVideoIndex)
    const currentVideoElement = videoRefs.current[targetVideoIndex]
    if (currentVideoElement && !isNaN(timeInTargetVideo) && videoDurations[targetVideoIndex]) {
      const safeTime = Math.min(timeInTargetVideo, videoDurations[targetVideoIndex] - 0.01)
      currentVideoElement.currentTime = Math.max(0, safeTime)
    }
  }, [
    areVideosLoading,
    isContentLoaded,
    totalDuration,
    videoDurations,
    scrollProgress,
    dragProgress,
    isBatterySavingMode,
  ])

  // 4. Set document height (only for normal mode)
  useEffect(() => {
    if (!areVideosLoading && totalDuration > 0 && !isBatterySavingMode) {
      const scrollMultiplier = isTouchDevice ? 800 : 1500
      const totalScrollHeight = totalDuration * scrollMultiplier + window.innerHeight
      document.body.style.height = `${totalScrollHeight}px`

      if (isTouchDevice) {
        const snapContainer = document.getElementById("snap-container")
        if (snapContainer) {
          snapContainer.innerHTML = ""
          const snapPointCount = Math.ceil(totalDuration * 2)
          for (let i = 0; i <= snapPointCount; i++) {
            const snapPoint = document.createElement("div")
            snapPoint.style.cssText = `position:absolute; top:${(i / snapPointCount) * (totalScrollHeight - window.innerHeight)}px; width:100%; height:1px; scroll-snap-align:start; pointer-events:none;`
            snapContainer.appendChild(snapPoint)
          }
        }
      }
    } else if (!areVideosLoading && (totalDuration === 0 || isBatterySavingMode)) {
      document.body.style.height = "100vh"
    }
  }, [areVideosLoading, totalDuration, isTouchDevice, isBatterySavingMode])

  const scrollbarHeight = Math.min(256, totalDuration > 0 ? totalDuration * 10 : 0)
  const scrollbarThumbHeight = 20
  const currentProgress = isBatterySavingMode ? dragProgress : scrollProgress
  const scrollbarPosition = currentProgress * (scrollbarHeight - scrollbarThumbHeight)

  return (
    <>
      <style jsx global>{`
      html {
        -webkit-overflow-scrolling: auto;
        scroll-behavior: auto !important;
        ${isBatterySavingMode ? "overflow: hidden;" : ""}
      }
      body { 
        overflow-x: hidden; 
        -webkit-overflow-scrolling: auto;
        ${isBatterySavingMode ? "overflow-y: hidden;" : ""}
      }
      ::-webkit-scrollbar { display: none; }
      html { -ms-overflow-style: none; scrollbar-width: none; }
      
      @keyframes sweep {
        0% {
          background-position: -200% 0;
        }
        100% {
          background-position: 200% 0;
        }
      }
      
      .animate-sweep {
        animation: sweep 2s ease-in-out infinite;
      }
      
      video {
        background-color: transparent;
        object-fit: contain;
      }
    `}</style>

      {/* Invisible container for scroll snap points - only rendered for touch devices in normal mode */}
      {isTouchDevice && !isBatterySavingMode && (
        <div id="snap-container" className="fixed inset-0 pointer-events-none z-0" />
      )}

      {/* Loading Screen */}
      <div
        className={`fixed inset-0 flex items-center justify-center bg-white transition-opacity duration-500 ease-in-out z-20
              ${isContentLoaded ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <div className="text-sm font-light tracking-wider bg-gradient-to-r from-gray-400 via-gray-800 to-gray-400 bg-clip-text text-transparent animate-sweep bg-[length:200%_100%]">
          Loading...
        </div>
      </div>

      {/* Main Content */}
      {!areVideosLoading && (
        <div
          ref={containerRef}
          className={`fixed inset-0 bg-white transition-opacity duration-1000 ease-in-out z-10
                    ${isContentLoaded ? "opacity-100" : "opacity-0"}`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {videos.map((video, index) => (
              <video
                key={video.name}
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.src}
                className={`max-h-[300px] w-auto transition-opacity duration-300 ${index === currentVideoIndex ? "opacity-100" : "opacity-0 absolute"}`}
                style={{
                  backgroundColor: "transparent",
                  objectFit: "contain",
                  maxWidth: "100%",
                  height: "auto",
                }}
                muted
                playsInline
                webkit-playsinline="true"
                preload="metadata"
                crossOrigin="anonymous"
                onLoadStart={() => {
                  const videoEl = videoRefs.current[index]
                  if (videoEl) {
                    videoEl.style.transform = "translateZ(0)"
                  }
                }}
                onCanPlay={() => {
                  const videoEl = videoRefs.current[index]
                  if (videoEl && videoEl.readyState >= 2) {
                    videoEl.style.visibility = "visible"
                  }
                }}
              />
            ))}
          </div>
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            {videos.map((video, index) => (
              <h1
                key={video.name}
                className={`text-gray-400 text-xl font-light tracking-wider transition-opacity duration-500 absolute left-1/2 transform -translate-x-1/2 ${index === currentVideoIndex ? "opacity-100" : "opacity-0"}`}
              >
                {video.name}
              </h1>
            ))}
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div
              className={`text-gray-400 text-sm font-light tracking-wider transition-opacity duration-500 ${showScrollHint && !isBatterySavingMode ? "opacity-100" : "opacity-0"}`}
            >
              scroll to play!
            </div>
            <div
              className={`text-gray-400 text-sm font-light tracking-wider transition-opacity duration-500 ${isBatterySavingMode && !showScrollHint ? "opacity-100" : "opacity-0"}`}
            >
              drag to play!
            </div>
          </div>

          {/* Battery saving mode warning */}
          {isBatterySavingMode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div
                className={`text-gray-400 text-xs font-light tracking-wider transition-opacity duration-1000 flex items-center gap-1 ${showBatteryWarning ? "opacity-100" : "opacity-0"}`}
              >
                <span className="text-xs">⚠️</span>
                <span>Performance limited (battery saving mode?)</span>
              </div>
            </div>
          )}

          {scrollbarHeight > 0 && (
            <div
              className="fixed right-4 top-1/2 transform -translate-y-1/2"
              style={{ height: `${scrollbarHeight}px` }}
            >
              <div className="w-px h-full bg-gray-200 relative">
                <div
                  className="w-px bg-gray-500 absolute"
                  style={{ height: `${scrollbarThumbHeight}px`, top: `${scrollbarPosition}px` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
