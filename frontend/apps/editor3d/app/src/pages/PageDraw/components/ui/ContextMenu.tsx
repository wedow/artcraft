import React, { useEffect, useRef } from 'react';

interface MenuPosition {
  x: number;
  y: number;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  divider?: boolean;
}

interface ContextMenuProps {
  items: MenuItem[];
  onClose: () => void;
  position: MenuPosition;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, onClose, position }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className="fixed z-50 min-w-[220px] bg-[#1A1A1A] rounded-lg shadow-xl border border-[#333333] py-1 select-none"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#333333] text-[#ECECEC] text-[13px] transition-colors duration-75 ease-in-out"
          >
            <span className="w-5 h-5 flex items-center justify-center text-[#ECECEC]">
              {item.icon}
            </span>
            <span className="font-normal">{item.label}</span>
          </button>
          {item.divider && <div className="h-[1px] bg-[#333333] mx-2 my-1" />}
        </React.Fragment>
      ))}
    </div>
  );
};

// Example usage with icons
const menuItems: MenuItem[] = [
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 3L4 7.5L12 12L20 7.5L12 3Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 16.5L12 21L20 16.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 12L12 16.5L20 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Convert to 3D',
    onClick: () => console.log('Convert to 3D')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 4v16h16M4 20l16-16" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Remove background',
    onClick: () => console.log('Remove background')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 10V14M8 6H16C17.1046 6 18 6.89543 18 8V16C18 17.1046 17.1046 18 16 18H8C6.89543 18 6 17.1046 6 16V8C6 6.89543 6.89543 6 8 6Z" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Lock',
    onClick: () => console.log('Lock'),
    divider: true
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 15L12 8L19 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Bring to front',
    onClick: () => console.log('Bring to front')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 14L12 10L16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Bring forward',
    onClick: () => console.log('Bring forward')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 10L12 14L16 10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Send backward',
    onClick: () => console.log('Send backward')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 9L12 16L19 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Send to back',
    onClick: () => console.log('Send to back'),
    divider: true
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M16 8V6M16 8H8M16 8V16M8 8V6M8 8V16M8 16H6M8 16H16M16 16H18M6 6H8M8 6H16M16 6H18" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Duplicate',
    onClick: () => console.log('Duplicate')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M7 16L17 8M7 8L17 16" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Flip Horizontal',
    onClick: () => console.log('Flip Horizontal')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M8 7L16 17M8 17L16 7" strokeWidth="2" strokeLinecap="round"/>
    </svg>,
    label: 'Flip Vertical',
    onClick: () => console.log('Flip Vertical')
  },
  {
    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 12V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H12" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 15H4V20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>,
    label: 'Fit to screen',
    onClick: () => console.log('Fit to screen')
  }
];

// Container component that handles the right-click
export const ContextMenuContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [position, setPosition] = React.useState<MenuPosition>({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  return (
    <div onContextMenu={handleContextMenu} className="w-full h-full">
      {children}
      {showMenu && (
        <ContextMenu
          items={menuItems}
          position={position}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};
