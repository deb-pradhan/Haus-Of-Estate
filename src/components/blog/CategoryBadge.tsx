interface Category {
  title: string
  slug: string
  color?: string
}

interface CategoryBadgeProps {
  category: Category
  size?: 'sm' | 'default'
}

export function CategoryBadge({ category, size = 'default' }: CategoryBadgeProps) {
  const bgColor = category.color || '#1f4f2f'
  const isLight = isLightColor(bgColor)

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium tracking-tight ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
      style={{
        backgroundColor: bgColor,
        color: isLight ? '#1e1f21' : '#ffffff',
      }}
    >
      {category.title}
    </span>
  )
}

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 155
}