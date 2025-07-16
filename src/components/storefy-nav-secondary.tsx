import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function StorefyNavSecondary({
  items,
  className,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    onClick?: () => void
  }[]
  className?: string
}) {
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title}
                onClick={item.onClick}
                className={cn(
                  "transition-colors duration-200",
                  item.isActive && "bg-primary/10 text-primary font-medium"
                )}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
