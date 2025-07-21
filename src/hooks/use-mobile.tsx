import * as React from "react"

// Enhanced breakpoints for better responsive design
const MOBILE_BREAKPOINT = 640  // sm in Tailwind
const TABLET_BREAKPOINT = 768  // md in Tailwind
const DESKTOP_BREAKPOINT = 1024 // lg in Tailwind
const LARGE_DESKTOP_BREAKPOINT = 1280 // xl in Tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Set initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Add listener
    mql.addEventListener("change", onChange)

    // Cleanup function
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT)
    }

    // Set initial value
    setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT)

    // Add listener
    mql.addEventListener("change", onChange)

    // Cleanup function
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isTablet
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)
    }

    // Set initial value
    setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT)

    // Add listener
    mql.addEventListener("change", onChange)

    // Cleanup function
    return () => {
      mql.removeEventListener("change", onChange)
    }
  }, [])

  return !!isDesktop
}

export function useScreenSize() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop: !isMobile && !isTablet && isDesktop,
    // Convenience getters
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop
  }
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile?: T
  tablet?: T
  desktop?: T
  default: T
}): T {
  const { isMobile, isTablet, isDesktop } = useScreenSize()

  if (isMobile && values.mobile !== undefined) return values.mobile
  if (isTablet && values.tablet !== undefined) return values.tablet
  if (isDesktop && values.desktop !== undefined) return values.desktop

  return values.default
}

// Hook for responsive grid columns
export function useResponsiveColumns(config: {
  mobile?: number
  tablet?: number
  desktop?: number
  default: number
}): number {
  return useResponsiveValue(config)
}
