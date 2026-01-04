"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={(theme === "dark" ? "dark" : "light") as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-green-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-yellow-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-white" />,
      }}
      style={
        {
          /* Default (all toasts) */
          "--normal-bg": "#020617",       // near-black
          "--normal-text": "#ffffff",     // white text
          "--normal-border": "#1e293b",   // subtle border
          "--border-radius": "10px",

          /* Success */
          "--success-bg": "#022c22",
          "--success-text": "#ffffff",
          "--success-border": "#065f46",

          /* Error */
          "--error-bg": "#3b0a0a",
          "--error-text": "#ffffff",
          "--error-border": "#7f1d1d",

          /* Warning */
          "--warning-bg": "#3b2a08",
          "--warning-text": "#ffffff",
          "--warning-border": "#92400e",

          /* Info */
          "--info-bg": "#082f49",
          "--info-text": "#ffffff",
          "--info-border": "#075985",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
