import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupHeader,
  SidebarGroupTitle,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function StorefyNavDocuments({
  items,
  title = "Store Management",
}: {
  items: {
    name: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    onClick?: () => void
  }[]
  title?: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupHeader>
        <SidebarGroupTitle>{title}</SidebarGroupTitle>
      </SidebarGroupHeader>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton 
                tooltip={item.name}
                onClick={item.onClick}
                className={cn(
                  "transition-colors duration-200",
                  item.isActive && "bg-primary/10 text-primary font-medium"
                )}
              >
                {item.icon && <item.icon />}
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
