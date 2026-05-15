import { useState, Children, cloneElement } from "react"

function TooltipProvider({ children }) {
  return children
}

function Tooltip({ children }) {
  const [open, setOpen] = useState(false)
  const arr = Children.toArray(children)
  const trigger = arr.find(c => c.type === TooltipTrigger)
  const content = arr.find(c => c.type === TooltipContent)
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {trigger}
      {open && content}
    </span>
  )
}

function TooltipTrigger({ children }) {
  return children
}

function TooltipContent({ children, style }) {
  return (
    <span style={{
      position: 'absolute', bottom: '100%', left: '50%',
      transform: 'translateX(-50%)', marginBottom: 6,
      padding: '4px 8px', borderRadius: 6,
      whiteSpace: 'nowrap', pointerEvents: 'none',
      fontSize: 11, fontWeight: 600,
      background: '#032221', color: '#00DF81',
      border: '1px solid rgba(0,223,129,0.15)',
      zIndex: 9999,
      ...style,
    }}>
      {children}
    </span>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
