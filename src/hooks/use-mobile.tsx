import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

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

export function useScreenSize() {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet
  }
}
