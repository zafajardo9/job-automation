import { Moon, Sun } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { toggleTheme } from '~/lib/theme'

export function ThemeToggle() {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}
