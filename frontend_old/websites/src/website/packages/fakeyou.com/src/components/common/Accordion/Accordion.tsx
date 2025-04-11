import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import "./Accordion.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { animated, useSpring } from "@react-spring/web";

interface AccordionProps {
  className?: string;
  children: React.ReactNode;
}

interface AccordionItemProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

interface AccordionContextType {
  openItems: string[];
  toggleItem: (title: string) => void;
}

const AccordionContext = createContext<AccordionContextType | undefined>(
  undefined
);

function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  const { openItems, toggleItem } = useContext(
    AccordionContext
  ) as AccordionContextType;
  const isOpen = openItems.includes(title);

  const [contentHeight, setContentHeight] = useState<number>(
    defaultOpen ? 0 : 0
  );
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Update content height whenever the accordion item is opened or closed
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  useEffect(() => {
    // Adjust height when the content changes, only if the item is open
    if (isOpen && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  const heightProps = useSpring({
    height: isOpen ? `${contentHeight}px` : "0px",
    config: { tension: 300, friction: 25, clamp: true },
  });

  const contentOpacityProps = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 25, clamp: true },
  });

  const handleClick = () => {
    toggleItem(title);
  };

  return (
    <div className={`fy-accordion-item ${isOpen ? "open" : "closed"}`}>
      <div
        className={`fy-accordion-header p-3 ${isOpen ? "open" : "closed"}`}
        onClick={handleClick}
      >
        {title}
        <span className={`caret-icon ${isOpen ? "caret-rotated" : ""}`}>
          <FontAwesomeIcon icon={faChevronDown} />
        </span>
      </div>
      <animated.div
        style={{ ...heightProps, ...(!isOpen ? { overflow: "hidden" } : {}) }}
      >
        <animated.div
          ref={contentRef}
          style={contentOpacityProps}
          className="fy-accordion-content"
        >
          {children}
        </animated.div>
      </animated.div>
    </div>
  );
}

function Accordion({ children, className }: AccordionProps) {
  // Extract titles of items that should be initially open
  const defaultOpenTitles = React.Children.toArray(children)
    .filter((child: any) => child.props.defaultOpen)
    .map((child: any) => child.props.title);

  // Initialize openItems with the titles of items that should be open
  const [openItems, setOpenItems] = useState<string[]>(defaultOpenTitles);

  const toggleItem = (title: string) => {
    if (openItems.includes(title)) {
      setOpenItems(openItems.filter(item => item !== title));
    } else {
      setOpenItems([...openItems, title]);
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div className={`d-flex flex-column gap-3 ${className}`}>{children}</div>
    </AccordionContext.Provider>
  );
}

Accordion.Item = AccordionItem;

export default Accordion;
