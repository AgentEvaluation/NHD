import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { 
  Home,
  BookOpen,
  Users,
  PlayCircle,
  ChartBarStacked,
} from 'lucide-react'
// import { useTheme } from 'next-themes'

export default function Sidebar() {
  const pathname = usePathname()
  // const { theme, setTheme } = useTheme()
  
  const navItems = [
    {
      label: 'Configuration',
      icon: Home,
      href: '/tools'
    },
    {
      label: 'Scenarios',
      icon: BookOpen,
      href: '/tools/test-cases'
    },
    {
      label: 'Personas',
      icon: Users,
      href: '/tools/personas'
    },
    {
      label: 'Runs',
      icon: PlayCircle,
      href: '/tools/runs'
    },
    {
      label: 'Metrics',
      icon: ChartBarStacked,
      href: '/tools/metrics'
    }
  ]
  
  return (
    <div className="w-64 border-r border-border bg-card shadow-sm h-screen flex flex-col">
      <div className="flex-1 py-2 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} passHref>
              <Button 
                variant="ghost" 
                className={`w-full justify-start rounded-[var(--radius)] ${
                  pathname === item.href ? 'bg-accent text-accent-foreground font-medium' : ''
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
