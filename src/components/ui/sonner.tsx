import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"
import { X } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      offset="160px"
      className="toaster group"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:pr-14 group-[.toaster]:min-w-[280px] group-[.toaster]:max-w-[90vw] [&[data-type='loading']]:pr-14",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:!absolute group-[.toast]:!right-2 group-[.toast]:!top-1/2 group-[.toast]:!-translate-y-1/2 group-[.toast]:!left-auto group-[.toast]:!bg-muted group-[.toast]:!border-0 group-[.toast]:!w-10 group-[.toast]:!h-10 group-[.toast]:!rounded-xl group-[.toast]:!opacity-100 group-[.toast]:hover:!bg-muted-foreground/20 [&]:!transform-none [&]:!translate-y-[-50%]",
          loading: "group-[.toaster]:pr-14",
        },
      }}
      closeButton
      icons={{
        close: <X className="h-5 w-5" />,
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
